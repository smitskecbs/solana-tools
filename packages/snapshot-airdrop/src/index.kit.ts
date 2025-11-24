import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import {
  createSolanaRpc,
  address,
  type Address
} from "@solana/kit";
import { PublicKey, Connection } from "@solana/web3.js";

const RPC_URL = process.env.RPC_URL ?? "https://api.mainnet-beta.solana.com";
const DEFAULT_MINT =
  process.env.MINT ?? "B9z8cEWFmc7LvQtjKsaLoKqW5MJmGRCWqs1DPKupCfkk";
const TOKEN_PROGRAM = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";

// SPL token account layout
const MINT_OFFSET = 0;          // 32 bytes
const OWNER_OFFSET = 32;        // 32 bytes
const AMOUNT_OFFSET = 64;       // u64 LE
const TOKEN_ACCOUNT_SIZE = 165; // standard token account size

type HolderRow = {
  owner: string;
  tokenAccount: string;
  amountRaw: bigint;
  amountUi: number;
};

function parseArgs() {
  const args = process.argv.slice(2);
  const out: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a.startsWith("--")) {
      const k = a.slice(2);
      const v = args[i + 1];
      if (!v || v.startsWith("--")) out[k] = "true";
      else {
        out[k] = v;
        i++;
      }
    }
  }
  return out;
}

function u64LE(buf: Buffer, offset: number): bigint {
  let n = 0n;
  for (let i = 0; i < 8; i++) {
    n |= BigInt(buf[offset + i]!) << (8n * BigInt(i));
  }
  return n;
}

function ensureDir(p: string) {
  fs.mkdirSync(p, { recursive: true });
}

async function main() {
  const args = parseArgs();

  const mintStr = args["mint"] ?? DEFAULT_MINT;
  const minUiStr = args["min"] ?? "0";
  const excludeStr = args["exclude"] ?? "";

  const mint = address(mintStr) as Address;
  const mintPk = new PublicKey(mintStr);

  const minUi = Number(minUiStr);
  const exclude = excludeStr
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const rpc = createSolanaRpc(RPC_URL);

  // decimals via web3 (reliable)
  const web3Conn = new Connection(RPC_URL, "confirmed");
  const supplyResp = await web3Conn.getTokenSupply(mintPk);
  const decimals = supplyResp.value.decimals;

  console.log("RPC:", RPC_URL);
  console.log("Mint:", mintStr);
  console.log("Decimals:", decimals);
  console.log("min balance (ui):", minUi);
  console.log("exclude:", exclude.length ? exclude.join(",") : "(none)");

  // Kit-first program accounts (shape differs per RPC)
  const rawResp: any = await (rpc as any).getProgramAccounts(
    address(TOKEN_PROGRAM),
    {
      encoding: "base64",
      filters: [
        { dataSize: TOKEN_ACCOUNT_SIZE },
        { memcmp: { offset: MINT_OFFSET, bytes: mintStr } }
      ]
    }
  );

  let accounts: any[] = [];
  if (Array.isArray(rawResp)) accounts = rawResp;
  else if (Array.isArray(rawResp?.value)) accounts = rawResp.value;
  else if (Array.isArray(rawResp?.values)) accounts = rawResp.values;
  else if (Array.isArray(rawResp?.result?.value)) accounts = rawResp.result.value;
  else if (Array.isArray(rawResp?.result?.values)) accounts = rawResp.result.values;
  else if (Array.isArray(rawResp?.accounts)) accounts = rawResp.accounts;

  // Fallback to web3 if Kit RPC is weird
  if (!Array.isArray(accounts) || accounts.length === 0) {
    console.log("⚠️  Kit getProgramAccounts returned no usable array. Falling back to web3.js...");
    const web3Accounts = await web3Conn.getProgramAccounts(
      new PublicKey(TOKEN_PROGRAM),
      {
        encoding: "base64",
        filters: [
          { dataSize: TOKEN_ACCOUNT_SIZE },
          { memcmp: { offset: MINT_OFFSET, bytes: mintStr } }
        ]
      }
    );

    accounts = web3Accounts.map((a) => ({
      pubkey: a.pubkey.toBase58(),
      account: { data: [a.account.data.toString("base64")] }
    }));
  }

  console.log("Token accounts found:", accounts.length);

  const holders: HolderRow[] = [];

  for (const a of accounts) {
    const pubkeyStr =
      a.pubkey?.toString?.() ??
      a.pubkey ??
      "";

    const dataB64 =
      a.account?.data?.[0] ??
      a.account?.data ??
      null;

    if (!dataB64) continue;

    const data = Buffer.from(dataB64, "base64");

    const owner = new PublicKey(
      data.subarray(OWNER_OFFSET, OWNER_OFFSET + 32)
    ).toBase58();

    const amountRaw = u64LE(data, AMOUNT_OFFSET);
    if (amountRaw === 0n) continue;

    const amountUi = Number(amountRaw) / 10 ** decimals;
    if (amountUi < minUi) continue;
    if (exclude.includes(owner)) continue;

    holders.push({
      owner,
      tokenAccount: pubkeyStr,
      amountRaw,
      amountUi
    });
  }

  holders.sort((x, y) => y.amountUi - x.amountUi);
  console.log("Non-zero holders after filters:", holders.length);

  const mintFolder = path.join("snapshots", mintStr);
  ensureDir(mintFolder);

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const jsonPath = path.join(mintFolder, `snapshot-${stamp}.json`);
  const csvPath = path.join(mintFolder, `snapshot-${stamp}.csv`);

  const jsonSafe = holders.map((h) => ({
    owner: h.owner,
    tokenAccount: h.tokenAccount,
    amountRaw: h.amountRaw.toString(),
    amountUi: h.amountUi
  }));

  fs.writeFileSync(jsonPath, JSON.stringify(jsonSafe, null, 2), "utf8");

  const csvLines = [
    "owner,tokenAccount,amountRaw,amountUi",
    ...holders.map(
      (h) =>
        `${h.owner},${h.tokenAccount},${h.amountRaw.toString()},${h.amountUi}`
    )
  ];
  fs.writeFileSync(csvPath, csvLines.join("\n"), "utf8");

  console.log("\nSaved snapshot:");
  console.log("JSON:", jsonPath);
  console.log("CSV :", csvPath);

  console.log("\nTop 20 holders:");
  holders.slice(0, 20).forEach((h, i) => {
    console.log(`${i + 1}. ${h.owner}  ${h.amountUi.toLocaleString()} CBS`);
  });

  console.log("\nDone.\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

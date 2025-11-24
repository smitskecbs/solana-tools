import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";

const RPC_URL = process.env.RPC_URL ?? clusterApiUrl("mainnet-beta");
const DEFAULT_MINT = process.env.MINT ?? "B9z8cEWFmc7LvQtjKsaLoKqW5MJmGRCWqs1DPKupCfkk";
const TOKEN_PROGRAM = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");

const MINT_OFFSET = 0;
const OWNER_OFFSET = 32;
const AMOUNT_OFFSET = 64;
const TOKEN_ACCOUNT_SIZE = 165;

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
      else { out[k] = v; i++; }
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

  const minUi = Number(minUiStr);
  const exclude = excludeStr
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);

  const conn = new Connection(RPC_URL, "confirmed");
  const mintPk = new PublicKey(mintStr);
  const supply = await conn.getTokenSupply(mintPk);
  const decimals = supply.value.decimals;

  console.log("RPC:", RPC_URL);
  console.log("Mint:", mintStr);
  console.log("Decimals:", decimals);
  console.log("min balance (ui):", minUi);
  console.log("exclude:", exclude.length ? exclude.join(",") : "(none)");

  const accounts = await conn.getProgramAccounts(TOKEN_PROGRAM, {
    filters: [
      { dataSize: TOKEN_ACCOUNT_SIZE },
      { memcmp: { offset: MINT_OFFSET, bytes: mintStr } }
    ]
  });

  console.log("Token accounts found:", accounts.length);

  const holders: HolderRow[] = [];

  for (const acc of accounts) {
    const data = acc.account.data;
    const owner = new PublicKey(data.subarray(OWNER_OFFSET, OWNER_OFFSET + 32)).toBase58();
    const amountRaw = u64LE(data, AMOUNT_OFFSET);
    if (amountRaw === 0n) continue;

    const amountUi = Number(amountRaw) / 10 ** decimals;
    if (amountUi < minUi) continue;
    if (exclude.includes(owner)) continue;

    holders.push({
      owner,
      tokenAccount: acc.pubkey.toBase58(),
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
  const csvPath  = path.join(mintFolder, `snapshot-${stamp}.csv`);

  const jsonSafe = holders.map(h => ({
    owner: h.owner,
    tokenAccount: h.tokenAccount,
    amountRaw: h.amountRaw.toString(),
    amountUi: h.amountUi
  }));

  fs.writeFileSync(jsonPath, JSON.stringify(jsonSafe, null, 2), "utf8");

  const csvLines = [
    "owner,tokenAccount,amountRaw,amountUi",
    ...holders.map(h =>
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

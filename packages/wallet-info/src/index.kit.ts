import "dotenv/config";
import { createSolanaRpc, address, type Address } from "@solana/kit";
import { PublicKey, Connection } from "@solana/web3.js";

// safe JSON fetch
async function safeFetch(url: string, opts: any = {}) {
  try {
    const res = await fetch(url, opts);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

const HELIUS_KEY = process.env.HELIUS_API_KEY || null;

// read cli arg
const addrStr = process.argv[2];
if (!addrStr) {
  console.log(
    "Usage: npm run dev:kit -w ./packages/wallet-info -- <WALLET_ADDRESS>"
  );
  process.exit(1);
}

const RPC_URL = process.env.RPC_URL ?? "https://api.mainnet-beta.solana.com";

const rpc = createSolanaRpc(RPC_URL);
const wallet = address(addrStr) as Address;

console.log("\n🔍 Wallet analysis for:", wallet, "\n");

async function getSolBalance() {
  try {
    const lamports = await rpc.getBalance(wallet).send();
    return Number(lamports.value) / 1e9;
  } catch {
    return null;
  }
}

async function getSplBalances() {
  try {
    const TOKEN_PROGRAM = address(
      "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
    );

    const resp = await rpc
      .getTokenAccountsByOwner(
        wallet,
        { programId: TOKEN_PROGRAM },
        { encoding: "jsonParsed" }
      )
      .send();

    const accounts = resp.value ?? [];

    return accounts
      .map((acc: any) => {
        const info = acc.account.data.parsed.info;
        const amount = info.tokenAmount.uiAmount as number;
        const mint = info.mint as string;
        return { mint, amount };
      })
      .filter((t) => t.amount > 0);
  } catch {
    return [];
  }
}

// Kit-first transactions, with web3 fallback if RPC returns nulls
async function getTransactions() {
  // ---------------------------
  // 1) Try via Kit
  // ---------------------------
  try {
    const sigResp = await rpc
      .getSignaturesForAddress(wallet, { limit: 10 })
      .send();

    const sigs = sigResp.value ?? [];
    const txs: any[] = [];

    for (const s of sigs) {
      const txResp = await rpc
        .getTransaction(s.signature, {
          maxSupportedTransactionVersion: 0,
          commitment: "confirmed",
        })
        .send();

      const tx = txResp.value;
      if (!tx) continue;

      const meta: any = tx.meta;
      const pre = meta?.preBalances ?? [];
      const post = meta?.postBalances ?? [];

      const solChange =
        pre.length && post.length ? (post[0] - pre[0]) / 1e9 : 0;

      const blockTime = tx.blockTime
        ? new Date(tx.blockTime * 1000).toLocaleString()
        : "unknown";

      // detect type (best-effort)
      let type = "transfer";
      const inner = meta?.innerInstructions ?? [];
      if (inner.length) {
        const ix = inner.flatMap((i: any) => i.instructions ?? []);
        if (ix.some((i: any) => i.program === "spl-token")) type = "token";
        if (
          ix.some(
            (i: any) =>
              i.programId ===
              "ComputeBudget111111111111111111111111111111"
          )
        )
          type = "swap";
      }

      txs.push({
        signature: s.signature,
        solChange,
        type,
        time: blockTime,
      });
    }

    // If kit got something, return it
    if (txs.length > 0) return txs;
  } catch {
    // ignore -> fallback
  }

  // ---------------------------
  // 2) Fallback via web3.js
  // ---------------------------
  try {
    console.log("\n⚠️  Kit getTransaction returned no data on this RPC. Using web3.js fallback for txs...\n");

    const connection = new Connection(RPC_URL, "confirmed");
    const walletPk = new PublicKey(wallet);

    const sigs = await connection.getSignaturesForAddress(walletPk, {
      limit: 10,
    });

    const txs: any[] = [];

    for (const sig of sigs) {
      const tx = await connection.getTransaction(sig.signature, {
        maxSupportedTransactionVersion: 0,
      });
      if (!tx) continue;

      const meta = tx.meta!;
      const pre = meta.preBalances;
      const post = meta.postBalances;

      const solChange = (post[0] - pre[0]) / 1e9;
      const blockTime = tx.blockTime
        ? new Date(tx.blockTime * 1000).toLocaleString()
        : "unknown";

      let type = "transfer";
      if (meta.innerInstructions?.length) {
        const ix = meta.innerInstructions.flatMap((i) => i.instructions);
        if (ix.some((i: any) => i.program === "spl-token")) type = "token";
        if (
          ix.some(
            (i: any) =>
              i.programId ===
              "ComputeBudget111111111111111111111111111111"
          )
        )
          type = "swap";
      }

      txs.push({
        signature: sig.signature,
        solChange,
        type,
        time: blockTime,
      });
    }

    return txs;
  } catch {
    return [];
  }
}

async function getHeliusEnhanced() {
  if (!HELIUS_KEY) return null;

  const url = `https://api.helius.xyz/v0/addresses/${wallet}?api-key=${HELIUS_KEY}`;
  const json = await safeFetch(url);
  if (!json) return null;

  return {
    labels: json.labels || [],
    totalReceived: json.totalReceived || null,
    totalSent: json.totalSent || null,
    ownerType: json.accountType || "unknown",
    createdAt: json.createdAt || null,
  };
}

(async () => {
  const sol = await getSolBalance();
  console.log(`💰 SOL Balance: ${sol} SOL`);

  const spl = await getSplBalances();
  console.log(`📦 SPL Tokens (${spl.length}):`);
  if (spl.length === 0) console.log("  (none)");
  else spl.forEach((t) => console.log(`  • ${t.amount} of ${t.mint}`));

  const txs = await getTransactions();
  console.log(`\n📜 Last ${txs.length} transactions:`);
  if (txs.length === 0) console.log("  (none)");
  else
    txs.forEach((t) =>
      console.log(
        `  • ${t.time} | ${t.type} | ${t.solChange} SOL | ${t.signature}`
      )
    );

  const h = await getHeliusEnhanced();
  if (h) {
    console.log("\n🔎 Helius Enhanced:");
    console.log("  Labels:      ", h.labels.join(", ") || "(none)");
    console.log("  Received:    ", h.totalReceived, "lamports");
    console.log("  Sent:        ", h.totalSent, "lamports");
    console.log("  Owner type:  ", h.ownerType);
    console.log(
      "  Created:     ",
      h.createdAt ? new Date(h.createdAt * 1000).toLocaleString() : "unknown"
    );
  } else {
    console.log("\n🔎 Helius Enhanced: (not used — no API key)");
  }

  console.log("\nDone.\n");
})();

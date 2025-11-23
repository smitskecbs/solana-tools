import "dotenv/config";
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";

// safe JSON fetch
async function safeFetch(url: string, opts: RequestInit = {}) {
  try {
    const res = await fetch(url, opts);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// read env keys
const HELIUS_KEY = process.env.HELIUS_API_KEY || null;

// read cli arg
const addrStr = process.argv[2];
if (!addrStr) {
  console.log("Usage: npm run dev -w ./packages/wallet-info -- <WALLET_ADDRESS>");
  process.exit(1);
}

// rpc
const rpc = process.env.RPC_URL || clusterApiUrl("mainnet-beta");
const connection = new Connection(rpc, "confirmed");
const wallet = new PublicKey(addrStr);

console.log("\n🔍 Wallet analysis for:", wallet.toBase58(), "\n");

async function getSolBalance() {
  try {
    const lamports = await connection.getBalance(wallet);
    return lamports / 1e9;
  } catch {
    return null;
  }
}

async function getSplBalances() {
  try {
    const accounts = await connection.getParsedTokenAccountsByOwner(wallet, {
      programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA")
    });

    return accounts.value
      .map((acc) => {
        const info: any = acc.account.data.parsed.info;
        const amount = info.tokenAmount.uiAmount as number;
        const mint = info.mint as string;
        return { mint, amount };
      })
      .filter((t) => t.amount > 0);
  } catch {
    return [];
  }
}

async function getTransactions() {
  try {
    const sigs = await connection.getSignaturesForAddress(wallet, { limit: 10 });
    const txs: {
      signature: string;
      solChange: number;
      type: string;
      time: string;
    }[] = [];

    for (const sig of sigs) {
      const tx = await connection.getTransaction(sig.signature, {
        maxSupportedTransactionVersion: 0
      });
      if (!tx) continue;

      const meta = tx.meta;
      if (!meta) continue; // guard for TS + safety

      const pre = meta.preBalances ?? [];
      const post = meta.postBalances ?? [];

      const solChange =
        pre.length && post.length ? (post[0] - pre[0]) / 1e9 : 0;

      const blockTime = tx.blockTime
        ? new Date(tx.blockTime * 1000).toLocaleString()
        : "unknown";

      // detect type (innerInstructions vary in shape, so treat as any)
      let type = "transfer";
      const inner: any[] = meta.innerInstructions ?? [];
      if (inner.length) {
        const ix: any[] = inner.flatMap((i) => i.instructions ?? []);
        if (ix.some((i) => i.program === "spl-token")) type = "token";
        if (ix.some((i) => i.programId === "ComputeBudget111111111111111111111111111111")) type = "swap";
      }

      txs.push({
        signature: sig.signature,
        solChange,
        type,
        time: blockTime
      });
    }

    return txs;
  } catch {
    return [];
  }
}

async function getHeliusEnhanced() {
  if (!HELIUS_KEY) return null;

  const url = `https://api.helius.xyz/v0/addresses/${wallet.toBase58()}?api-key=${HELIUS_KEY}`;
  const json = await safeFetch(url);
  if (!json) return null;

  return {
    labels: json.labels || [],
    totalReceived: json.totalReceived || null,
    totalSent: json.totalSent || null,
    ownerType: json.accountType || "unknown",
    createdAt: json.createdAt || null
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

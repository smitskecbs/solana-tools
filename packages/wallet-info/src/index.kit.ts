import "dotenv/config";
import { createSolanaRpc, address, type Address } from "@solana/kit";
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";

type SplRow = { mint: string; amount: number };
type TxRow = { signature: string; solChange: number; type: string; time: string };

const RPC_URL = process.env.RPC_URL ?? clusterApiUrl("mainnet-beta");
const TOKEN_PROGRAM = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");

const HELIUS_KEY = process.env.HELIUS_API_KEY || null;

async function safeFetch(url: string, opts: any = {}) {
  try {
    const res = await fetch(url, opts);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function main() {
  const addrStr = process.argv[2];
  if (!addrStr) {
    console.log("Usage: npm run dev:kit -w ./packages/wallet-info -- <WALLET_ADDRESS>");
    process.exit(1);
  }

  const walletAddr = address(addrStr) as Address;
  const walletPk = new PublicKey(addrStr);

  const rpc = createSolanaRpc(RPC_URL);
  const connection = new Connection(RPC_URL, "confirmed"); // fallback + parsed helpers

  console.log("\n🔍 Wallet analysis for:", walletPk.toBase58(), "\n");

  // --- SOL balance (kit)
  const lamports = await rpc.getBalance(walletAddr, { commitment: "confirmed" }).send();
  const sol = Number(lamports) / 1e9;
  console.log(`💰 SOL Balance: ${sol} SOL`);

  // --- SPL balances (web3 parsed, easiest + stable)
  let spl: SplRow[] = [];
  try {
    const accounts = await connection.getParsedTokenAccountsByOwner(walletPk, {
      programId: TOKEN_PROGRAM
    });

    spl = accounts.value
      .map((acc) => {
        const info: any = acc.account.data.parsed.info;
        const amount = info.tokenAmount.uiAmount as number;
        const mint = info.mint as string;
        return { mint, amount };
      })
      .filter((t) => t.amount > 0);
  } catch {
    spl = [];
  }

  console.log(`📦 SPL Tokens (${spl.length}):`);
  if (spl.length === 0) console.log("  (none)");
  else spl.forEach((t) => console.log(`  • ${t.amount} of ${t.mint}`));

  // --- Transactions (kit first, web3 fallback)
  let txs: TxRow[] = [];

  try {
    const sigResp: any = await rpc
      .getSignaturesForAddress(walletAddr, { limit: 10 })
      .send();

    // kit types differ per version: normalize to array
    const sigs: any[] = Array.isArray(sigResp)
      ? sigResp
      : (sigResp.value ?? sigResp.values ?? []);

    for (const sig of sigs) {
      const txResp: any = await rpc
        .getTransaction(sig.signature, {
          commitment: "confirmed",
          maxSupportedTransactionVersion: 0,
          encoding: "json"
        })
        .send()
        .catch(() => null);

      if (!txResp) continue;

      const meta = txResp.meta;
      const pre = meta?.preBalances ?? [];
      const post = meta?.postBalances ?? [];

      const solChange =
        pre.length && post.length ? (Number(post[0] - pre[0]) / 1e9) : 0;

      const blockTime = txResp.blockTime
        ? new Date(Number(txResp.blockTime) * 1000).toLocaleString()
        : "unknown";

      let type = "transfer";
      if (meta?.innerInstructions?.length) {
        const ix = meta.innerInstructions.flatMap((i: any) => i.instructions);
        if (ix.some((i: any) => i.program === "spl-token")) type = "token";
        if (ix.some((i: any) => i.programId === "ComputeBudget111111111111111111111111111111")) type = "swap";
      }

      txs.push({
        signature: sig.signature,
        solChange,
        type,
        time: blockTime
      });
    }
  } catch {
    txs = [];
  }

  // fallback if kit gives nothing on this RPC
  if (txs.length === 0) {
    console.log("\n⚠️  Kit getTransaction returned no data on this RPC. Using web3.js fallback for txs...\n");
    try {
      const sigs = await connection.getSignaturesForAddress(walletPk, { limit: 10 });

      for (const sig of sigs) {
        const tx = await connection.getTransaction(sig.signature, {
          maxSupportedTransactionVersion: 0
        });
        if (!tx) continue;

        const meta = tx.meta;
        const pre = meta?.preBalances ?? [];
        const post = meta?.postBalances ?? [];

        const solChange =
          pre.length && post.length ? (post[0] - pre[0]) / 1e9 : 0;

        const blockTime = tx.blockTime
          ? new Date(tx.blockTime * 1000).toLocaleString()
          : "unknown";

        let type = "transfer";
        if (meta?.innerInstructions?.length) {
          const ix = meta.innerInstructions.flatMap((i) => i.instructions as any[]);
          if (ix.some((i: any) => i.program === "spl-token")) type = "token";
          if (ix.some((i: any) => i.programId?.toBase58?.() === "ComputeBudget111111111111111111111111111111")) type = "swap";
        }

        txs.push({
          signature: sig.signature,
          solChange,
          type,
          time: blockTime
        });
      }
    } catch {
      txs = [];
    }
  }

  console.log(`\n📜 Last ${txs.length} transactions:`);
  if (txs.length === 0) console.log("  (none)");
  else
    txs.forEach((t) =>
      console.log(`  • ${t.time} | ${t.type} | ${t.solChange} SOL | ${t.signature}`)
    );

  // --- Helius enhanced (optional)
  if (HELIUS_KEY) {
    const url = `https://api.helius.xyz/v0/addresses/${walletPk.toBase58()}?api-key=${HELIUS_KEY}`;
    const json = await safeFetch(url);
    if (json) {
      console.log("\n🔎 Helius Enhanced:");
      console.log("  Labels:      ", (json.labels || []).join(", ") || "(none)");
      console.log("  Received:    ", json.totalReceived ?? null, "lamports");
      console.log("  Sent:        ", json.totalSent ?? null, "lamports");
      console.log("  Owner type:  ", json.accountType || "unknown");
      console.log(
        "  Created:     ",
        json.createdAt ? new Date(json.createdAt * 1000).toLocaleString() : "unknown"
      );
    } else {
      console.log("\n🔎 Helius Enhanced: (fetch failed)");
    }
  } else {
    console.log("\n🔎 Helius Enhanced: (not used — no API key)");
  }

  console.log("\nDone.\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

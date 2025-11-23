#!/usr/bin/env node
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";

const TOKEN_PROGRAM_ID = new PublicKey(
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
);

function parseArgs(argv) {
  const args = {
    mint: null,
    top: 10,
    exclude: new Set(),
    json: false,
    min: 0,
    raw: false
  };

  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (!args.mint && !a.startsWith("--")) {
      args.mint = a;
      continue;
    }
    if (a === "--json") args.json = true;
    else if (a === "--raw") args.raw = true;
    else if (a === "--top") args.top = Number(argv[++i] || 10);
    else if (a === "--min") args.min = Number(argv[++i] || 0);
    else if (a === "--exclude") {
      const list = (argv[++i] || "").split(",").map(x => x.trim()).filter(Boolean);
      list.forEach(x => args.exclude.add(x));
    }
  }
  return args;
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function withRetry(fn, tries = 5) {
  let delay = 500;
  for (let i = 0; i < tries; i++) {
    try {
      return await fn();
    } catch (e) {
      const msg = String(e?.message || e);
      if (!msg.includes("429") && !msg.toLowerCase().includes("rate")) throw e;
      await sleep(delay);
      delay *= 2;
    }
  }
  return await fn();
}

function uiAmount(rawBigInt, decimals) {
  const rawStr = rawBigInt.toString();
  if (decimals === 0) return Number(rawStr);
  const pad = decimals - rawStr.length + 1;
  const s = pad > 0 ? "0".repeat(pad) + rawStr : rawStr;
  const i = s.slice(0, -decimals);
  const f = s.slice(-decimals).replace(/0+$/, "");
  return Number(f ? `${i}.${f}` : i);
}

async function main() {
  const args = parseArgs(process.argv);

  if (!args.mint) {
    console.log("Usage: node index.js <MINT_ADDRESS> [--top N] [--min X] [--exclude owner1,owner2] [--json] [--raw]");
    console.log("Example: node index.js So11111111111111111111111111111111111111112 --top 15 --min 1");
    process.exit(1);
  }

  const mintPk = new PublicKey(args.mint);

  const rpcUrl =
    process.env.RPC_URL ||
    clusterApiUrl("mainnet-beta");

  const connection = new Connection(rpcUrl, "confirmed");

  console.log(`\n👥 Fetching holder info for mint:\n${args.mint}\n`);

  // 1) Get decimals + total supply
  const supplyInfo = await withRetry(() => connection.getTokenSupply(mintPk));
  const decimals = supplyInfo.value.decimals;
  const totalSupplyUi = Number(supplyInfo.value.uiAmountString || 0);

  // 2) Fetch ALL token accounts for this mint
  // Token account layout: mint at offset 0, owner at offset 32, amount at offset 64
  const accounts = await withRetry(() =>
    connection.getProgramAccounts(TOKEN_PROGRAM_ID, {
      filters: [
        { dataSize: 165 },
        {
          memcmp: {
            offset: 0,
            bytes: mintPk.toBase58()
          }
        }
      ]
    })
  );

  // 3) Aggregate by owner
  const holdersMap = new Map(); // owner -> raw amount BigInt

  for (const acc of accounts) {
    const data = acc.account.data;

    // amount is u64 at offset 64..72 (little endian)
    const amountLE = data.subarray(64, 72);
    let raw = 0n;
    for (let i = 0; i < 8; i++) {
      raw += BigInt(amountLE[i]) << (8n * BigInt(i));
    }
    if (raw === 0n) continue;

    // owner pubkey at offset 32..64
    const ownerBytes = data.subarray(32, 64);
    const owner = new PublicKey(ownerBytes).toBase58();

    if (args.exclude.has(owner)) continue;

    holdersMap.set(owner, (holdersMap.get(owner) || 0n) + raw);
  }

  // 4) Convert to list, apply min filter and sort
  let holders = [...holdersMap.entries()]
    .map(([owner, raw]) => {
      const ui = uiAmount(raw, decimals);
      return { owner, raw: raw.toString(), ui };
    })
    .filter(h => h.ui >= args.min)
    .sort((a, b) => b.ui - a.ui);

  const holderCount = holders.length;

  // 5) Prepare distribution
  const topN = holders.slice(0, args.top);
  const topSum = topN.reduce((s, h) => s + h.ui, 0);
  const restSum = Math.max(0, totalSupplyUi - topSum);

  const result = {
    mint: args.mint,
    decimals,
    totalSupply: totalSupplyUi,
    holderCount,
    topN: topN.map(h => ({
      owner: h.owner,
      amount: h.ui,
      percent: totalSupplyUi ? (h.ui / totalSupplyUi) * 100 : 0
    })),
    topNTotal: topSum,
    topNPercent: totalSupplyUi ? (topSum / totalSupplyUi) * 100 : 0,
    restTotal: restSum,
    restPercent: totalSupplyUi ? (restSum / totalSupplyUi) * 100 : 0,
    excludedOwners: [...args.exclude],
    minFilter: args.min,
    fetchedTokenAccounts: accounts.length
  };

  if (args.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  // 6) Pretty print
  console.log(`✅ Decimals:          ${decimals}`);
  console.log(`✅ Total Supply:      ${totalSupplyUi.toLocaleString()}`);
  console.log(`✅ Holder Count:      ${holderCount.toLocaleString()}`);
  console.log(`✅ Token Accounts:    ${accounts.length.toLocaleString()}`);
  if (args.exclude.size) {
    console.log(`✅ Excluded Owners:   ${[...args.exclude].join(", ")}`);
  }
  if (args.min > 0) {
    console.log(`✅ Min Balance Filter:${args.min}`);
  }

  console.log(`\n🏆 Top ${args.top} Holders:`);
  topN.forEach((h, i) => {
    const pct = totalSupplyUi ? ((h.ui / totalSupplyUi) * 100).toFixed(4) : "0.0000";
    console.log(
      `  ${String(i + 1).padStart(2, " ")}. ${h.owner}  —  ${h.ui.toLocaleString()}  (${pct}%)`
    );
  });

  console.log(`\n📊 Distribution:`);
  console.log(
    `  Top ${args.top} total: ${topSum.toLocaleString()}  (${result.topNPercent.toFixed(4)}%)`
  );
  console.log(
    `  Rest holders total: ${restSum.toLocaleString()}  (${result.restPercent.toFixed(4)}%)`
  );

  if (args.raw) {
    console.log(`\n🧾 Raw Holder List (owner → raw amount):`);
    holders.slice(0, 200).forEach(h => {
      console.log(`  ${h.owner}  →  ${h.raw}`);
    });
    if (holders.length > 200) console.log("  ... (truncated)");
  }

  console.log("\nDone.\n");
}

main().catch((e) => {
  console.error("Error:", e?.message || e);
  process.exit(1);
});

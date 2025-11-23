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
    min: 0
  };

  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (!args.mint && !a.startsWith("--")) {
      args.mint = a;
      continue;
    }
    if (a === "--json") args.json = true;
    else if (a === "--top") args.top = Number(argv[++i] || 10);
    else if (a === "--min") args.min = Number(argv[++i] || 0);
    else if (a === "--exclude") {
      const list = (argv[++i] || "")
        .split(",")
        .map(x => x.trim())
        .filter(Boolean);
      list.forEach(x => args.exclude.add(x));
    }
  }
  return args;
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

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

// u64 little-endian → BigInt
function readU64LE(buf, start) {
  let v = 0n;
  for (let i = 0; i < 8; i++) {
    v += BigInt(buf[start + i]) << (8n * BigInt(i));
  }
  return v;
}

// raw BigInt → UI amount
function uiAmount(raw, decimals) {
  const s = raw.toString();
  if (decimals === 0) return Number(s);

  const pad = decimals - s.length + 1;
  const t = pad > 0 ? "0".repeat(pad) + s : s;

  const i = t.slice(0, -decimals);
  const f = t.slice(-decimals).replace(/0+$/, "");
  return Number(f ? `${i}.${f}` : i);
}

async function main() {
  const args = parseArgs(process.argv);

  if (!args.mint) {
    console.log(
      "Usage: node index.js <MINT_ADDRESS> [--top N] [--min X] [--exclude owner1,owner2] [--json]"
    );
    process.exit(1);
  }

  const mintPk = new PublicKey(args.mint);
  const rpcUrl = process.env.RPC_URL || clusterApiUrl("mainnet-beta");
  const connection = new Connection(rpcUrl, "confirmed");

  console.log(`\n👥 Fetching holder info for mint:\n${args.mint}\n`);

  // supply + decimals
  const supplyInfo = await withRetry(() => connection.getTokenSupply(mintPk));
  const decimals = supplyInfo.value.decimals;
  const totalSupplyUi = Number(supplyInfo.value.uiAmountString || 0);

  // All token accounts for this mint (BINARY, big-mint safe)
  const accounts = await withRetry(() =>
    connection.getProgramAccounts(TOKEN_PROGRAM_ID, {
      filters: [
        { dataSize: 165 },
        { memcmp: { offset: 0, bytes: mintPk.toBase58() } }
      ]
    })
  );

  // Aggregate balances by OWNER
  const holdersMap = new Map(); // owner -> raw BigInt

  for (const acc of accounts) {
    const data = acc.account.data;

    const raw = readU64LE(data, 64);
    if (raw === 0n) continue;

    const ownerBytes = data.subarray(32, 64);
    const owner = new PublicKey(ownerBytes).toBase58();

    if (args.exclude.has(owner)) continue;

    holdersMap.set(owner, (holdersMap.get(owner) || 0n) + raw);
  }

  let holders = [...holdersMap.entries()]
    .map(([owner, raw]) => ({ owner, ui: uiAmount(raw, decimals) }))
    .filter(h => h.ui >= args.min)
    .sort((a, b) => b.ui - a.ui);

  const holderCount = holders.length;
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
    topNPercent: totalSupplyUi ? (topSum / totalSupplyUi) * 100 : 0,
    restPercent: totalSupplyUi ? (restSum / totalSupplyUi) * 100 : 0,
    excludedOwners: [...args.exclude],
    minFilter: args.min,
    fetchedTokenAccounts: accounts.length
  };

  if (args.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.log(`✅ Decimals:       ${decimals}`);
  console.log(`✅ Total Supply:   ${totalSupplyUi.toLocaleString()}`);
  console.log(`✅ Holder Count:   ${holderCount.toLocaleString()}`);
  console.log(`✅ Token Accounts: ${accounts.length.toLocaleString()}`);
  if (args.exclude.size) console.log(`✅ Excluded:       ${[...args.exclude].join(", ")}`);
  if (args.min > 0) console.log(`✅ Min Filter:     ${args.min}`);

  console.log(`\n🏆 Top ${args.top} holders:`);
  topN.forEach((h, i) => {
    const pct = totalSupplyUi ? ((h.ui / totalSupplyUi) * 100).toFixed(4) : "0.0000";
    console.log(
      `  ${String(i + 1).padStart(2, " ")}. ${h.owner} — ${h.ui.toLocaleString()} (${pct}%)`
    );
  });

  console.log(`\n📊 Distribution:`);
  console.log(`  Top ${args.top}: ${topSum.toLocaleString()} (${result.topNPercent.toFixed(4)}%)`);
  console.log(`  Rest:    ${restSum.toLocaleString()} (${result.restPercent.toFixed(4)}%)`);

  console.log("\nDone.\n");
}

main().catch(e => {
  console.error("Error:", e?.message || e);
  process.exit(1);
});

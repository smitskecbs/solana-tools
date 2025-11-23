#!/usr/bin/env node
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";

const TOKEN_PROGRAM_ID = new PublicKey(
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
);

// ---------- cli args ----------
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
    if (!args.mint && !a.startsWith("--")) { args.mint = a; continue; }
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

// ---------- helpers ----------
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function safeJsonFetch(url, opts = {}) {
  try {
    const res = await fetch(url, opts);
    if (!res.ok) return { _error: true, status: res.status, text: await res.text() };
    return await res.json();
  } catch (e) {
    return { _error: true, status: 0, text: String(e?.message || e) };
  }
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

// Helius getProgramAccountsV2 paginator (big-mint safe)
// We slice only owner+amount: offset 32 length 40.
async function heliusGetAllTokenAccountsV2(mintPk, heliusKey) {
  const url = `https://mainnet.helius-rpc.com/?api-key=${heliusKey}`;
  let paginationKey = undefined; // do NOT send null on first call
  const all = [];
  let pageNum = 0;
  const MAX_PAGES = 50000; // safety stop

  while (true) {
    pageNum++;
    if (pageNum > MAX_PAGES) {
      console.log("⚠️  Max pages reached, stopping pagination to avoid infinite loop.");
      break;
    }

    const cfg = {
      encoding: "base64",
      limit: 1000,
      filters: [
        { dataSize: 165 },
        { memcmp: { offset: 0, bytes: mintPk.toBase58() } }
      ],
      dataSlice: { offset: 32, length: 40 }
    };
    if (paginationKey) cfg.paginationKey = paginationKey;

    const body = {
      jsonrpc: "2.0",
      id: "holder-info",
      method: "getProgramAccountsV2",
      params: [TOKEN_PROGRAM_ID.toBase58(), cfg]
    };

    const j = await safeJsonFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (j?._error) {
      throw new Error(`Helius V2 error (${j.status}): ${j.text}`);
    }

    const r = j.result || {};
    const page = r.accounts || r.value || []; // accept both shapes

    if (!Array.isArray(page) || page.length === 0) {
      console.log(`✅ Pagination done. Pages: ${pageNum - 1}, accounts: ${all.length}`);
      break;
    }

    all.push(...page);
    console.log(`… page ${pageNum}: +${page.length} accounts (total ${all.length})`);

    paginationKey = r.paginationKey;
    if (!paginationKey) {
      console.log(`✅ No paginationKey left. Pages: ${pageNum}, accounts: ${all.length}`);
      break;
    }

    await sleep(120);
  }

  return all;
}

// ---------- main ----------
async function main() {
  const args = parseArgs(process.argv);
  if (!args.mint) {
    console.log("Usage: node index.js <MINT_ADDRESS> [--top N] [--min X] [--exclude owner1,owner2] [--json]");
    process.exit(1);
  }

  const mintPk = new PublicKey(args.mint);
  const heliusKey = process.env.HELIUS_API_KEY || null;

  const rpcUrl =
    process.env.RPC_URL ||
    clusterApiUrl("mainnet-beta");

  const connection = new Connection(rpcUrl, "confirmed");

  console.log(`\n👥 Fetching holder info for mint:\n${args.mint}\n`);

  const supplyInfo = await connection.getTokenSupply(mintPk);
  const decimals = supplyInfo.value.decimals;
  const totalSupplyUi = Number(supplyInfo.value.uiAmountString || 0);

  let accounts;
  if (heliusKey) {
    console.log("✅ Using Helius getProgramAccountsV2 pagination (big-mint safe)\n");
    accounts = await heliusGetAllTokenAccountsV2(mintPk, heliusKey);
  } else {
    console.log("⚠️ No HELIUS_API_KEY set. Using standard getProgramAccounts (may fail on huge mints).\n");
    accounts = await connection.getProgramAccounts(TOKEN_PROGRAM_ID, {
      filters: [
        { dataSize: 165 },
        { memcmp: { offset: 0, bytes: mintPk.toBase58() } }
      ],
      dataSlice: { offset: 32, length: 40 }
    });
  }

  const holdersMap = new Map(); // owner -> raw BigInt

  for (const acc of accounts) {
    const dataField = acc.account?.data;
    let b64 = null;

    if (Array.isArray(dataField)) b64 = dataField[0];
    else if (typeof dataField === "string") b64 = dataField;

    if (!b64) continue;

    const data = Buffer.from(b64, "base64");

    // slice => owner(0..32) amount(32..40)
    const ownerBytes = data.subarray(0, 32);
    const owner = new PublicKey(ownerBytes).toBase58();
    const raw = readU64LE(data, 32);

    if (raw === 0n) continue;
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
    fetchedTokenAccounts: accounts.length,
    source: heliusKey ? "helius-getProgramAccountsV2" : "solana-getProgramAccounts"
  };

  if (args.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.log(`\n✅ Decimals:       ${decimals}`);
  console.log(`✅ Total Supply:   ${totalSupplyUi.toLocaleString()}`);
  console.log(`✅ Holder Count:   ${holderCount.toLocaleString()}`);
  console.log(`✅ Token Accounts: ${accounts.length.toLocaleString()}`);

  console.log(`\n🏆 Top ${args.top} holders:`);
  topN.forEach((h, i) => {
    const pct = totalSupplyUi ? ((h.ui / totalSupplyUi) * 100).toFixed(4) : "0.0000";
    console.log(`  ${String(i + 1).padStart(2, " ")}. ${h.owner} — ${h.ui.toLocaleString()} (${pct}%)`);
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

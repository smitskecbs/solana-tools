import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import mpl from "@metaplex-foundation/mpl-token-metadata";

// CommonJS-safe exports
const Metadata = mpl.Metadata ?? mpl?.metadata?.Metadata;

// Official Metaplex Token Metadata program id
const TOKEN_METADATA_PROGRAM_ID = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);

// ---------- helpers ----------
function uiAmount(raw, decimals) {
  return Number(raw) / Math.pow(10, decimals);
}

async function safeJsonFetch(url, opts = {}) {
  try {
    const res = await fetch(url, opts);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// ---------- metadata sources ----------

// 1) On-chain Metaplex metadata
async function fetchMetaplexMetadata(connection, mint) {
  try {
    const [metadataPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mint.toBuffer()
      ],
      TOKEN_METADATA_PROGRAM_ID
    );

    const account = await connection.getAccountInfo(metadataPda);
    if (!account?.data || !Metadata?.deserialize) return null;

    const [md] = Metadata.deserialize(account.data);
    const name = md?.data?.name?.trim();
    const symbol = md?.data?.symbol?.trim();

    if (!name && !symbol) return null;
    return { name: name || "Unknown", symbol: symbol || "Unknown", source: "metaplex" };
  } catch {
    return null;
  }
}

// 2) Token lists (fallback)
const TOKEN_LIST_URLS = [
  "https://raw.githubusercontent.com/solana-labs/token-list/main/src/tokens/solana.tokenlist.json",
  "https://cdn.jsdelivr.net/gh/solana-labs/token-list@main/src/tokens/solana.tokenlist.json",
  "https://token.jup.ag/strict",
  "https://token.jup.ag/all"
];

function normalizeList(json) {
  if (!json) return [];
  if (Array.isArray(json)) return json;
  if (Array.isArray(json.tokens)) return json.tokens;
  return [];
}

async function fetchTokenListMetadata(mintStr) {
  for (const url of TOKEN_LIST_URLS) {
    const json = await safeJsonFetch(url);
    const tokens = normalizeList(json);
    if (!tokens.length) continue;

    const hit = tokens.find(
      (t) => (t.address === mintStr) || (t.mintAddress === mintStr)
    );

    if (hit) {
      return {
        name: hit.name || "Unknown",
        symbol: hit.symbol || "Unknown",
        source: url.includes("jup") ? "jupiter-list" : "solana-list"
      };
    }
  }
  return null;
}

// ---------- price sources ----------

// 1) Jupiter price (v6)
async function fetchJupiterPriceV6(mintStr) {
  const json = await safeJsonFetch(`https://price.jup.ag/v6/price?ids=${mintStr}`);
  const p = json?.data?.[mintStr]?.price;
  if (typeof p === "number") return { price: p, source: "jupiter-v6" };
  return null;
}

// 1b) Jupiter legacy endpoint (extra fallback)
async function fetchJupiterPriceLegacy(mintStr) {
  const json = await safeJsonFetch(`https://api.jup.ag/price/v2?ids=${mintStr}`);
  const p = json?.data?.[mintStr]?.price;
  if (typeof p === "number") return { price: p, source: "jupiter-legacy" };
  return null;
}

// 2) Birdeye price (optional, needs API key)
async function fetchBirdeyePrice(mintStr) {
  const key = process.env.BIRDEYE_API_KEY;
  if (!key) return null;

  const json = await safeJsonFetch(
    `https://public-api.birdeye.so/defi/price?address=${mintStr}`,
    { headers: { "X-API-KEY": key } }
  );

  const p = json?.data?.value;
  if (typeof p === "number") return { price: p, source: "birdeye" };
  return null;
}

// 3) DexScreener price (no key) – strict filtering
async function fetchDexScreenerPrice(mintStr) {
  const json = await safeJsonFetch(
    `https://api.dexscreener.com/latest/dex/tokens/${mintStr}`
  );
  const pairs = json?.pairs;
  if (!Array.isArray(pairs) || pairs.length === 0) return null;

  const goodQuotes = new Set(["USDC", "USDT", "SOL"]);
  const goodDexes = new Set(["raydium", "orca", "meteora"]);

  const solanaPairs = pairs
    .filter(p => p?.chainId === "solana")
    .filter(p => goodDexes.has((p?.dexId || "").toLowerCase()))
    .filter(p => (p?.liquidity?.usd || 0) >= 2000) // min liquidity
    .filter(p => {
      const quoteSym = p?.quoteToken?.symbol?.toUpperCase();
      return goodQuotes.has(quoteSym);
    })
    .filter(p => p?.priceUsd);

  if (!solanaPairs.length) return null;

  const best = solanaPairs
    .sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0))[0];

  const p = best?.priceUsd ? Number(best.priceUsd) : null;
  if (p && !Number.isNaN(p)) return { price: p, source: "dexscreener" };
  return null;
}

// ---------- main ----------
async function main() {
  const mintStr = process.argv[2];
  if (!mintStr) {
    console.log("Usage: node index.js <MINT_ADDRESS>");
    process.exit(1);
  }

  const mint = new PublicKey(mintStr);

  const rpcUrl = process.env.RPC_URL || clusterApiUrl("mainnet-beta");
  const connection = new Connection(rpcUrl, "confirmed");

  console.log("\n🔎 Fetching token info for mint:");
  console.log(mint.toBase58(), "\n");

  // Supply + decimals from chain
  const supplyInfo = await connection.getTokenSupply(mint);
  const decimals = supplyInfo.value.decimals;
  const rawSupply = supplyInfo.value.amount;
  const totalSupplyUi = uiAmount(rawSupply, decimals);

  // Metadata with fallbacks
  let name = "Unknown";
  let symbol = "Unknown";
  let metaSource = "none";

  const md1 = await fetchMetaplexMetadata(connection, mint);
  if (md1) {
    name = md1.name;
    symbol = md1.symbol;
    metaSource = md1.source;
  } else {
    const md2 = await fetchTokenListMetadata(mintStr);
    if (md2) {
      name = md2.name;
      symbol = md2.symbol;
      metaSource = md2.source;
    }
  }

  // Price with fallbacks
  let price = null;
  let priceSource = "none";

  const p1 = await fetchJupiterPriceV6(mintStr)
            || await fetchJupiterPriceLegacy(mintStr);

  if (p1) {
    price = p1.price;
    priceSource = p1.source;
  } else {
    const p2 = await fetchBirdeyePrice(mintStr);
    if (p2) {
      price = p2.price;
      priceSource = p2.source;
    } else {
      const p3 = await fetchDexScreenerPrice(mintStr);
      if (p3) {
        price = p3.price;
        priceSource = p3.source;
      }
    }
  }

  // Stablecoin sanity check
  const isStable = ["USDC", "USDT", "PYUSD", "USDS", "UXD"].includes(symbol.toUpperCase());
  if (isStable && price !== null) {
    const deviation = Math.abs(price - 1);
    if (deviation > 0.2) { // >20% weg van $1 is bijna zeker fout pair
      price = 1;
      priceSource = "stable-sanity";
    }
  }

  // Output
  console.log(
    "✅ Name:       ",
    name,
    metaSource !== "none" ? `(source: ${metaSource})` : ""
  );
  console.log(
    "✅ Symbol:     ",
    symbol,
    metaSource !== "none" ? `(source: ${metaSource})` : ""
  );
  console.log("✅ Decimals:   ", decimals);
  console.log("✅ TotalSupply:", totalSupplyUi.toLocaleString());

  if (price !== null) {
    console.log("✅ Price:      ", `$${price}`, `(source: ${priceSource})`);
  } else {
    console.log("ℹ️ Price:      ", "not available (all sources failed)");
  }

  console.log("\nDone.\n");
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});

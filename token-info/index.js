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

// 2) Legacy token lists (can be incomplete)
const TOKEN_LIST_URLS = [
  "https://cdn.jsdelivr.net/gh/solana-labs/token-list@main/src/tokens/solana.tokenlist.json",
  "https://token.jup.ag/strict"
];

async function fetchTokenListMetadata(mintStr) {
  for (const url of TOKEN_LIST_URLS) {
    const json = await safeJsonFetch(url);
    if (!json) continue;

    const tokens = Array.isArray(json.tokens)
      ? json.tokens
      : (Array.isArray(json) ? json : []);

    const hit = tokens.find(t => (t.address || t.mintAddress) === mintStr);
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

// 3) Modern Jupiter Ultra Search (best fallback)
async function fetchJupiterUltraMetadata(mintStr) {
  const json = await safeJsonFetch(
    `https://lite-api.jup.ag/ultra/v1/search?query=${mintStr}`
  );
  const tokens = json?.tokens;
  if (!Array.isArray(tokens)) return null;

  // find exact mint match
  const exact = tokens.find(t => t?.address === mintStr);
  const hit = exact || tokens[0];
  if (!hit) return null;

  return {
    name: hit.name || "Unknown",
    symbol: hit.symbol || "Unknown",
    source: "jupiter-ultra"
  };
}

// ---------- price sources ----------

// 1) Jupiter price
async function fetchJupiterPrice(mintStr) {
  const json = await safeJsonFetch(`https://price.jup.ag/v6/price?ids=${mintStr}`);
  const p = json?.data?.[mintStr]?.price;
  if (typeof p === "number") return { price: p, source: "jupiter" };
  return null;
}

// 2) DexScreener price (no key)
async function fetchDexScreenerPrice(mintStr) {
  const json = await safeJsonFetch(
    `https://api.dexscreener.com/latest/dex/tokens/${mintStr}`
  );
  const pairs = json?.pairs;
  if (!Array.isArray(pairs) || pairs.length === 0) return null;

  const best = pairs
    .filter(p => p?.priceUsd)
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
    } else {
      const md3 = await fetchJupiterUltraMetadata(mintStr);
      if (md3) {
        name = md3.name;
        symbol = md3.symbol;
        metaSource = md3.source;
      }
    }
  }

  // Price with fallbacks
  let price = null;
  let priceSource = "none";

  const p1 = await fetchJupiterPrice(mintStr);
  if (p1) {
    price = p1.price;
    priceSource = p1.source;
  } else {
    const p2 = await fetchDexScreenerPrice(mintStr);
    if (p2) {
      price = p2.price;
      priceSource = p2.source;
    }
  }

  // Output
  console.log("✅ Name:       ", name, metaSource !== "none" ? `(source: ${metaSource})` : "");
  console.log("✅ Symbol:     ", symbol, metaSource !== "none" ? `(source: ${metaSource})` : "");
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

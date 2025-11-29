import fetch from "node-fetch";

// CLI: --mint <MINT>
// Voorbeeld:
//   npm run dev -w ./packages/cbs-metrics -- --mint B9z8cEWFmc7LvQtjKsaLoKqW5MJmGRCWqs1DPKupCfkk
//
// Zonder --mint valt hij terug op CBS (jouw token).

function getArgValue(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  if (idx === -1 || idx + 1 >= process.argv.length) return undefined;
  return process.argv[idx + 1];
}

const DEFAULT_MINT = "B9z8cEWFmc7LvQtjKsaLoKqW5MJmGRCWqs1DPKupCfkk"; // CBS
const mint = getArgValue("--mint") || DEFAULT_MINT;

const DEX_API = `https://api.dexscreener.com/latest/dex/tokens/${mint}`;

type DexToken = {
  symbol?: string;
};

type DexLiquidity = {
  usd?: number;
};

type DexVolume = {
  h24?: number;
};

type DexPair = {
  dexId?: string;
  chainId?: string;
  pairAddress?: string;
  baseToken?: DexToken;
  quoteToken?: DexToken;
  priceUsd?: string;
  liquidity?: DexLiquidity;
  volume?: DexVolume;
  fdv?: number;
  url?: string;
};

async function main() {
  console.log("🔍 Fetching pools from DexScreener...");
  console.log("Mint:", mint, "\n");

  let res;
  try {
    res = await fetch(DEX_API);
  } catch (e: any) {
    console.error(
      "❌ Network error while calling DexScreener:",
      e?.message || e
    );
    process.exit(1);
  }

  if (!res.ok) {
    console.error("❌ DexScreener error:", res.status, await res.text());
    process.exit(1);
  }

  const json = (await res.json()) as { pairs?: DexPair[] };
  const pools = json.pairs ?? [];

  if (pools.length === 0) {
    console.log("No pools found for this mint on DexScreener.");
    process.exit(0);
  }

  // Alle pairs voor deze mint (ongeacht DEX)
  const allPairs = pools;

  const raydiumPools = allPairs.filter((p) =>
    (p.dexId || "").toLowerCase().includes("raydium")
  );
  const otherPools = allPairs.filter(
    (p) => !(p.dexId || "").toLowerCase().includes("raydium")
  );

  // Sorteren op liquidity (hoogste eerst)
  raydiumPools.sort((a, b) => {
    const la = a.liquidity?.usd ?? 0;
    const lb = b.liquidity?.usd ?? 0;
    return lb - la;
  });

  otherPools.sort((a, b) => {
    const la = a.liquidity?.usd ?? 0;
    const lb = b.liquidity?.usd ?? 0;
    return lb - la;
  });

  if (raydiumPools.length > 0) {
    console.log("===== Raydium pairs =====\n");
    for (const p of raydiumPools) {
      printPair(p);
    }
  }

  if (otherPools.length > 0) {
    console.log("===== Other DEX pairs =====\n");
    for (const p of otherPools) {
      printPair(p);
    }
  }
}

function printPair(p: DexPair) {
  const base = p.baseToken?.symbol || "?";
  const quote = p.quoteToken?.symbol || "?";
  const priceUsd = p.priceUsd ? Number(p.priceUsd) : null;
  const liqUsd = p.liquidity?.usd ?? null;
  const vol24 = p.volume?.h24 ?? null;
  const fdv = p.fdv ?? null;

  console.log("========================================");
  console.log(`Pair:        ${base}/${quote}`);
  console.log(`Dex:         ${p.dexId || "?"}`);
  console.log(`Chain:       ${p.chainId || "?"}`);
  console.log(`Pair addr:   ${p.pairAddress || "?"}`);
  if (priceUsd !== null) console.log(`Price:       $${priceUsd}`);
  if (liqUsd !== null) console.log(`Liquidity:   $${liqUsd}`);
  if (vol24 !== null) console.log(`Volume 24h:  $${vol24}`);
  if (fdv !== null) console.log(`FDV:         $${fdv}`);
  if (p.url) console.log(`DexScreener: ${p.url}`);
  console.log("========================================\n");
}

main().catch((e) => {
  console.error("Unexpected error:", e);
  process.exit(1);
});


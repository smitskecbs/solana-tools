#!/usr/bin/env node
import { PublicKey } from "@solana/web3.js";

type CliOptions = {
  mint: string;
  json: boolean;
  limit: number;
};

type DexTokenInfo = {
  address: string;
  name: string;
  symbol: string;
};

type DexLiquidity = {
  usd?: number;
  base: number;
  quote: number;
};

type DexVolume = {
  m5?: number;
  h1?: number;
  h6?: number;
  h24: number;
};

type DexPriceChange = {
  m5?: number;
  h1?: number;
  h6?: number;
  h24: number;
};

type DexPair = {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
  baseToken: DexTokenInfo;
  quoteToken: Partial<DexTokenInfo>;
  priceNative: string;
  priceUsd?: string;
  txns?: unknown;
  volume?: DexVolume;
  priceChange?: DexPriceChange;
  liquidity?: DexLiquidity;
  fdv?: number;
  pairCreatedAt?: number;
};

type DexTokensResponse = {
  schemaVersion: string;
  pairs: DexPair[] | null;
};

const DEXSCREENER_TOKENS_URL =
  "https://api.dexscreener.com/latest/dex/tokens";

/**
 * Simple arg parser:
 *  --mint / -m   SPL mint address (required)
 *  --json        Output JSON instead of pretty text
 *  --limit N     Limit number of pools (default 10)
 */
function parseArgs(argv: string[]): CliOptions {
  const args = argv.slice(2);
  const opts: CliOptions = {
    mint: "",
    json: false,
    limit: 10,
  };

  for (let i = 0; i < args.length; i++) {
    const a = args[i];

    if (a === "--mint" || a === "-m") {
      opts.mint = args[i + 1] ?? "";
      i++;
    } else if (a === "--json") {
      opts.json = true;
    } else if (a === "--limit") {
      const n = Number(args[i + 1]);
      if (!Number.isNaN(n) && n > 0) {
        opts.limit = n;
      }
      i++;
    }
  }

  if (!opts.mint) {
    console.error("Error: --mint <SPL_MINT_ADDRESS> is required");
    process.exit(1);
  }

  // Basic validation that it’s a valid Solana pubkey
  try {
    // eslint-disable-next-line no-new
    new PublicKey(opts.mint);
  } catch {
    console.error("Error: invalid Solana mint address:", opts.mint);
    process.exit(1);
  }

  return opts;
}

async function fetchDexPairsForMint(mint: string): Promise<DexPair[]> {
  const url = `${DEXSCREENER_TOKENS_URL}/${mint}`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(
      `DexScreener HTTP ${res.status} (${res.statusText}) for ${url}`,
    );
  }

  const data = (await res.json()) as DexTokensResponse;
  const pairs = data.pairs ?? [];

  // Filter: only Raydium pools on Solana
  const raydiumPairs = pairs.filter(
    (p) =>
      p.chainId === "solana" &&
      typeof p.dexId === "string" &&
      p.dexId.toLowerCase().includes("raydium"),
  );

  // Sort: highest liquidity (USD) first
  raydiumPairs.sort(
    (a, b) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0),
  );

  return raydiumPairs;
}

function formatNumber(n: number | undefined, digits = 2): string {
  if (n === undefined || Number.isNaN(n)) return "-";
  if (!Number.isFinite(n)) return n.toString();
  if (Math.abs(n) >= 1_000_000_000) {
    return (n / 1_000_000_000).toFixed(digits) + "B";
  }
  if (Math.abs(n) >= 1_000_000) {
    return (n / 1_000_000).toFixed(digits) + "M";
  }
  if (Math.abs(n) >= 1_000) {
    return (n / 1_000).toFixed(digits) + "K";
  }
  return n.toFixed(digits);
}

function printHumanReadable(
  mint: string,
  pairs: DexPair[],
  limit: number,
): void {
  if (pairs.length === 0) {
    console.log(
      `No Raydium pools found on DexScreener for mint ${mint}. ` +
        "Token might not be traded on Raydium or DexScreener has no data yet.",
    );
    return;
  }

  console.log(`Raydium pools for mint ${mint} (via DexScreener):`);
  console.log("");

  pairs.slice(0, limit).forEach((p, idx) => {
    const priceUsd = p.priceUsd ? Number(p.priceUsd) : undefined;
    const vol24 = p.volume?.h24;
    const liqUsd = p.liquidity?.usd;
    const change24 = p.priceChange?.h24;

    console.log(
      `${idx + 1}. ${p.baseToken.symbol}/${p.quoteToken.symbol ?? "?"}`,
    );
    console.log(`   Pair address : ${p.pairAddress}`);
    console.log(`   Dex          : ${p.dexId} (${p.chainId})`);
    console.log(`   URL          : ${p.url}`);
    console.log(`   Price (USD)  : ${priceUsd !== undefined ? "$" + priceUsd.toFixed(8) : "-"}`);
    console.log(
      `   Liquidity    : ${liqUsd !== undefined ? "$" + formatNumber(liqUsd, 2) : "-"}`,
    );
    console.log(
      `   Volume 24h   : ${
        vol24 !== undefined ? "$" + formatNumber(vol24, 2) : "-"
      }`,
    );
    console.log(
      `   Change 24h   : ${
        change24 !== undefined ? change24.toFixed(2) + "%" : "-"
      }`,
    );
    console.log("");
  });
}

function printJson(pairs: DexPair[], limit: number): void {
  const trimmed = pairs.slice(0, limit);
  console.log(
    JSON.stringify(
      {
        source: "dexscreener",
        dexFilter: "raydium+solana",
        count: trimmed.length,
        pairs: trimmed.map((p) => ({
          pairAddress: p.pairAddress,
          url: p.url,
          chainId: p.chainId,
          dexId: p.dexId,
          baseToken: p.baseToken,
          quoteToken: p.quoteToken,
          priceNative: p.priceNative,
          priceUsd: p.priceUsd ? Number(p.priceUsd) : undefined,
          liquidityUsd: p.liquidity?.usd,
          volume24h: p.volume?.h24,
          priceChange24h: p.priceChange?.h24,
          fdv: p.fdv,
          pairCreatedAt: p.pairCreatedAt,
        })),
      },
      null,
      2,
    ),
  );
}

async function main() {
  const opts = parseArgs(process.argv);

  try {
    console.log("Fetching DexScreener data…");
    const pairs = await fetchDexPairsForMint(opts.mint);

    if (opts.json) {
      printJson(pairs, opts.limit);
    } else {
      printHumanReadable(opts.mint, pairs, opts.limit);
    }
  } catch (err: any) {
    console.error("Error in raydium-analyzer:", err?.message ?? err);
    process.exit(1);
  }
}

main();

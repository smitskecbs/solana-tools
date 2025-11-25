import { Connection, PublicKey } from "@solana/web3.js";

type CliOptions = {
  mint: string;
  json: boolean;
};

type MintInfoSummary = {
  mint: string;
  decimals: number | null;
  supplyUi: number | null;
  mintAuthority: string | null;
  freezeAuthority: string | null;
  isMintAuthorityDisabled: boolean;
  hasFreezeAuthority: boolean;
};

type TopHolder = {
  address: string;
  uiAmount: number;
  sharePercent: number;
};

type HolderSummary = {
  totalSupplyApprox: number;
  top10SharePercent: number;
  topHolders: TopHolder[];
};

type DexPair = {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
  baseToken: { address: string; symbol: string; name: string };
  quoteToken: { address?: string; symbol?: string; name?: string };
  priceUsd?: string;
  liquidity?: { usd?: number; base: number; quote: number };
  volume?: { h24?: number };
  priceChange?: { h24?: number };
};

type DexResult = {
  source: "dexscreener";
  pairs: DexPair[];
};

type SafetyFlags = {
  mintAuthorityRisk: "ok" | "warning";
  freezeAuthorityRisk: "ok" | "warning";
  concentrationRisk: "ok" | "warning" | "high";
  liquidityRisk: "ok" | "warning";
};

type SafetyReport = {
  mintInfo: MintInfoSummary;
  holders: HolderSummary | null;
  dex: DexResult | null;
  flags: SafetyFlags;
};

const DEXSCREENER_TOKENS_URL =
  "https://api.dexscreener.com/latest/dex/tokens";

// ------------------------
// CLI argumenten
// ------------------------

function parseArgs(argv: string[]): CliOptions {
  const args = argv.slice(2);
  const opts: CliOptions = {
    mint: "",
    json: false
  };

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--mint" || a === "-m") {
      opts.mint = args[i + 1] ?? "";
      i++;
    } else if (a === "--json") {
      opts.json = true;
    }
  }

  if (!opts.mint) {
    console.error("Usage: token-safety-check --mint <SPL_MINT> [--json]");
    process.exit(1);
  }

  try {
    // validatie pubkey
    // eslint-disable-next-line no-new
    new PublicKey(opts.mint);
  } catch {
    console.error("Error: invalid Solana mint address:", opts.mint);
    process.exit(1);
  }

  return opts;
}

// ------------------------
// On-chain mint info
// ------------------------

async function fetchMintInfo(
  connection: Connection,
  mint: PublicKey
): Promise<MintInfoSummary> {
  const acct = await connection.getParsedAccountInfo(mint, "confirmed");
  const data: any = acct.value?.data;

  let decimals: number | null = null;
  let supplyUi: number | null = null;
  let mintAuthority: string | null = null;
  let freezeAuthority: string | null = null;
  let isMintAuthorityDisabled = false;

  if (data && data.parsed?.info) {
    const info = data.parsed.info;
    decimals = typeof info.decimals === "number" ? info.decimals : null;

    const supply = info.supply;
    if (typeof supply === "string" && decimals !== null) {
      const raw = Number(supply);
      if (!Number.isNaN(raw)) {
        supplyUi = raw / 10 ** decimals;
      }
    }

    mintAuthority = info.mintAuthority ?? null;
    freezeAuthority = info.freezeAuthority ?? null;
    isMintAuthorityDisabled = info.mintAuthority === null;
  }

  return {
    mint: mint.toBase58(),
    decimals,
    supplyUi,
    mintAuthority,
    freezeAuthority,
    isMintAuthorityDisabled,
    hasFreezeAuthority: freezeAuthority !== null
  };
}

// ------------------------
// Holder distributie
// ------------------------

async function fetchHolderSummary(
  connection: Connection,
  mint: PublicKey,
  decimals: number | null
): Promise<HolderSummary | null> {
  try {
    const largest = await connection.getTokenLargestAccounts(
      mint,
      "confirmed"
    );

    if (!largest.value.length) return null;

    const factor = decimals !== null ? 10 ** decimals : 1;

    const totalRaw = largest.value.reduce((sum, acc) => {
      const amt = acc.amount ? Number(acc.amount) : 0;
      return sum + (Number.isNaN(amt) ? 0 : amt);
    }, 0);

    const totalSupplyApprox = factor !== 0 ? totalRaw / factor : 0;

    const top: TopHolder[] = largest.value.slice(0, 10).map((acc) => {
      const raw = acc.amount ? Number(acc.amount) : 0;
      const uiAmount = factor !== 0 ? raw / factor : 0;
      const sharePercent = totalRaw > 0 ? (raw / totalRaw) * 100 : 0;
      return {
        address: acc.address.toBase58(),
        uiAmount,
        sharePercent
      };
    });

    const top10SharePercent = top.reduce(
      (sum, h) => sum + h.sharePercent,
      0
    );

    return {
      totalSupplyApprox,
      top10SharePercent,
      topHolders: top
    };
  } catch {
    return null;
  }
}

// ------------------------
// DexScreener / Raydium
// ------------------------

async function fetchDexInfo(mint: string): Promise<DexResult | null> {
  try {
    const url = `${DEXSCREENER_TOKENS_URL}/${mint}`;
    const res = await fetch(url);
    if (!res.ok) return null;

    const json: any = await res.json();
    const pairs: DexPair[] = (json.pairs ?? []).filter(
      (p: DexPair) =>
        p.chainId === "solana" &&
        typeof p.dexId === "string" &&
        p.dexId.toLowerCase().includes("raydium")
    );

    pairs.sort(
      (a, b) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0)
    );

    return { source: "dexscreener", pairs };
  } catch {
    return null;
  }
}

// ------------------------
// Rules / flags
// ------------------------

function evaluateFlags(
  mintInfo: MintInfoSummary,
  holders: HolderSummary | null,
  dex: DexResult | null
): SafetyFlags {
  const mintAuthorityRisk: SafetyFlags["mintAuthorityRisk"] =
    mintInfo.isMintAuthorityDisabled ? "ok" : "warning";

  const freezeAuthorityRisk: SafetyFlags["freezeAuthorityRisk"] =
    mintInfo.hasFreezeAuthority ? "warning" : "ok";

  let concentrationRisk: SafetyFlags["concentrationRisk"] = "ok";
  if (holders) {
    if (holders.top10SharePercent > 90) {
      concentrationRisk = "high";
    } else if (holders.top10SharePercent > 70) {
      concentrationRisk = "warning";
    }
  }

  let liquidityRisk: SafetyFlags["liquidityRisk"] = "warning";
  if (dex && dex.pairs.length > 0) {
    const best = dex.pairs[0];
    const liq = best.liquidity?.usd ?? 0;
    liquidityRisk = liq >= 5000 ? "ok" : "warning";
  }

  return {
    mintAuthorityRisk,
    freezeAuthorityRisk,
    concentrationRisk,
    liquidityRisk
  };
}

// ------------------------
// Printen
// ------------------------

function mark(status: "ok" | "warning" | "high"): string {
  if (status === "ok") return "✅";
  if (status === "warning") return "⚠️";
  return "❌";
}

function printReport(report: SafetyReport): void {
  const { mintInfo, holders, dex, flags } = report;

  console.log("");
  console.log(`Token safety check for mint: ${mintInfo.mint}`);
  console.log("=".repeat(70));

  console.log("\nMint info:");
  console.log(`  Decimals:           ${mintInfo.decimals ?? "unknown"}`);
  console.log(
    `  Supply (approx UI): ${
      mintInfo.supplyUi !== null
        ? mintInfo.supplyUi.toLocaleString(undefined, {
            maximumFractionDigits: 4
          })
        : "unknown"
    }`
  );
  console.log(
    `  Mint authority:     ${
      mintInfo.isMintAuthorityDisabled
        ? "DISABLED (renounced)"
        : mintInfo.mintAuthority ?? "unknown"
    }`
  );
  console.log(
    `  Freeze authority:   ${
      mintInfo.hasFreezeAuthority
        ? mintInfo.freezeAuthority ?? "present"
        : "none"
    }`
  );

  console.log("\nHolders:");
  if (!holders) {
    console.log("  Could not fetch largest holders (RPC or token issue).");
  } else {
    console.log(
      `  Total supply (approx): ${holders.totalSupplyApprox.toLocaleString(
        undefined,
        { maximumFractionDigits: 4 }
      )}`
    );
    console.log(
      `  Top 10 share:          ${holders.top10SharePercent.toFixed(2)}%`
    );
    console.log("  Top holders:");
    holders.topHolders.forEach((h) => {
      console.log(
        `    - ${h.address}  ~${h.uiAmount.toLocaleString(undefined, {
          maximumFractionDigits: 4
        })} (${h.sharePercent.toFixed(2)}%)`
      );
    });
  }

  console.log("\nRaydium / liquidity (via DexScreener):");
  if (!dex || dex.pairs.length === 0) {
    console.log("  No Raydium pools found on DexScreener.");
  } else {
    const best = dex.pairs[0];
    const liq = best.liquidity?.usd ?? 0;
    const vol = best.volume?.h24 ?? 0;
    const change = best.priceChange?.h24;

    console.log(
      `  Best pool: ${best.baseToken.symbol}/${best.quoteToken.symbol ?? "?"}`
    );
    console.log(`  URL:       ${best.url}`);
    console.log(
      `  Liquidity: ${
        liq
          ? "$" +
            liq.toLocaleString(undefined, { maximumFractionDigits: 2 })
          : "unknown"
      }`
    );
    console.log(
      `  Volume 24h: ${
        vol
          ? "$" +
            vol.toLocaleString(undefined, { maximumFractionDigits: 2 })
          : "unknown"
      }`
    );
    console.log(
      `  Price change 24h: ${
        typeof change === "number" ? change.toFixed(2) + "%" : "unknown"
      }`
    );
  }

  console.log("\nRisk summary:");
  console.log(
    `  Mint authority : ${mark(flags.mintAuthorityRisk)} ` +
      (flags.mintAuthorityRisk === "ok"
        ? "Mint authority disabled (cannot mint more)."
        : "Mint authority still present – owner can mint more tokens.")
  );
  console.log(
    `  Freeze authority: ${mark(flags.freezeAuthorityRisk)} ` +
      (flags.freezeAuthorityRisk === "ok"
        ? "No freeze authority."
        : "Freeze authority present – accounts can be frozen.")
  );
  console.log(
    `  Concentration  : ${mark(flags.concentrationRisk)} ` +
      (!holders
        ? "Could not evaluate concentration."
        : flags.concentrationRisk === "ok"
        ? "Holder distribution looks healthy (top 10 < 70%)."
        : flags.concentrationRisk === "warning"
        ? "Top 10 holders own > 70% of supply."
        : "Top 10 holders own > 90% of supply – very high concentration.")
  );
  console.log(
    `  Liquidity      : ${mark(flags.liquidityRisk)} ` +
      (!dex || dex.pairs.length === 0
        ? "No Raydium liquidity found."
        : flags.liquidityRisk === "ok"
        ? "Liquidity >= $5k on Raydium."
        : "Liquidity < $5k on Raydium.")
  );

  console.log("");
}

// ------------------------
// Main
// ------------------------

async function main() {
  const opts = parseArgs(process.argv);
  const mintStr = opts.mint;

  const RPC_URL =
    process.env.RPC_URL || "https://api.mainnet-beta.solana.com";
  const connection = new Connection(RPC_URL, "confirmed");
  const mintPk = new PublicKey(mintStr);

  const mintInfo = await fetchMintInfo(connection, mintPk);
  const holders = await fetchHolderSummary(
    connection,
    mintPk,
    mintInfo.decimals
  );
  const dex = await fetchDexInfo(mintStr);

  const flags = evaluateFlags(mintInfo, holders, dex);
  const report: SafetyReport = {
    mintInfo,
    holders,
    dex,
    flags
  };

  if (opts.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    printReport(report);
  }
}

main().catch((err) => {
  console.error("Error in token-safety-check:", err);
  process.exit(1);
});

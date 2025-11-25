// api/token-safety.js
// Vercel serverless function – doet de echte RPC calls met jouw Helius endpoint.

const { Connection, PublicKey } = require("@solana/web3.js");

// Zorg dat je in Vercel een env var zet:
// HELIUS_RPC_URL = https://mainnet.helius-rpc.com/?api-key=JOUW_KEY
const RPC_URL =
  process.env.HELIUS_RPC_URL || "https://api.mainnet-beta.solana.com";

const DEXSCREENER_URL =
  "https://api.dexscreener.com/latest/dex/tokens/";

function formatNumber(num, maxDecimals = 4) {
  if (typeof num !== "number" || Number.isNaN(num)) return "unknown";
  return num.toLocaleString(undefined, { maximumFractionDigits: maxDecimals });
}

function mark(status) {
  if (status === "ok") return "✅";
  if (status === "warning") return "⚠️";
  return "❌";
}

module.exports = async (req, res) => {
  // CORS zodat je frontend er vanaf GitHub of elders bij kan
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { mint } = req.query;

  if (!mint) {
    return res
      .status(400)
      .json({ error: "Missing ?mint= parameter in query." });
  }

  let connection;
  try {
    connection = new Connection(RPC_URL, "confirmed");
  } catch (e) {
    console.error("Failed to create Connection", e);
    return res
      .status(500)
      .json({ error: "Failed to create Solana connection." });
  }

  const result = {
    mint,
    mintInfo: null,
    holders: null,
    dex: null,
    risk: null
  };

  try {
    const mintPubkey = new PublicKey(mint);
    const mintAccount = await connection.getParsedAccountInfo(mintPubkey, "confirmed");

    if (!mintAccount.value || !mintAccount.value.data || !mintAccount.value.data.parsed) {
      throw new Error("Mint account not found or not parsed.");
    }

    const info = mintAccount.value.data.parsed.info;
    const decimals =
      typeof info.decimals === "number"
        ? info.decimals
        : Number(info.decimals ?? 0);
    const supplyStr = info.supply;
    let supplyUi = null;
    if (typeof supplyStr === "string") {
      const raw = Number(supplyStr);
      if (!Number.isNaN(raw)) {
        supplyUi = raw / 10 ** decimals;
      }
    }

    const mintAuthority = info.mintAuthority ?? null;
    const freezeAuthority = info.freezeAuthority ?? null;
    const isMintAuthorityDisabled = mintAuthority === null;
    const hasFreezeAuthority = freezeAuthority !== null;

    result.mintInfo = {
      decimals,
      supplyUi,
      mintAuthority,
      freezeAuthority,
      isMintAuthorityDisabled,
      hasFreezeAuthority
    };

    // Holders
    try {
      const largest = await connection.getTokenLargestAccounts(
        mintPubkey,
        "confirmed"
      );
      const accounts = largest.value || [];

      if (accounts.length) {
        const factor = 10 ** decimals;
        const totalRaw = accounts.reduce((sum, acc) => {
          const amt = acc.amount ? Number(acc.amount) : 0;
          return sum + (Number.isNaN(amt) ? 0 : amt);
        }, 0);

        const totalSupplyApprox = factor !== 0 ? totalRaw / factor : 0;

        const top = accounts.slice(0, 10).map((acc) => {
          const raw = acc.amount ? Number(acc.amount) : 0;
          const uiAmount = factor !== 0 ? raw / factor : 0;
          const sharePercent = totalRaw > 0 ? (raw / totalRaw) * 100 : 0;
          return {
            address: acc.address,
            uiAmount,
            sharePercent
          };
        });

        const top10SharePercent = top.reduce(
          (sum, h) => sum + h.sharePercent,
          0
        );

        result.holders = {
          totalSupplyApprox,
          top10SharePercent,
          topHolders: top
        };
      } else {
        result.holders = {
          totalSupplyApprox: null,
          top10SharePercent: null,
          topHolders: []
        };
      }
    } catch (e) {
      console.error("Error fetching holders", e);
      result.holders = {
        error: "Could not fetch largest holders (RPC or token issue)."
      };
    }

    // DexScreener / Raydium
    try {
      const dsRes = await fetch(DEXSCREENER_URL + mint);
      if (dsRes.ok) {
        const json = await dsRes.json();
        const pairs = (json.pairs || []).filter(
          (p) =>
            p.chainId === "solana" &&
            typeof p.dexId === "string" &&
            p.dexId.toLowerCase().includes("raydium")
        );
        pairs.sort(
          (a, b) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0)
        );

        if (pairs.length) {
          const best = pairs[0];
          result.dex = {
            bestPool: {
              base: best.baseToken?.symbol || "?",
              quote: best.quoteToken?.symbol || "?",
              url: best.url || null,
              liquidityUsd: best.liquidity?.usd ?? null,
              volume24hUsd: best.volume?.h24 ?? null,
              priceChange24h: best.priceChange?.h24 ?? null
            }
          };
        } else {
          result.dex = {
            message: "No Raydium pools found on DexScreener."
          };
        }
      } else {
        result.dex = {
          error:
            "DexScreener returned HTTP " +
            dsRes.status +
            " " +
            dsRes.statusText
        };
      }
    } catch (e) {
      console.error("Error fetching Dex data", e);
      result.dex = {
        error: "Could not fetch Dex data."
      };
    }

    // Risk summary flags
    const flags = {
      mintAuthorityRisk: isMintAuthorityDisabled ? "ok" : "warning",
      freezeAuthorityRisk: hasFreezeAuthority ? "warning" : "ok",
      concentrationRisk: "unknown",
      liquidityRisk: "unknown"
    };

    if (result.holders && result.holders.top10SharePercent != null) {
      const pct = result.holders.top10SharePercent;
      if (pct > 90) flags.concentrationRisk = "high";
      else if (pct > 70) flags.concentrationRisk = "warning";
      else flags.concentrationRisk = "ok";
    }

    if (result.dex && result.dex.bestPool && result.dex.bestPool.liquidityUsd != null) {
      const liq = result.dex.bestPool.liquidityUsd;
      flags.liquidityRisk = liq >= 5000 ? "ok" : "warning";
    }

    let riskText = "";
    riskText +=
      "Mint authority : " +
      mark(flags.mintAuthorityRisk) +
      " " +
      (flags.mintAuthorityRisk === "ok"
        ? "Mint authority disabled (cannot mint more)."
        : "Mint authority still present – owner can mint more tokens.") +
      "\\n";
    riskText +=
      "Freeze authority: " +
      mark(flags.freezeAuthorityRisk) +
      " " +
      (flags.freezeAuthorityRisk === "ok"
        ? "No freeze authority."
        : "Freeze authority present – accounts can be frozen.") +
      "\\n";
    riskText +=
      "Concentration  : " +
      mark(flags.concentrationRisk) +
      " " +
      (!result.holders || result.holders.top10SharePercent == null
        ? "Could not evaluate concentration."
        : flags.concentrationRisk === "ok"
        ? "Holder distribution looks healthy (top 10 < 70%)."
        : flags.concentrationRisk === "warning"
        ? "Top 10 holders own > 70% of supply."
        : "Top 10 holders own > 90% of supply – very high concentration.") +
      "\\n";
    riskText +=
      "Liquidity      : " +
      mark(flags.liquidityRisk) +
      " " +
      (!result.dex || !result.dex.bestPool
        ? "No Raydium liquidity found."
        : flags.liquidityRisk === "ok"
        ? "Liquidity >= $5k on Raydium."
        : "Liquidity < $5k on Raydium.");

    result.risk = {
      flags,
      text: riskText
    };

    return res.status(200).json(result);
  } catch (e) {
    console.error("token-safety error", e);
    return res.status(500).json({
      error: e.message || "Unknown error while running token-safety."
    });
  }
};

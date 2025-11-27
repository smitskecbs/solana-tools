// api/token-safety.js
// Vercel serverless function – wraps Solana RPC + DexScreener
// so your Degen Token Scanner frontend can show mint, holders & Raydium liquidity.

const HELIUS_RPC_URL =
  process.env.HELIUS_RPC_URL ||
  process.env.RPC_URL ||
  "https://api.mainnet-beta.solana.com";

async function solanaRpc(method, params = []) {
  const body = JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method,
    params,
  });

  const res = await fetch(HELIUS_RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Solana RPC HTTP ${res.status}: ${text}`);
  }

  const json = await res.json();
  if (json.error) {
    throw new Error(
      `Solana RPC error for ${method}: ${json.error.message || JSON.stringify(json.error)}`
    );
  }

  return json.result;
}

async function getMintInfo(mint) {
  // getTokenSupply
  const supplyRes = await solanaRpc("getTokenSupply", [mint, { commitment: "confirmed" }]);
  const supplyVal = supplyRes?.value;

  // getAccountInfo (jsonParsed) for mint/freeeze authorities
  const accRes = await solanaRpc("getAccountInfo", [
    mint,
    { encoding: "jsonParsed", commitment: "confirmed" },
  ]);

  const parsedInfo =
    accRes?.value?.data?.parsed?.info ??
    accRes?.value?.data?.parsed?.info?.mint ??
    accRes?.value?.data?.parsed?.info?.state;

  const decimals =
    typeof parsedInfo?.decimals === "number"
      ? parsedInfo.decimals
      : typeof supplyVal?.decimals === "number"
      ? supplyVal.decimals
      : null;

  let supplyUi = null;
  if (typeof supplyVal?.uiAmount === "number") {
    supplyUi = supplyVal.uiAmount;
  } else if (typeof supplyVal?.uiAmountString === "string") {
    const p = parseFloat(supplyVal.uiAmountString);
    supplyUi = Number.isNaN(p) ? null : p;
  }

  const mintAuthority = parsedInfo?.mintAuthority ?? null;
  const freezeAuthority = parsedInfo?.freezeAuthority ?? null;

  const isMintAuthorityDisabled =
    mintAuthority === null || mintAuthority === undefined;

  const hasFreezeAuthority =
    freezeAuthority !== null && freezeAuthority !== undefined;

  return {
    decimals,
    supplyUi,
    isMintAuthorityDisabled,
    mintAuthority,
    hasFreezeAuthority,
    freezeAuthority,
  };
}

async function getHolders(mint) {
  const [supplyRes, largestRes] = await Promise.all([
    solanaRpc("getTokenSupply", [mint, { commitment: "confirmed" }]),
    solanaRpc("getTokenLargestAccounts", [mint, { commitment: "confirmed" }]),
  ]);

  const supplyVal = supplyRes?.value;
  let totalUi = null;
  if (typeof supplyVal?.uiAmount === "number") {
    totalUi = supplyVal.uiAmount;
  } else if (typeof supplyVal?.uiAmountString === "string") {
    const p = parseFloat(supplyVal.uiAmountString);
    totalUi = Number.isNaN(p) ? null : p;
  }

  const accounts = Array.isArray(largestRes?.value) ? largestRes.value : [];

  const topHolders = accounts.slice(0, 10).map((acc, i) => {
    let amountUi = 0;
    if (typeof acc.uiAmount === "number") {
      amountUi = acc.uiAmount;
    } else if (typeof acc.uiAmountString === "string") {
      const p = parseFloat(acc.uiAmountString);
      amountUi = Number.isNaN(p) ? 0 : p;
    }

    const sharePercent =
      totalUi && totalUi > 0 ? (amountUi / totalUi) * 100 : 0;

    return {
      address: acc.address,
      uiAmount: amountUi,
      sharePercent,
    };
  });

  const top10Share =
    topHolders.reduce((sum, h) => sum + (h.sharePercent || 0), 0) || null;

  return {
    totalSupplyApprox: totalUi,
    top10SharePercent: top10Share,
    topHolders,
  };
}

async function getDexInfo(mint) {
  try {
    const url = "https://api.dexscreener.com/latest/dex/tokens/" + mint;
    const res = await fetch(url);
    if (!res.ok) {
      return { error: "DexScreener HTTP " + res.status };
    }
    const json = await res.json();
    const pair = Array.isArray(json.pairs) ? json.pairs[0] : null;
    if (!pair) {
      return { message: "No pools found on DexScreener." };
    }

    const bestPool = {
      base: pair.baseToken?.symbol || pair.baseToken?.address || "?",
      quote: pair.quoteToken?.symbol || pair.quoteToken?.address || "?",
      url: pair.url || "",
      liquidityUsd:
        typeof pair.liquidity?.usd === "number" ? pair.liquidity.usd : null,
      volume24hUsd:
        typeof pair.volume?.h24 === "number" ? pair.volume.h24 : null,
      priceChange24h:
        typeof pair.priceChange?.h24 === "number"
          ? pair.priceChange.h24
          : null,
    };

    return { bestPool };
  } catch (e) {
    return { error: "Dex fetch failed: " + (e.message || String(e)) };
  }
}

function buildRisk(mintInfo, holders, dex) {
  const mintDisabled = mintInfo?.isMintAuthorityDisabled ?? false;
  const hasFreeze = mintInfo?.hasFreezeAuthority ?? false;
  const top10 = holders?.top10SharePercent ?? null;

  const bestPool = dex && dex.bestPool ? dex.bestPool : null;
  const liq = bestPool?.liquidityUsd ?? null;

  const mintAuthorityRisk = mintDisabled ? "ok" : "warning";
  const mintAuthorityLabel = mintDisabled
    ? "renounced / disabled"
    : mintInfo?.mintAuthority
    ? "active: " + mintInfo.mintAuthority
    : "unknown";

  const freezeAuthorityRisk = hasFreeze ? "warning" : "ok";
  const freezeAuthorityLabel = hasFreeze
    ? `present${mintInfo?.freezeAuthority ? ": " + mintInfo.freezeAuthority : ""}`
    : "none";

  let concentrationRisk = "ok";
  let concentrationLabel = "holder spread unknown";

  if (typeof top10 === "number") {
    if (top10 > 80) {
      concentrationRisk = "danger";
      concentrationLabel = `Top 10 hold ~${top10.toFixed(
        1
      )}% (very concentrated)`;
    } else if (top10 > 50) {
      concentrationRisk = "warning";
      concentrationLabel = `Top 10 hold ~${top10.toFixed(
        1
      )}% (concentrated)`;
    } else {
      concentrationRisk = "ok";
      concentrationLabel = `Top 10 hold ~${top10.toFixed(
        1
      )}% (decent spread)`;
    }
  }

  let liquidityRisk = "warning";
  let liquidityLabel = "no public pool";

  if (typeof liq === "number") {
    if (liq >= 10000) {
      liquidityRisk = "ok";
      liquidityLabel = `~$${liq.toFixed(0)} liquidity (solid)`;
    } else if (liq >= 2000) {
      liquidityRisk = "warning";
      liquidityLabel = `~$${liq.toFixed(
        0
      )} liquidity (thin – degen size only)`;
    } else {
      liquidityRisk = "warning";
      liquidityLabel = `~$${liq.toFixed(
        0
      )} liquidity (very thin, easy to move)`;
    }
  }

  const lines = [];

  lines.push(
    mintDisabled
      ? "Mint authority looks renounced – supply cannot be increased via mint."
      : "Mint authority is still active – dev can mint more supply."
  );

  lines.push(
    hasFreeze
      ? "Freeze authority is set – accounts could be frozen."
      : "No freeze authority – token accounts cannot be arbitrarily frozen."
  );

  if (typeof top10 === "number") {
    lines.push(
      `Top 10 wallets hold about ${top10.toFixed(
        1
      )}% of supply – ${concentrationLabel}`
    );
  } else {
    lines.push("Holder concentration unknown (RPC didn’t return full data).");
  }

  if (typeof liq === "number") {
    lines.push(
      `Best pool on-chain has ~$${liq.toFixed(
        0
      )} liquidity – ${liquidityLabel}`
    );
  } else {
    lines.push("No obvious Dex pool was found for this mint.");
  }

  return {
    text: lines.join("\n"),
    flags: {
      mintAuthorityRisk,
      mintAuthorityLabel,
      freezeAuthorityRisk,
      freezeAuthorityLabel,
      concentrationRisk,
      concentrationLabel,
      liquidityRisk,
      liquidityLabel,
    },
  };
}

// Vercel handler
export default async function handler(req, res) {
  try {
    const { mint } = req.query;

    if (!mint || typeof mint !== "string") {
      res.status(400).json({ error: "Missing ?mint=<SPL_MINT_ADDRESS>" });
      return;
    }

    const [mintInfo, holders, dex] = await Promise.all([
      getMintInfo(mint),
      getHolders(mint).catch((e) => ({ error: e.message || String(e) })),
      getDexInfo(mint),
    ]);

    let risk = null;
    try {
      if (!holders?.error) {
        risk = buildRisk(mintInfo, holders, dex);
      }
    } catch {
      risk = null;
    }

    res.status(200).json({
      mintInfo,
      holders,
      dex,
      risk,
    });
  } catch (err) {
    console.error("token-safety API error:", err);
    res
      .status(500)
      .json({ error: err.message || String(err) || "Unknown server error" });
  }
}

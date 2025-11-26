// api/token-safety.js
// Vercel serverless function – wraps Helius RPC + DexScreener
// so your docs/index.html can show mint, holders & Raydium liquidity.

export default async function handler(req, res) {
  try {
    const { mint } = req.query;

    if (!mint || typeof mint !== "string") {
      res.status(400).json({ error: "Missing ?mint=<SPL_MINT_ADDRESS>" });
      return;
    }

    const heliusRpcUrl =
      process.env.HELIUS_RPC_URL ||
      "https://api.mainnet-beta.solana.com";

    async function heliusRpc(method, params = []) {
      const body = JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method,
        params,
      });

      const resp = await fetch(heliusRpcUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body,
      });

      if (!resp.ok) {
        throw new Error(`RPC HTTP ${resp.status}`);
      }
      const json = await resp.json();
      if (json.error) {
        throw new Error(json.error.message || "RPC error");
      }
      return json.result;
    }

    // --------------------
    // 1) Mint info
    // --------------------
    let mintInfo = null;

    try {
      const acc = await heliusRpc("getAccountInfo", [
        mint,
        { encoding: "jsonParsed", commitment: "confirmed" },
      ]);

      const parsed = acc?.value?.data?.parsed?.info;
      if (parsed) {
        const decimals = parsed.decimals ?? 0;
        const rawSupply = BigInt(parsed.supply ?? "0");
        const supplyUi = Number(rawSupply) / 10 ** decimals;

        const mintAuthority = parsed.mintAuthority ?? null;
        const freezeAuthority = parsed.freezeAuthority ?? null;

        mintInfo = {
          decimals,
          supplyUi,
          mintAuthority,
          freezeAuthority,
          isMintAuthorityDisabled: mintAuthority === null,
          hasFreezeAuthority: freezeAuthority !== null,
        };
      }
    } catch (e) {
      console.error("Mint info error:", e);
    }

    // --------------------
    // 2) Holders info
    // --------------------
    let holders = null;

    try {
      const largest = await heliusRpc("getTokenLargestAccounts", [
        mint,
        { commitment: "confirmed" },
      ]);

      const value = largest?.value ?? [];
      const decimals =
        mintInfo?.decimals ??
        (value[0]?.decimals != null ? value[0].decimals : 0);

      // totalSupplyApprox via getTokenSupply
      let totalSupplyApprox = null;
      try {
        const supplyRes = await heliusRpc("getTokenSupply", [mint]);
        const uiAmount = supplyRes?.value?.uiAmount;
        if (typeof uiAmount === "number") {
          totalSupplyApprox = uiAmount;
        }
      } catch (e) {
        console.error("getTokenSupply error:", e);
      }

      const topHolders = value.slice(0, 10).map((entry) => {
        const raw = BigInt(entry.amount ?? "0");
        const uiAmount = Number(raw) / 10 ** decimals;
        return {
          address: entry.address,
          uiAmount,
          sharePercent: 0, // we vullen zo
        };
      });

      if (totalSupplyApprox == null) {
        totalSupplyApprox = topHolders.reduce(
          (sum, h) => sum + h.uiAmount,
          0
        );
      }

      let top10Total = 0;
      for (const h of topHolders) {
        top10Total += h.uiAmount;
      }
      let top10SharePercent = 0;
      if (totalSupplyApprox > 0) {
        top10SharePercent = (top10Total / totalSupplyApprox) * 100;
      }

      for (const h of topHolders) {
        h.sharePercent =
          totalSupplyApprox > 0
            ? (h.uiAmount / totalSupplyApprox) * 100
            : 0;
      }

      holders = {
        totalSupplyApprox,
        top10SharePercent,
        topHolders,
      };
    } catch (e) {
      console.error("Holders error:", e);
      holders = { error: "Error while fetching holders." };
    }

    // --------------------
    // 3) DexScreener / Raydium
    // --------------------
    let dex = null;

    try {
      const dsUrl = `https://api.dexscreener.com/latest/dex/tokens/${mint}`;
      const resp = await fetch(dsUrl);
      if (!resp.ok) {
        throw new Error(`DexScreener HTTP ${resp.status}`);
      }
      const data = await resp.json();
      const pairs = Array.isArray(data.pairs) ? data.pairs : [];

      const raydiumPairs = pairs.filter(
        (p) =>
          p.chainId === "solana" &&
          p.dexId === "raydium" &&
          p.liquidity?.usd != null
      );

      if (!raydiumPairs.length) {
        dex = { message: "No Raydium pools found on DexScreener." };
      } else {
        raydiumPairs.sort(
          (a, b) => (b.liquidity.usd || 0) - (a.liquidity.usd || 0)
        );
        const best = raydiumPairs[0];
        dex = {
          bestPool: {
            base: best.baseToken?.symbol || "BASE",
            quote: best.quoteToken?.symbol || "QUOTE",
            url: best.url,
            liquidityUsd: best.liquidity?.usd ?? null,
            volume24hUsd: best.volume?.h24 ?? null,
            priceChange24h: best.priceChange?.h24 ?? null,
          },
        };
      }
    } catch (e) {
      console.error("Dex error:", e);
      dex = { error: "Error while fetching Dex data." };
    }

    // --------------------
    // 4) Risk summary
    // --------------------
    let risk = null;

    try {
      const flags = {
        mintAuthorityRisk: "unknown",
        freezeAuthorityRisk: "unknown",
        concentrationRisk: "unknown",
        liquidityRisk: "unknown",
      };

      if (mintInfo) {
        flags.mintAuthorityRisk = mintInfo.isMintAuthorityDisabled
          ? "ok"
          : "warning";
        flags.freezeAuthorityRisk = mintInfo.hasFreezeAuthority
          ? "warning"
          : "ok";
      }

      if (holders && !holders.error) {
        const share = holders.top10SharePercent ?? 0;
        if (share > 90) {
          flags.concentrationRisk = "danger";
        } else if (share > 70) {
          flags.concentrationRisk = "warning";
        } else {
          flags.concentrationRisk = "ok";
        }
      }

      if (dex?.bestPool?.liquidityUsd != null) {
        const liq = dex.bestPool.liquidityUsd;
        if (liq >= 10000) {
          flags.liquidityRisk = "ok";
        } else if (liq >= 5000) {
          flags.liquidityRisk = "warning";
        } else {
          flags.liquidityRisk = "warning";
        }
      } else {
        flags.liquidityRisk = "warning";
      }

      let text = "Risk summary based on mint, holders and liquidity.\n";

      if (flags.mintAuthorityRisk === "ok") {
        text += "- Mint authority disabled (cannot mint more).\n";
      } else if (flags.mintAuthorityRisk === "warning") {
        text +=
          "- Mint authority still active – owner can mint more tokens.\n";
      }

      if (flags.freezeAuthorityRisk === "ok") {
        text += "- No freeze authority.\n";
      } else if (flags.freezeAuthorityRisk === "warning") {
        text +=
          "- Freeze authority present – token accounts can be frozen.\n";
      }

      if (flags.concentrationRisk === "danger") {
        text +=
          "- Top 10 holders own > 90% of supply – very high concentration.\n";
      } else if (flags.concentrationRisk === "warning") {
        text +=
          "- Top 10 holders own 70–90% of supply – high concentration.\n";
      } else if (flags.concentrationRisk === "ok") {
        text += "- Holder distribution looks more balanced.\n";
      }

      if (flags.liquidityRisk === "ok") {
        text += "- Liquidity on Raydium looks good (>= $10k).\n";
      } else if (flags.liquidityRisk === "warning") {
        text +=
          "- Liquidity on Raydium is low (< $10k) or no pool found.\n";
      }

      risk = { text: text.trim(), flags };
    } catch (e) {
      console.error("Risk summary error:", e);
    }

    res.status(200).json({
      mintInfo,
      holders,
      dex,
      risk,
    });
  } catch (e) {
    console.error("token-safety handler error:", e);
    res
      .status(500)
      .json({ error: e.message || "Unexpected server error." });
  }
}

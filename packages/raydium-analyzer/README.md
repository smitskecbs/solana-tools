# @smitskecbs/raydium-analyzer

Simple CLI to inspect **Raydium pools** for any Solana SPL token mint  
(using the public DexScreener API).

- Filters **Raydium pools only** (`dexId = raydium`, `chainId = solana`)
- Shows **price, liquidity, 24h volume, 24h price change**
- Output as **human readable text** or **JSON** (`--json`)
- Perfect for token devs, community mods and degen researchers

Built by **Kevin Smits (@smitskecbs)**.  
Free to use by the Solana community — attribution appreciated.

---

## Install (monorepo)

From the repo root:

    npm install

---

## Usage

From the repo root:

    npm run raydium:analyze -- --mint <SPL_MINT>

Example (CBS Coin):

    npm run raydium:analyze -- \
      --mint B9z8cEWFmc7LvQtjKsaLoKqW5MJmGRCWqs1DPKupCfkk

Example output:

    Fetching DexScreener data…
    Raydium pools for mint B9z8cEWFmc7LvQtjKsaLoKqW5MJmGRCWqs1DPKupCfkk (via DexScreener):

    1. CBS/SOL
       Pair address : 8HSvu732XpKoBgSse414VJZDAA8Q2fdcm17Kv1xbYAu3
       Dex          : raydium (solana)
       URL          : https://dexscreener.com/solana/8hsvu732xpkobgsse414vjzdaa8q2fdcm17kv1xbyau3
       Price (USD)  : $0.00003340
       Liquidity    : $1.16K
       Volume 24h   : $72.46
       Change 24h   : 13.00%

---

## JSON output

For programmatic use:

    npm run raydium:analyze -- \
      --mint <SPL_MINT> \
      --json

Returns:

    {
      "source": "dexscreener",
      "dexFilter": "raydium+solana",
      "count": 1,
      "pairs": [
        {
          "pairAddress": "8HSvu732XpKoBgSse414VJZDAA8Q2fdcm17Kv1xbYAu3",
          "url": "https://dexscreener.com/solana/8hsvu732xpkobgsse414vjzdaa8q2fdcm17kv1xbyau3",
          "chainId": "solana",
          "dexId": "raydium",
          "baseToken": { "symbol": "CBS" },
          "quoteToken": { "symbol": "SOL" },
          "priceUsd": 0.0000334,
          "liquidityUsd": 1160.0,
          "volume24h": 72.46,
          "priceChange24h": 13.0
        }
      ]
    }

---

## CLI options

- `--mint <ADDRESS>` *(required)*  
  SPL Token mint address.

- `--json`  
  Output JSON instead of formatted text.

- `--limit <N>`  
  Limit number of Raydium pools shown (default: `10`).

Example limiting to 3 pools:

    npm run raydium:analyze -- \
      --mint <SPL_MINT> \
      --limit 3

---

## Notes

- Uses DexScreener's public API:  
  `https://api.dexscreener.com/latest/dex/tokens/<mint>`
- Filters only:
  - `chainId === "solana"`
  - `dexId` contains `"raydium"`
- Sorted by **highest USD liquidity** first.

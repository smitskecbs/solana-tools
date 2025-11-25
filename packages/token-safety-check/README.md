# @smitskecbs/token-safety-check

Quick CLI to check basic safety properties of a Solana SPL token:

- Mint authority (renounced or not)
- Freeze authority present or not
- Holder concentration (top 10 holders)
- Raydium liquidity and volume (via DexScreener)

Built by Kevin Smits (@smitskecbs).  
Free to use by the Solana community.

---

## Install (monorepo)

From the repo root:

    npm install

---

## Usage

From the repo root:

    npm run token-safety -- --mint <SPL_MINT>

Example (CBS Coin):

    npm run token-safety -- \
      --mint B9z8cEWFmc7LvQtjKsaLoKqW5MJmGRCWqs1DPKupCfkk

Add --json to get machine-readable output:

    npm run token-safety -- --mint <SPL_MINT> --json


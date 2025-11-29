# SPL Metrics — Liquidity & Market Inspector (SPL-token agnostic)

A minimal, clean, production-ready CLI in TypeScript to inspect liquidity pools and market metrics for **any Solana SPL token** using the DexScreener API.

## What it does
- Accepts any SPL mint address as input (`--mint <address>`)
- Discovers **all trading pairs** belonging to that mint
- Groups output into:
  - **Raydium CPMM/AMM pools**
  - **Other DEX pools**
- Displays for each pair:
  - `priceUsd`
  - `liquidity.usd`
  - `volume.h24`
  - `fdv`
  - `pairAddress`
  - `DexScreener URL`

## How to use

### ✅ 1) Paste example code into your index.ts file here:
`packages/cbs-metrics/src/index.ts`

### ✅ 2) Paste your RPC + Wallet secret into `.env` at project root:
`/solana-tools/.env`

ENV example structure:

```env
RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
WALLET_SECRET=YOUR_BASE58_SECRET
```

### ✅ 3) Run the CLI

From the repo root:

```bash
npm install
npm run dev -w ./packages/cbs-metrics
```

### ✅ 4) Run with any SPL token mint:

```bash
npm run dev -w ./packages/cbs-metrics -- --mint <MINT_ADDRESS>
```

Example:

```bash
npm run dev -w ./packages/cbs-metrics -- --mint DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263
```

## Output example

```
🔍 Fetching SPL pools…
Mint: <MINT_ADDRESS>

===== Raydium Pairs =====
Pair: ?/?
Dex: raydium
Chain: solana
Pool: <PAIR_ADDRESS>
Price USD: $<PRICE>
Liquidity: $<LIQ_USD>
Volume 24h: $<VOL24>
FDV: $<FDV>
🔗 <DEX_SCREEN_URL>

===== Other DEX pairs =====
…
```

## Notes
This tool does not trade. It only **reads, groups & prints** on-chain liquidity and market data to help you verify SPL token pools safely and transparently.


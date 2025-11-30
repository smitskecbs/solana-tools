# Solana Tools – CLI Toolkit (by Kevin Smits)

Solana Tools is a fully open-source TypeScript/Node monorepo for builders who want clean, fast, read-only insights into Solana wallets and SPL tokens from the terminal.

## Tools included

- **wallet-info** → Inspect wallet address, SOL balance, SPL holdings and last transactions
- **holder-info** → Generate SPL holder snapshots + concentration stats (Top 1/5/10)
- **whale-tracker** → List wallets holding ≥1% of total SPL supply
- **dex-metrics (cbs-metrics)** → Check Raydium DEX pools + liquidity via DexScreener
- **snapshot-airdrop** → Export SPL holders to JSON/CSV (for airdrops)

> ⚠️ **Known limitations**  
> `holder-info`, `whale-tracker` and `dex-metrics` currently only return accurate data for small/mid-cap tokens.  
> Very large tokens like **JUP** or other high-holder mints may fail or load extremely slow due to:  
> - **429 RPC rate limits**  
> - Large account scans timing out on **free Solana + Helius public RPC**  
> - Memory/scan limits on free hosting tiers  
> Fixes are being developed.

---

## Tech stack

- **Language:** TypeScript  
- **Runtime tested:** Node 18 / 20+ recommended  
- **Execution:** `tsx` + `npm workspaces`  
- **DEX data:** DexScreener public API (Raydium)

---

## Installation

```bash
git clone https://github.com/smitskecbs/solana-tools.git
cd solana-tools
npm install
```

---

## Optional environment config (recommended for large token scans)

Create `.env` in repo root:

```
HELIUS_API_KEY=5b9477d2-aa3f-4a4d-8776-9649b7221023
# Optional:
# RPC_URL=https://mainnet.helius-rpc.com/?api-key=5b9477d2-aa3f-4a4d-8776-9649b7221023
```

If nothing else is set, it falls back to:

```
https://api.mainnet-beta.solana.com
```

---

## Usage examples

### Wallet info
```bash
npm run dev -w ./packages/wallet-info --address 3g7qECanbhXrX6HGrkqUCCNgzSdtDmjQUidUv7LdgRQH
```

### SPL Holder snapshot
```bash
npm run dev -w ./packages/holder-info -- --mint B9z8cEWFmc7LvQtjKsaLoKqW5MJmGRCWqs1DPKupCfkk
```

### Export SPL holders for airdrop
```bash
npm run dev:kit -w ./packages/snapshot-airdrop -- --mint B9z8cEWFmc7LvQtjKsaLoKqW5MJmGRCWqs1DPKupCfkk --min 1 --exclude wallet1,wallet2 --out snapshots
```

---

## CBS Coin reference (Kevin’s main test mint)
- **Website:** https://cbs-coin.com
- **TG:** @smitske
- **Purpose:** Transparent, community-owned SPL on Solana  
These tools will later be integrated into CBS analytics.

---

## Contributing / feedback
- X: @smitske180
- TG: @smitske  
No paid shilling, spam or bot spam. We build real.

---

## License  
This repo is community-friendly tooling for learning, research and non-malicious use. License file will be added when project matures.

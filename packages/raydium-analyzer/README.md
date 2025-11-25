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

```bash
npm install


# Solana Tools — CLI Toolkit for SPL Token & Wallet Insights (by Kevin Smits)

Solana Tools is a lightweight TypeScript monorepo providing terminal utilities to inspect wallets, analyze SPL token holders, check DEX liquidity (Raydium), run heuristic safety checks, and take SPL holder snapshots for airdrops.

All tools are read-only and require **no private keys**.

---

## 🧰 Tools Included

| Package | Purpose |
|--------|---------|
| `wallet-info` | Inspect a wallet (SOL + SPL balances, recent transactions) |
| `holder-info` | Aggregated SPL holder distribution + concentration metrics |
| `whale-tracker` | Largest token accounts and whale concentration overview |
| `cbs-metrics` | DEX pool + liquidity metrics for an SPL mint via DexScreener |
| `snapshot-airdrop` | Take SPL holder snapshots and export CSV/JSON |

---

## 🚀 Tech Stack & Vision

- Language: **TypeScript**
- Runtime: **Node.js 18/20**
- Data sources: Public Solana RPC + **DexScreener API**
- Optimized for: Small & mid-cap SPL tokens
- Migration path: Some packages include a `Kit` variant using `@solana/kit` (Solana v2-style APIs)

**Built by Kevin Smits (Netherlands)**  
X (Twitter): `@smitske180`  
Telegram: `@smitske`

---

## ✅ Quickstart Installation

```bash
git clone https://github.com/smitskecbs/solana-tools.git
cd solana-tools
npm install
```

---

## ⚙️ Optional: `.env` Configuration (For Better Stability)

Create a `.env` file in the repo root:

```env
HELIUS_API_KEY=5b9477d2-aa3f-4a4d-8776-9649b7221023
# Optional override:
# RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
PORT=3000
```

Behavior priority in code:

1. Uses `RPC_URL` if defined
2. Otherwise, builds Helius RPC using `HELIUS_API_KEY`
3. Otherwise falls back to public Solana RPC

---

## ▶️ Running Tools from Terminal

All packages are workspaces. Use:

```bash
npm run dev -w ./packages/<tool-name> -- [args]
npm run dev:kit -w ./packages/<tool-name> -- [args]
```

---

### 🔍 Wallet Inspection

```bash
npm run dev -w ./packages/wallet-info -- 3g7qECanbhXrX6HGrkqUCCNgzSdtDmjQUidUv7LdgRQH
```

---

### 📊 SPL Holder Distribution

```bash
npm run dev:kit -w ./packages/holder-info -- --mint B9z8cEWFmc7LvQtjKsaLoKqW5MJmGRCWqs1DPKupCfkk --limit 20
```

---

### 🐋 Whale Tracker

```bash
npm run dev:kit -w ./packages/whale-tracker -- --mint B9z8cEWFmc7LvQtjKsaLoKqW5MJmGRCWqs1DPKupCfkk --minPct 1 --limit 20
```

---

### 📦 DEX Metrics (Liquidity / Pools)

```bash
npm run dev -w ./packages/cbs-metrics -- --mint B9z8cEWFmc7LvQtjKsaLoKqW5MJmGRCWqs1DPKupCfkk
```

---

### 🧾 Take Holder Snapshot (for airdrops)

```bash
npm run dev:kit -w ./packages/snapshot-airdrop -- --mint B9z8cEWFmc7LvQtjKsaLoKqW5MJmGRCWqs1DPKupCfkk --min 1 --out snapshots
```

---

## ⚠️ Current Limitations

- `holder-info` and `whale-tracker` may fail on **very large tokens** (JUP, USDC, etc.)
- Public RPC can throw `429 Too Many Requests` errors when scanning large account lists
- Some scans may be approximate when memory or rate limits are reached on free hosting tiers
- The toolkit is actively optimized for efficiency and reliability in future updates.

---

## 📜 License

Source-available toolkit intended for learning, research, and non-malicious analytics.  
(The official MIT/Apache license may be added later.)

---

## 🤝 Contributing & Feedback

- Open an issue or Pull Request if you find a bug or want a feature.
- Terminal utilities evolve continuously while Kevin builds in public (attribution always appreciated).
````markdown

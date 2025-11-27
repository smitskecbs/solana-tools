# solana-tools 🛠️

Modern TypeScript monorepo by Kevin Smits — free, open-source :contentReference[oaicite:0]{index=0} CLI utilities built with :contentReference[oaicite:1]{index=1} for read-only holder and mint intelligence on :contentReference[oaicite:2]{index=2}.

---

## 🐋 Whale Token Tracker

A dedicated SPL mint whale scanner package for deep holder distribution & movement diffs.

### Capabilities
- Fetch total supply (UI)
- List top N largest wallets
- Rank holders by size + ownership %
- Compare snapshots (prev → current) with null-safe diffs
- Export results to JSON for frontend or API use

### Install (workspace)
From the monorepo root:

```bash
npm install -w ./packages/whale-tracker
```

### Run

```bash
npm run dev -w ./packages/whale-tracker -- \
  --mint <MINT_ADDRESS> \
  --limit 20 \
  --out snapshots/<mint>-whales.json
```

### Run with previous snapshot (diff included)

```bash
npm run dev -w ./packages/whale-tracker -- \
  --mint <MINT_ADDRESS> \
  --limit 20 \
  --prev snapshots/prev.json \
  --out snapshots/new.json
```

### Output format

```ts
{ "snapshot": {...}, "diff": {...} }
```

Fully **read-only** — no wallet connect, no private keys, no approvals.

---

## 👥 Target audience

Token founders, contributors, mods and on-chain builders that want a single flow for:
- Supply + authority state
- Top holder spread
- Whale movement diffs
- JSON export for dashboards

All signals are **intel, not financial advice**.

---

## 🧱 Tech stack

- 100% **TypeScript**
- **Node.js CLI** focused package pattern
- Uses Helius-style RPC endpoints + DEX aggregation vibes  
  *(DexScreener, Raydium, authority state, holder spread, etc.)*

---

## 📁 Structure

```
/
├─ api/
├─ packages/
│   └─ whale-tracker/
│       ├─ src/index.ts
│       ├─ tsconfig.json
│       └─ README.md (this file)
├─ snapshots/
└─ README.md (root)
```

---

## 🤝 Contributing

Transparency-first tooling contributions are welcome.

Rules:
- Tool = read-only CLI utilities
- Folder = `packages/<tool-name>`
- README must include install & run examples
- No spam, shilling, or speculative reach claims

---

## 🆓 License

:contentReference[oaicite:3]{index=3} — free for anyone.  
Created by Kevin Smits.

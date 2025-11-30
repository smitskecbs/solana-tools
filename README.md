# Solana Tools — SPL Toolkit

A **Solana Kit–first**, **read-only** developer toolkit for exploring SPL tokens, holders, whales, and DEX pool metrics directly from your terminal or web dashboard.

Built in TypeScript by a community builder, for the builder community.  
No transaction signing. No funds moving. Just on-chain insights and DEX data.

---

## 🧠 Core Stack

- :contentReference[oaicite:0]{index=0} (Kit-first Web2+Web3 calls)
- :contentReference[oaicite:1]{index=1}
- :contentReference[oaicite:2]{index=2} / :contentReference[oaicite:3]{index=3}
- :contentReference[oaicite:4]{index=4} (fallback support)
- Runs on: any system with :contentReference[oaicite:5]{index=5} + terminal access

---

## 🧰 Tools in this Repo (`/packages`)

| Tool | Purpose | Output |
|---|---|---|
| `wallet-info` | Wallet SOL + SPL balances | JSON, balance summary |
| `token-info` | SPL mint metadata & supply | Mint details, authorities |
| `holder-info` | Holder snapshot + distribution | CSV & JSON snapshots |
| `whale-tracker` | Whale scanner (% of supply) | Top holder list |
| `cbs-metrics` | SPL DEX pool metrics | Pool count + liquidity info |
| `token-safety-check` | Heuristic risk check | Token safety report |
| `raydium-analyzer` | Pool pair analytics | Pair insights, pool data |

> ⚠️ **Note**  
> Holder and whale data currently return reliable results for smaller SPL mints.  
> Very large tokens with massive holder counts may hit **free public RPC rate limits (429)**, causing slower loads or failures. We are optimizing for scale.

---

## 📦 Clone & Install

```bash
git clone <REPO_URL>
cd solana-tools
npm install
```

Install globally available dev dependencies if needed:

```bash
npm install -g ts-node tsx
```

---

## 🚀 Run Any Tool (Examples)

Wallet info:

```bash
ts-node ./packages/wallet-info/index.ts --address <WALLET>
```

Mint info:

```bash
ts-node ./packages/token-info/index.ts --mint <TOKEN_MINT>
```

Snapshot holders:

```bash
ts-node ./packages/holder-info/index.ts --mint <TOKEN_MINT> --out snapshots
```

Scan whales:

```bash
ts-node ./packages/whale-tracker/index.ts --mint <TOKEN_MINT> --min 1
```

---

## 🌍 CBS Coin Project (showcase, not required)

Founder project built by Kevin Smits:

- Website: **cbs-coin.com**
- Mint: `B9z8cEWFmc7LvQtjKsaLoKqW5MJmGRCWqs1DPKupCfkk`
- Linked as a showcase of real usage for this toolkit

---

## ✅ Principles

- 100% **read-only operations**
- Created by a community builder (:contentReference[oaicite:6]{index=6})
- **Free to use** for the Solana ecosystem
- Attribution appreciated, not required

---

## 🛡️ Disclaimer

This toolkit provides **on-chain data and DEX metrics only**.

- **Not financial advice**
- **Always DYOR**
- **No tokens endorsed, promoted, or transferred by this repo**

---

## 🧩 Package-Level READMEs

Each tool inside `/packages/<tool>` includes its own dedicated README.md with:

- setup details
- supported flags
- expected output schema

Jump into any folder to learn more.


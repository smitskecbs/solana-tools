# @smitskecbs/token-safety-check

Fast, open-source CLI for checking the basic safety properties of any Solana SPL token.

This tool inspects:

- Mint authority (renounced or not)
- Freeze authority presence
- Holder concentration (top 10 holders)
- Raydium liquidity, volume & price change (via DexScreener)
- Clean risk summary (OK / Warning / High Risk)

Built by **Kevin Smits (@smitskecbs)**.  
Free for the Solana community.

---

## 🚀 Installation (monorepo)

From the repository root:

    npm install

---

## ⚠️ RPC IMPORTANT (READ THIS)

For full and reliable results, **you MUST use your own RPC** (Helius recommended).

Why?

- The public RPC (`https://api.mainnet-beta.solana.com`) is rate-limited  
- Calls like `getTokenLargestAccounts` often fail with `429 Too Many Requests`
- Without a private RPC, holder data and concentration may not load

### ✔ Recommended RPC example (Helius)

    RPC_URL="https://mainnet.helius-rpc.com/?api-key=YOUR_KEY_HERE"

Replace `YOUR_KEY_HERE` with your real Helius API key.

---

## 🧪 Usage

Basic command:

    npm run token-safety -- --mint <SPL_MINT>

Example:

    npm run token-safety -- --mint B9z8cEWFmc7LvQtjKsaLoKqW5MJmGRCWqs1DPKupCfkk

### With JSON output:

    npm run token-safety -- --mint <SPL_MINT> --json

---

## 🔧 Recommended full usage with Helius

    RPC_URL="https://mainnet.helius-rpc.com/?api-key=YOUR_KEY_HERE" \
      npm run token-safety -- --mint <SPL_MINT>

Result:  
- No 429 rate limits  
- Holder concentration loads correctly  
- Safety summary becomes fully accurate

---

## 📄 Output example

    Token safety check for mint: <MINT>
    ----------------------------------------------------------------------

    Mint info:
      Decimals:           9
      Supply (UI):        87,939,745.67
      Mint authority:     DISABLED (renounced)
      Freeze authority:   none

    Holders:
      Total supply:       87,019,406.05
      Top 10 share:       91.68%
      Top holders:
        - <address>   ~20,785,115 (23.89%)
        - <address>   ~17,435,249 (20.04%)
        ...

    Raydium:
      Best pool: CBS/SOL
      Liquidity: $1,163
      Volume 24h: $72
      Price change 24h: 13%

    Risk summary:
      Mint authority : ✅ OK
      Freeze authority: ✅ OK
      Concentration  : ❌ Top 10 > 90%
      Liquidity      : ⚠️ < $5k

---

## 🆓 License

MIT — free for anyone.  
Created by **Kevin Smits (@smitskecbs)**.

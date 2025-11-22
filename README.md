# 📘 Token Info Fetcher — Solana  
A fast and reliable CLI tool for fetching Solana token information including metadata, supply, and price — with smart multi-layer fallbacks.

---

## 🚀 Installation

```bash
git clone https://github.com/smitskecbs/solana-tools.git
cd solana-tools/token-info
npm install
```

---

## ▶️ Usage

```bash
node index.js <MINT_ADDRESS>
```

Example:

```bash
node index.js B9z8cEWFmc7LvQtjKsaLoKqW5MJmGRCWqs1DPKupCfkk
```

---

## 🔑 Optional API Keys

### Helius (best metadata fallback)

```bash
export HELIUS_API_KEY="YOUR_KEY"
```

Helius provides:
- On-chain metadata  
- Off-chain metadata  
- Legacy token-list metadata  
(Almost always returns a correct name + symbol)

### Birdeye (optional price source)

```bash
export BIRDEYE_API_KEY="YOUR_KEY"
```

---

## 📡 What This Tool Returns

- **Name & Symbol**  
  Fallback order:  
  1. Metaplex on-chain  
  2. Solana token lists  
  3. Helius DAS (optional)  

- **Decimals**

- **Total Supply (UI amount)**

- **Price**  
  Fallback order:  
  1. Jupiter v6  
  2. Jupiter legacy  
  3. Birdeye  
  4. DexScreener (strict)  
  5. DexScreener (low-liquidity fallback)  
  6. Stablecoin sanity check ($1 lock)

If all price sources fail:
```
ℹ️ Price: not available (no feeds)
```

---

## 🧪 Examples

### CBS Coin (low liquidity)
```
Name: CBS Coin (helius-das)
Price: $0.00005935 (dexscreener-lowliq)
```

### BONK
```
Name: Bonk (helius-das)
Price: $0.0000086 (dexscreener)
```

### USDC
```
Name: USD Coin (solana-list)
Price: $1 (stable-sanity)
```

---

## 📁 Project Structure

```
solana-tools/
 └── token-info/
      ├── index.js
      ├── package.json
      └── README.md
```

---

## ⚙️ Requirements

- Node.js 18+  
- Internet connection  
- Optional: Helius & Birdeye API keys  

---

## ✔ Status

This tool is **production-ready**, featuring:
- Safe and layered fallbacks  
- Robust HTTP requests  
- Multiple metadata providers  
- Clean, readable CLI output  

Ideal for Solana developers, dashboards, explorers, and automation scripts.

---

## 🔥 Author

Built by **Kevin Smits**  
Part of **CBS Coin — Community Builds Sovereignty**

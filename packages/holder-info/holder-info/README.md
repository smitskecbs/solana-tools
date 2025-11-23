# 👥 Holder Info — Solana SPL Holder Analyzer  
A CLI tool to analyze SPL token holder distribution on Solana.

Fetches:
- holder count  
- top holders  
- supply distribution  
- optional excludes (LP/burn/team wallets)  
- JSON export for dashboards

---

## 🚀 Install

```bash
cd solana-tools/holder-info
npm install
```

---

## ▶️ Usage

```bash
node index.js <MINT_ADDRESS>
```

Example:

```bash
node index.js DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263
```

---

## ⚙️ Options

### Top holders (default 10)
```bash
node index.js <MINT> --top 25
```

### Minimum balance filter
Only count holders with at least X tokens:
```bash
node index.js <MINT> --min 1
```

### Exclude specific owners
Useful for ignoring LP pools, burn wallets, team wallets:
```bash
node index.js <MINT> --exclude owner1,owner2,owner3
```

### JSON output
Perfect for websites or scripts:
```bash
node index.js <MINT> --json
```

### Raw mode (prints raw list)
```bash
node index.js <MINT> --raw
```

---

## ✅ Output Includes
- decimals  
- total supply  
- total token accounts  
- holder count  
- top N holders with %  
- top N distribution vs rest  
- excludes + min filter summary  

---

## 📁 Fits Into Solana Tools

```
solana-tools/
 ├ token-info/
 ├ wallet-info/
 ├ nft-info/
 └ holder-info/
```

---

## 📜 License
MIT — free to use and modify.

PRs welcome!

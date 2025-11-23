# solana-tools 🛠️  
A modern TypeScript monorepo containing multiple Solana CLI utilities.  
Every tool supports **web3.js v1** and **Solana Kit v2**.

---

## 📦 Tools Included

### **holder-info**
Inspect SPL token holders (top holders, amounts, token accounts).

**Run:**
```
npm run dev -w ./packages/holder-info -- <MINT>
npm run dev:kit -w ./packages/holder-info -- <MINT>
```

---

### **token-info**
Fetch SPL token metadata, mint info, authorities, and URI.

**Run:**
```
npm run dev -w ./packages/token-info -- <MINT>
npm run dev:kit -w ./packages/token-info -- <MINT>
```

---

### **wallet-info**
Inspect wallet balances, SPL tokens, transactions, and optional Helius enhanced info.

**Run:**
```
npm run dev -w ./packages/wallet-info -- <WALLET>
npm run dev:kit -w ./packages/wallet-info -- <WALLET>
```

---

### **nft-info**
Inspect Solana NFTs / Digital Assets using Helius DAS v1 or Solana Kit.

**Run:**
```
npm run dev -w ./packages/nft-info -- <ASSET_ID>
npm run dev:kit -w ./packages/nft-info -- <ASSET_ID>
```

---

## 📁 Project Structure
```
solana-tools/
  package.json        → workspace root
  tsconfig.base.json  → shared TS config
  /packages
    /holder-info
    /token-info
    /wallet-info
    /nft-info
```

---

## ⚙️ Requirements
- Node.js 18+
- npm
- Optional: Helius RPC + DAS API key

Add to `.env` (root):
```
RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
HELIUS_API_KEY=YOUR_KEY
```

---

## 🏃 Running Any Tool
General format:
```
npm run dev -w ./packages/<tool> -- <ARG>
npm run dev:kit -w ./packages/<tool> -- <ARG>
```

---

## ✨ Notes
- All tools now fully support **Solana Kit** for future-proof RPC features.
- All legacy **web3.js v1** implementations kept for compatibility.
- Workspace linting, folder structure, and scripts standardized.

---

## 📜 License
MIT

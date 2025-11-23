# solana-tools 🛠️  
Modern TypeScript monorepo by **Kevin Smits** — free, open-source Solana CLI tools for builders.

Supports both:
- **web3.js v1**
- **Solana Kit v2 (@solana/kit)**

---

## 🚀 Tools Included

### **holder-info**  
Inspect SPL token holders (top holders, token accounts, amounts).  
**Run:**  
```bash
npm run dev -w ./packages/holder-info -- <MINT>
npm run dev:kit -w ./packages/holder-info -- <MINT>
```

### **token-info**  
Fetch SPL token mint info + on-chain metadata (name, symbol, URI, authorities, supply).  
**Run:**  
```bash
npm run dev -w ./packages/token-info -- <MINT>
npm run dev:kit -w ./packages/token-info -- <MINT>
```

### **wallet-info**  
Analyze wallet balances, SPL tokens, recent transactions, optional Helius enhancements.  
**Run:**  
```bash
npm run dev -w ./packages/wallet-info -- <WALLET>
npm run dev:kit -w ./packages/wallet-info -- <WALLET>
```

### **nft-info**  
Inspect any NFT / Digital Asset via Helius DAS getAsset (v1) and Kit (v2).  
**Run:**  
```bash
npm run dev -w ./packages/nft-info -- <ASSET_ID>
npm run dev:kit -w ./packages/nft-info -- <ASSET_ID>
```

---

## 📦 Install
```bash
git clone https://github.com/smitskecbs/solana-tools.git
cd solana-tools
npm install
```

---

## ⚙️ Optional .env
```env
RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
HELIUS_API_KEY=YOUR_HELIUS_KEY
```
- RPC is used by all tools  
- Helius key adds richer metadata for nft-info & wallet-info (optional)

---

## 🧱 Build all packages
```bash
npm run build -w ./packages/holder-info
npm run build -w ./packages/token-info
npm run build -w ./packages/wallet-info
npm run build -w ./packages/nft-info
```

---

## 🤝 Contributing
PRs welcome.  
Every tool must have:
- `index.ts` (web3.js v1)
- `index.kit.ts` (@solana/kit v2)  
No `node_modules` or `dist` in Git.

---

## 🆓 License
MIT — free for anyone.  
Credit to **Kevin Smits (smitskecbs)** appreciated.

# solana-tools 🛠️  
Modern TypeScript monorepo by **Kevin Smits** — free, open-source Solana CLI utilities.

All tools are written **100% in TypeScript** and support:
- **web3.js (v1 API) in TypeScript**
- **Solana Kit (v2 API)**

Each tool has:
- `index.ts` → web3.js version (TypeScript)
- `index.kit.ts` → Solana Kit version (TypeScript)

---

## 🚀 Tools Included

### **holder-info**  
Inspect SPL token holders (top holders, token accounts, amounts).  
**Run:**  
```bash
npm run dev -w ./packages/holder-info -- <MINT>
npm run dev:kit -w ./packages/holder-info -- <MINT>
```

---

### **token-info**  
Fetch SPL token mint info + on-chain metadata (name, symbol, URI, authorities, supply).  
**Run:**  
```bash
npm run dev -w ./packages/token-info -- <MINT>
npm run dev:kit -w ./packages/token-info -- <MINT>
```

---

### **wallet-info**  
Analyze balances, SPL tokens, recent transactions, optional Helius enhanced info.  
**Run:**  
```bash
npm run dev -w ./packages/wallet-info -- <WALLET>
npm run dev:kit -w ./packages/wallet-info -- <WALLET>
```

---

### **nft-info**  
Inspect any NFT / Digital Asset via Helius DAS getAsset and via Solana Kit.  
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
Each tool must keep both versions:
- `index.ts` (web3.js TS)
- `index.kit.ts` (Solana Kit TS)

No `node_modules` and no `dist` folders in Git.

---

## 🆓 License
MIT — free for anyone.  
Created by **Kevin Smits (smitskecbs)**.

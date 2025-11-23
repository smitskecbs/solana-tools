# solana-tools 🛠️🚀  
**A Modern Solana Developer Toolbox — Powered by TypeScript, web3.js v1 & Solana Kit v2**

![solana-tools screenshot](sandbox:/mnt/data/90008ae2-9609-470d-a268-130a5dc81f74.png)

---

## 🏷️ Badges

![Node](https://img.shields.io/badge/Node-18+-green?style=for-the-badge)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=for-the-badge)
![Solana](https://img.shields.io/badge/Solana-Blockchain-purple?style=for-the-badge)
![RPC](https://img.shields.io/badge/Helius-RPC-orange?style=for-the-badge)
![Workspace](https://img.shields.io/badge/Monorepo-npm_workspaces-blueviolet?style=for-the-badge)

---

## 📦 Tools Included

### 🔍 **holder-info**
Inspect SPL token holders  
(top holders, amounts, token accounts).

**Run:**
```
npm run dev -w ./packages/holder-info -- <MINT>
npm run dev:kit -w ./packages/holder-info -- <MINT>
```

---

### 🧬 **token-info**
Fetch SPL token metadata, URI, supply, authorities, and update authority.

**Run:**
```
npm run dev -w ./packages/token-info -- <MINT>
npm run dev:kit -w ./packages/token-info -- <MINT>
```

---

### 👛 **wallet-info**
Solana wallet inspector:  
SOL balance, SPL tokens, tx history, activity type detection, optional Helius enrichment.

**Run:**
```
npm run dev -w ./packages/wallet-info -- <WALLET>
npm run dev:kit -w ./packages/wallet-info -- <WALLET>
```

---

### 🖼️ **nft-info**
NFT / Digital Asset inspector using Helius DAS v1 or native Solana Kit.

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
- npm 9+
- Optional: Helius RPC key  
- Optional: DAS API key

`.env` example:
```
RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
HELIUS_API_KEY=YOUR_KEY
```

---

## 🏃 Running Any Tool
General command format:
```
npm run dev -w ./packages/<tool> -- <ARG>
npm run dev:kit -w ./packages/<tool> -- <ARG>
```

---

## 💡 Philosophy  
This repo is built to:

- ✨ Help new Solana developers learn quickly  
- 🔍 Provide clean CLI utilities for debugging  
- ♻️ Support both old (web3.js v1) and future (Solana Kit v2) stacks  
- 🚀 Keep tools fast, simple, and open-source  

---

## 📜 License  
MIT — Free to use, modify and build on.


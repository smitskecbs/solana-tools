# wallet-info 👛  
Solana wallet analyzer: SOL, SPL tokens, transactions & Helius insights.

---

## 📌 Features
- SOL balance  
- SPL token balances  
- Detect tx type (swap / token / transfer)  
- Fetch last 10 transactions  
- Helius enhanced API:
  - Labels  
  - Total received  
  - Total sent  
  - Owner type  
  - Creation time  

Supports web3.js v1 + Solana Kit v2.

---

## ▶️ Run (web3.js v1)

```
npm run dev -w ./packages/wallet-info -- <WALLET>
```

## ▶️ Run (Solana Kit v2)

```
npm run dev:kit -w ./packages/wallet-info -- <WALLET>
```

Example:
```
npm run dev:kit -w ./packages/wallet-info -- 8Y7wEBB15f8mpQ7H5Wa1pVdo1TNSg2KE7rLKApHUk5Zd
```

---

## 📦 Output
- SOL balance  
- SPL tokens  
- Last 10 tx with:
  - timestamp  
  - type  
  - SOL change  
  - signature  
- Helius account enrichment (if API key provided)

---

## ⚙️ Requirements
- Node 18+  
- Optional `.env`:
```
RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
HELIUS_API_KEY=YOUR_KEY
```

---

## 📜 License  
MIT

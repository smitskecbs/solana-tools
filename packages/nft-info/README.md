# nft-info 🖼️  
Solana NFT / Digital Asset inspector using Helius DAS + Solana Kit.

---

## 📌 Features
- Fetch full DAS asset info  
- Extract:
  - Name  
  - Symbol  
  - Description  
  - JSON metadata  
  - Image URL  
  - Mint authority  
  - Creators & shares  
  - Royalty  
  - Compression status  
- Supports web3.js & Kit (Solana v2)

---

## ▶️ Run (web3.js v1)

```
npm run dev -w ./packages/nft-info -- <ASSET_ID>
```

## ▶️ Run (Solana Kit v2)

```
npm run dev:kit -w ./packages/nft-info -- <ASSET_ID>
```

Example:
```
npm run dev:kit -w ./packages/nft-info -- B9z8cEWFmc7LvQtjKsaLoKqW5MJmGRCWqs1DPKupCfkk
```

---

## 📦 Output Includes
- All metadata fields  
- Royalty & creators  
- Compression info  
- Owner (if not hidden)  
- JSON URI + image URI  

---

## ⚙️ Requirements
- Node 18+  
- Helius RPC recommended  
- `.env`:
```
RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
```

---

## 📜 License  
MIT

# token-info 🧬  
SPL Token inspector: mint layout, supply, metadata & authorities.

---

## 📌 Features
- Reads mint account layout (web3.js v1)  
- Reads metadata PDA  
- Borsh string decoding (name, symbol, URI)  
- Reads:
  - Decimals  
  - Supply  
  - Mint authority  
  - Freeze authority  
  - Update authority  
  - On-chain metadata  

---

## ▶️ Run (web3.js v1)

```
npm run dev -w ./packages/token-info -- <MINT>
```

## ▶️ Run (Solana Kit v2)

```
npm run dev:kit -w ./packages/token-info -- <MINT>
```

Example:
```
npm run dev:kit -w ./packages/token-info -- B9z8cEWFmc7LvQtjKsaLoKqW5MJmGRCWqs1DPKupCfkk
```

---

## 📦 Output
- Full decoded mint account  
- Human-readable supply  
- All authorities  
- Token metadata (name, symbol, URI)  

---

## ⚙️ Requirements
- Node 18+  
- `.env` (optional):
```
RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
```

---

## 📜 License  
MIT

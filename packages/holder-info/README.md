# holder-info 🔍  
Inspect SPL token holders — top holders, balances & token accounts.

---

## 📌 Features
- Fetch all token accounts for a mint  
- Decode raw token account data  
- Sort by largest holders  
- Works with:
  - `web3.js v1`
  - `Solana Kit v2`

---

## ▶️ Run (web3.js v1)

```
npm run dev -w ./packages/holder-info -- <MINT>
```

## ▶️ Run (Solana Kit v2)

```
npm run dev:kit -w ./packages/holder-info -- <MINT>
```

Example:
```
npm run dev:kit -w ./packages/holder-info -- B9z8cEWFmc7LvQtjKsaLoKqW5MJmGRCWqs1DPKupCfkk
```

---

## 📦 Output
- Top 50 holders  
- Owner addresses  
- Raw U64 token amount  
- Token account addresses  
- Non-zero holder count  

---

## ⚙️ Requirements
- Node 18+
- `.env` (optional)
```
RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
```

---

## 📜 License  
MIT


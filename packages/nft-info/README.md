# nft-info

Inspect NFTs / Digital Assets using:
- **Helius DAS getAsset API (v1)** → `index.ts`
- **Solana Kit v2 (native Kit Asset)** → `index.kit.ts`

Shows:
- name, symbol, description  
- JSON metadata URI & image  
- creators  
- authorities  
- compression data  

Created by **Kevin Smits** — free & open-source.

---

## 🔧 Usage

### Web3.js/DAS (TS)
```bash
npm run dev -w ./packages/nft-info -- <ASSET_ID>
```

### Solana Kit v2 (TS)
```bash
npm run dev:kit -w ./packages/nft-info -- <ASSET_ID>
```

---

## 📦 Install (root repo)
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

## 🆓 License
MIT — free to use.

# wallet-info

Analyze Solana wallets:
- SOL balance
- SPL tokens
- Recent transactions
- Optional enhanced Helius DAS lookups

Two modes:
- **web3.js (TS)** → `index.ts`
- **Solana Kit v2** → `index.kit.ts`

Built by **Kevin Smits** — free & open-source.

---

## 🔧 Usage

### Web3.js (TS)
```bash
npm run dev -w ./packages/wallet-info -- <WALLET>
```

### Solana Kit (TS)
```bash
npm run dev:kit -w ./packages/wallet-info -- <WALLET>
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

# solana-tools 🛠️

A modern TypeScript monorepo with multiple Solana CLI utilities, built by **Kevin Smits**.  
Everything here is **free to use**, open-source, and made for builders who want quick, readable on-chain insights.

Each tool supports:
- **web3.js v1** (classic, widely used)
- **@solana/kit v2** (newer, typed, future-proof)

---

## ✅ Tools Included

### **holder-info**
Inspect SPL token holders (top holders, amounts, token accounts).

**Run:**
```bash
npm run dev     -w ./packages/holder-info -- <MINT>
npm run dev:kit -w ./packages/holder-info -- <MINT>

token-info

Fetch SPL token mint info + on-chain metadata
(name / symbol / uri / authorities / supply).

Run: npm run dev     -w ./packages/token-info -- <MINT>
npm run dev:kit -w ./packages/token-info -- <MINT>

wallet-info

Analyze a wallet: SOL balance, SPL tokens, and recent transactions
(with optional Helius enriched labels if you provide a key).

Run:npm run dev     -w ./packages/wallet-info -- <WALLET_ADDRESS>
npm run dev:kit -w ./packages/wallet-info -- <WALLET_ADDRESS>

nft-info

Inspect an NFT / digital asset using Helius DAS getAsset
(works for standard NFTs, pNFTs, and fungible tokens too).

Run:npm run dev     -w ./packages/nft-info -- <ASSET_ID>
npm run dev:kit -w ./packages/nft-info -- <ASSET_ID>

📦 Install
git clone https://github.com/smitskecbs/solana-tools.git
cd solana-tools
npm install
⚙️ Optional Environment Setup

Create a .env in the repo root if you want custom RPC / Helius features: RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
HELIUS_API_KEY=YOUR_HELIUS_KEY
RPC_URL is used by all tools.

HELIUS_API_KEY is only needed for extra labeling/enrichment in nft-info and wallet-info.
🧱 Build (dist/)

Each package can be built to dist/ with tsup:npm run build -w ./packages/holder-info
npm run build -w ./packages/token-info
npm run build -w ./packages/wallet-info
npm run build -w ./packages/nft-info
🤝 Contributing

PRs are welcome. Keep changes clean and readable:

add both index.ts (v1) and index.kit.ts (v2) when relevant

avoid committing node_modules/ or build output

📜 License

MIT — use it, fork it, improve it.
If this repo helps you, a shoutout to Kevin Smits / smitskecbs is appreciated.
::contentReference[oaicite:0]{index=0}

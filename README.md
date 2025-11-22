# 🔧 Solana Tools — Open-Source Utilities for Builders

A growing collection of lightweight, open-source tools built to explore and analyze the Solana blockchain.

Created by **Kevin Smits**, this toolkit focuses on clarity, simplicity, and providing devs & analysts with fast terminal-based insights.

---

## 🚀 Tools Included

### 1) **Token Info** — SPL Token Analyzer  
Fetches token metadata, supply, decimals, and price with multi-source fallback.

📁 Folder: `token-info/`  
▶ Run:
```bash
cd token-info
node index.js <MINT_ADDRESS>
```

✨ Features  
- Metaplex metadata fetch  
- Total supply (UI amount)  
- Decimals  
- Price via Dexscreener (with low-liquidity fallback)  
- Helius DAS metadata fallback  
- Stablecoin sanity check  

---

### 2) **Wallet Info** — Wallet Analyzer  
Inspects any Solana wallet: balances, SPL tokens, NFTs, and decoded transactions.

📁 Folder: `wallet-info/`  
▶ Run:
```bash
cd wallet-info
node index.js <WALLET_ADDRESS>
```

✨ Features  
- SOL balance  
- SPL token balances (UI format)  
- NFT detection  
- Last 10 transactions  
- Automatic retry for rate-limited RPCs  
- Optional **Helius Enhanced Mode**:  
  - DAS metadata  
  - Decoded transaction actions  
  - Friendly labels (swap, mint, burn, transfer, etc.)

Enable Helius:
```bash
export HELIUS_API_KEY="your_key_here"
```

---

### 3) **NFT Info** — Digital Asset / NFT Inspector  
Fetches full Solana NFT / DAS asset details including metadata, creators, royalties, collection, and compressed NFT info.

📁 Folder: `nft-info/`  
▶ Run:
```bash
cd nft-info
node index.js <NFT_MINT_OR_ASSET_ID>
```

✨ Features  
- Name, symbol, description  
- Owner + delegate  
- Creators (share + verified)  
- Royalty %  
- Collection address  
- JSON metadata URI + image URL  
- Attributes / traits (if present)  
- Detects **compressed vs standard NFTs**  
  - Tree address, leaf id, hashes for cNFTs

Helius key required:
```bash
export HELIUS_API_KEY="your_key_here"
```

Raw mode:
```bash
node index.js <NFT_MINT_OR_ASSET_ID> --raw
```

---

## 🛠 Installation

Requires **Node.js 18+**.

Clone the repo:

```bash
git clone https://github.com/smitskecbs/solana-tools.git
cd solana-tools
```

Each tool has its own folder with a `package.json`.  
Install per tool:

```bash
cd token-info
npm install

cd ../wallet-info
npm install

cd ../nft-info
npm install
```

---

## 📂 Repository Structure

```
solana-tools/
│
├── token-info/        # SPL token analyzer
│   ├── index.js
│   ├── package.json
│   └── README.md
│
├── wallet-info/       # Wallet inspector tool
│   ├── index.js
│   ├── package.json
│   └── README.md
│
├── nft-info/          # NFT / Digital Asset inspector
│   ├── index.js
│   ├── package.json
│   └── README.md
│
└── README.md          # (this file)
```

---

## 🧭 Roadmap

Planned future tools:

- 📊 **Token Holder Analyzer**  
- 🧪 **LP Pool Inspector** (Raydium/Orca/Meteora)  
- 🔍 **Program / Contract Inspector**  
- 🪂 **Airdrop Helper**  
- 📈 **Small CLI dashboard components**  
- 💱 **Swap activity / token flow analyzer**

Feedback welcome!

---

## 🤝 Contributing

Pull requests from Solana builders are welcome.  
Feel free to open issues, suggest improvements, or add new tools.

---

## 📜 License
This project is open-source under the **MIT License**.  
Use freely in your own Solana tooling or dashboards.

---

Thanks for checking out **Solana Tools** — more utilities coming soon.
Inspired by curiosity. Built for the community. 🚀

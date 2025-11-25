# solana-tools 🛠️

Modern TypeScript monorepo by **Kevin Smits (@smitskecbs)** — free, open-source Solana CLI utilities.

All tools are:

- Written in **TypeScript**
- Designed for **Node.js CLI use**
- Using **web3.js** and/or **Solana Kit (v2)**

Each tool lives in `packages/<tool-name>` with its own README and usage examples.

---

## 📦 Install

    git clone https://github.com/smitskecbs/solana-tools.git
    cd solana-tools
    npm install

Optional `.env` (for custom RPC / Helius):

    RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
    HELIUS_API_KEY=YOUR_HELIUS_KEY

---

## 🚀 Available tools

Current tools in this monorepo:

- `holder-info` – inspect SPL token holders (top holders, balances, token accounts)
- `token-info` – read SPL mint info + on-chain metadata (name, symbol, URI, authorities, supply)
- `wallet-info` – wallet overview (SOL balance, SPL tokens, recent activity)
- `nft-info` – inspect NFTs / digital assets (via Helius DAS / Solana Kit)
- `snapshot-airdrop` – snapshot SPL holders to CSV + JSON for fair airdrops
- `raydium-analyzer` – inspect Raydium pools for any SPL mint (via DexScreener)

For **usage per tool**, see the README inside each package, for example:

- `packages/holder-info/README.md`
- `packages/snapshot-airdrop/README.md`
- `packages/raydium-analyzer/README.md`

---

## 🧱 Scripts (monorepo)

Generic pattern from the repo root:

- Dev / run a tool:

      npm run dev -w ./packages/<tool> -- <args>

- Kit / v2 variant (if available):

      npm run dev:kit -w ./packages/<tool> -- <args>

Check each package README for exact examples and flags.

---

## 🤝 Contributing

Pull requests are welcome.

Guidelines:

- Tools live in `packages/<tool-name>`
- Each tool has its own `README.md`
- No `node_modules` or `dist` folders in Git

---

## 🆓 License

MIT — free for anyone.  
Created by **Kevin Smits (@smitskecbs)**.

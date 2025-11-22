# 🧾 Wallet Info — Solana Wallet Analyzer  
A lightweight command-line tool to inspect any Solana wallet.  
Shows SOL balance, SPL token balances, token mint addresses, and (optional) enhanced insights using Helius DAS.

---

## ✨ Features

- 🔹 Fetch SOL balance  
- 🔹 List SPL tokens with UI balance  
- 🔹 Detect NFTs & fungible tokens  
- 🔹 Fetch last transaction signatures  
- 🔹 Retry logic for rate-limited RPCs  
- 🔹 Optional **Helius Enhanced Mode**:
  - Friendly transaction labels (swap, mint, burn, transfer, etc.)
  - Token metadata (name, symbol, image)
  - DAS-based token identification

---

## 📦 Install

Inside this folder:

```bash
npm install
```

Nothing else required. All dependencies are included in `package.json`.

---

## 🚀 Run

Basic usage:

```bash
node index.js <WALLET_ADDRESS>
```

Example:

```bash
node index.js 2AfbvQCWz2CbuNfBfR4QdVxzjMs1twV8rHJCqME8LtSD
```

---

## 🧰 Optional: Enable Helius Enhanced Mode

You can add extra metadata and better transaction decoding with the Helius DAS API.

Set your key temporarily (only for this terminal session):

```bash
export HELIUS_API_KEY="YOUR_KEY_HERE"
```

Now run:

```bash
node index.js <WALLET_ADDRESS>
```

If a valid Helius key is set, you will see:

- Token names & symbols from DAS
- NFT metadata
- Better transaction labels
- Cleaner and richer output

If no key is set, the tool still works — just with fewer details.

---

## 📁 Files

```
wallet-info/
├── index.js       # main script
├── package.json   # dependencies
└── README.md      # this file
```

---

## ⚙️ RPC Logic

This tool uses multiple reliable RPC endpoints:

1. Helius (if key available)  
2. Solana public RPC fallback  
3. Built-in retry logic (500ms → 1s → 2s → 4s)

This makes it extremely stable, even for large wallets or heavy rate limited networks.

---

## 🧪 Example Output

```
🔍 Wallet analysis for: 2AfbvQ...

💰 SOL Balance: 0.0024 SOL
📦 SPL Tokens (12):
 • 15881732 CBS
 • 0.161338 USDC
 • 677 BONK
 • ...

📜 Last 10 transactions:
 • 11/22/2025 | transfer | -0.002 SOL | <signature>
 • ...

🔎 Helius Enhanced: ACTIVE
Done.
```

---

## 📝 Notes

- Works on macOS, Linux, WSL, and plain Node.js on Windows.  
- RPC errors like 429 are automatically retried.  
- Helius is optional but strongly recommended.  
- No private keys needed — **read-only tool**.

---

## 📜 License

MIT — free to use, free to modify.

---

## 🤝 Contribute

Pull requests welcome!  
Developers can improve:

- Token display ordering  
- NFT metadata  
- Swap / LP / burn decoding  
- Wallet tagging  
- Providing an HTML/Web dashboard version

# 🖼️ NFT Info — Solana Digital Asset Inspector
A simple CLI tool to fetch full Solana NFT / Digital Asset information using the Helius DAS `getAsset` method.

Works for:
- Standard Metaplex NFTs  
- pNFTs  
- Compressed NFTs (cNFTs)  
- Any DAS-compatible Solana asset  

---

## 🚀 Install

```bash
cd solana-tools/nft-info
npm install
```

---

## ▶️ Usage

```bash
node index.js <NFT_MINT_OR_ASSET_ID>
```

Example:

```bash
node index.js 7YkQ...YourMintHere...
```

---

## 🔑 Required: Helius API Key

This tool uses Helius DAS, so you need a key:

```bash
export HELIUS_API_KEY="YOUR_KEY_HERE"
```

Then run again:

```bash
node index.js <NFT_MINT_OR_ASSET_ID>
```

---

## 🧪 Raw JSON Mode

If you want the full DAS response:

```bash
node index.js <NFT_MINT_OR_ASSET_ID> --raw
```

---

## ✅ Output Includes

- Name, symbol, description  
- Owner & delegate  
- Compressed vs standard NFT  
- Merkle tree + leaf data (for cNFTs)  
- Creators + verified status  
- Collection address  
- Royalty basis points (%)  
- Metadata JSON URI  
- Image URL  
- Attributes / traits  

---

## 📁 Folder Structure

```
solana-tools/
 ├ token-info/
 ├ wallet-info/
 └ nft-info/
     ├ index.js
     ├ package.json
     └ README.md
```

---

## 📜 License

MIT — free to use and modify.

---

## 🤝 Contribute

Pull requests welcome. Improve trait parsing, add collection checks, or extend DAS support.

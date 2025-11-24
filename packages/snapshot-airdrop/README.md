# @smitskecbs/snapshot-airdrop

Snapshot SPL token holders for any Solana mint and export **CSV + JSON** for airdrops.

- **Kit-first (Solana v2)** using `@solana/kit`
- Automatic **web3.js fallback (v1)** if your RPC doesn’t return Kit-shaped data
- Outputs clean holder lists with on-chain balances

Built by **Kevin Smits (@smitskecbs)**.  
Free to use by the Solana community — attribution appreciated.

---

## Install (workspace)

From the repo root:

    npm install

---

## Run

Default (uses .env or CBS mint):

    npm run dev:kit -w ./packages/snapshot-airdrop

With options:

    npm run dev:kit -w ./packages/snapshot-airdrop -- \
      --mint B9z8cEWFmc7LvQtjKsaLoKqW5MJmGRCWqs1DPKupCfkk \
      --min 1 \
      --exclude wallet1,wallet2 \
      --out snapshots

You can also run the web3 fallback version directly:

    npm run dev -w ./packages/snapshot-airdrop -- --mint <MINT>

---

## Options

Flag | Description | Example
---|---|---
--mint | SPL token mint address | --mint <MINT>
--rpc | Custom RPC endpoint | --rpc https://…
--min | Minimum **UI** balance required | --min 1
--exclude | Comma-separated wallets to skip | --exclude w1,w2
--out | Output folder (default `snapshots/`) | --out snapshots
--top | Print top N holders (default 20) | --top 50

---

## Output

Creates a timestamped snapshot inside:

    snapshots/<MINT>/
      snapshot-<timestamp>.json
      snapshot-<timestamp>.csv

JSON fields:

    [
      {
        "owner": "walletPubkey",
        "tokenAccount": "tokenAccountPubkey",
        "amountRaw": "123456789000000000",
        "amountUi": 123.456789
      }
    ]

Note: `amountRaw` is stored as a **string** to avoid BigInt JSON issues.

---

## What this is for

Use this tool when you want to:

- Take a **holder snapshot** for an airdrop or whitelist
- Exclude wallets (team, LP, burn, bots)
- Export a ready-to-use CSV/JSON list for scripts or spreadsheets

---

## Disclaimer

This tool only reads public on-chain data.  
Always verify snapshots before sending funds/tokens.  
Use at your own risk.

---

## License / Usage

MIT-style free use.  
If you ship or fork it, a small credit to **Kevin Smits / @smitskecbs** is appreciated.

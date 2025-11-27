# Whale Token Tracker — Solana Kit (mainnet)

A read-only CLI tool for scanning top holder distribution and comparing whale movements for any SPL token mint on Solana mainnet.

## Features
- Fetches on-chain supply and largest wallet holders
- Produces ranked whale list with percentage ownership
- Supports null-safe snapshot diffing (previous → current)
- Exports results to JSON for frontend or API integrations
- 100% read-only (no wallet connect, no private keys)

## Installation
From repo root:
```bash
npm install -w ./packages/whale-tracker
```

## Usage
Scan whales by mint:
```bash
npm run dev -w ./packages/whale-tracker -- --mint <MINT> --limit 20
```

Generate and compare with previous snapshot:
```bash
npm run dev -w ./packages/whale-tracker -- --mint <MINT> --limit 20 --prev snapshots/prev.json --out snapshots/new.json
```

## Output formats
The CLI returns a terminal table and saves JSON when `--out` is used:
```ts
{ "snapshot": {...}, "diff": {...} }
```

## Contributors
Built by Kevin Smits — part of the solana-tools monorepo. Attribution appreciated.

## License
Open source. Free to use. DYOR.

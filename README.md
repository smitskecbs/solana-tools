# Solana Whale Token Tracker

A read-only CLI utility for scanning top wallet holders of any SPL token mint on Solana mainnet and comparing whale movements between snapshots.

## What this tool does

- Reads total UI-supply from chain
- Lists the largest wallet holders ranked by size
- Calculates approximate ownership percentage per wallet
- Compares snapshots (previous → current) safely, even when data is missing
- Saves output as JSON for frontend or API integration
- Stays fully read-only — no wallet connections, no private keys, no approvals

## Install (workspace)

From the monorepo root:

```bash
npm install -w ./packages/whale-tracker
```

## Run a fresh whale scan

```bash
npm run dev -w ./packages/whale-tracker -- --mint <MINT_ADDRESS> --limit 20
```

## Generate a diff using an earlier snapshot

```bash
npm run dev -w ./packages/whale-tracker -- --mint <MINT_ADDRESS> --limit 20 --prev snapshots/prev.json --out snapshots/new.json
```

## Output format

```ts
{
  "snapshot": { /* ranked holders + supply */ },
  "diff": { /* biggest movers + status labels */ }
}
```

The JSON file is saved under `snapshots/` when the `--out` flag is used.

## Who is this for?

Token founders, developers, and community moderators that want clear, consolidated on-chain holder intelligence in a single command or clean dashboard integration.

## License

Free to use. Attribution appreciated if shared.

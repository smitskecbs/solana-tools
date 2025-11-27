# solana-tools

Modern TypeScript monorepo by Kevin Smits — free, open-source 

## Features

- Written in TypeScript
- Designed for Node.js CLI use
- Read-only on-chain data (no wallet connections, no private keys)

## Packages

### Whale Token Tracker

- Fetch ranked largest wallets by mint
- Calculate approximate percentage ownership
- Compare previous snapshot to current safely
- Export table + structured JSON for UI or API integration
- Fully read-only (no approvals, no keys)

### Other utilities

More SPL holder and pool intelligence tooling lives under `packages/<tool-name>` in the monorepo.

## Folder structure

```
/
├─ api/
├─ packages/
└─ snapshots/
```

## Contributing

Pull requests are welcome if focused on reliability and transparency.  
Do not commit node_modules, dist or lockfile noise unless required for reproducible CLI tooling.

## License

MIT — free for anyone.  
Created by Kevin Smits.

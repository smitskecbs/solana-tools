# Solana Tools – CLI toolkit for Solana (by Kevin Smits)

**Solana Tools** is a small TypeScript/Node monorepo with terminal utilities for:

- Inspecting Solana wallets (SOL + SPL balances, recent activity)
- Analyzing SPL token holder distributions
- Checking DEX liquidity (Raydium, etc.) via DexScreener
- Taking snapshots of SPL holders for airdrops
- Powering a Web2 dashboard + API server on top of the same logic

All tools are **read-only** (no private keys required).

They are built for:

- Builders who want quick on-chain insights from the terminal  
- Token creators who need holder snapshots, whale overviews, or DEX metrics  
- People exploring Solana research/analytics without spinning up a full backend

Built by **Kevin Smits** (Netherlands)  
X: [@smitske180](https://x.com/smitske180)


---

## Repo structure

This is a small monorepo with multiple packages and an optional API + Web2 dashboard:

- `packages/wallet-info` – wallet analysis (SOL balance, SPL tokens, recent tx)
- `packages/holder-info` – SPL token holder distribution + concentration
- `packages/cbs-metrics` – DexScreener-based DEX metrics for a given SPL mint
- `packages/snapshot-airdrop` – snapshot SPL holders and export for airdrops

Optional:

- `api-server/` – Express API that wraps the tools for use in Web2 frontends
- `docs/` – static Web2 dashboard (HTML) that calls the `api-server` endpoints

Each package under `packages/*` has its **own `README.md`** with more detailed usage, flags and examples.  
This root README is meant as the **high-level overview + quickstart**.


---

## Tech stack

- **Language:** TypeScript  
- **Runtime:** Node.js (tested with Node 18/20)

- **Solana:**
  - Primarily using `@solana/web3.js`
  - Some tools also have **Solana Kit** (`@solana/kit`) variants (`dev:kit` scripts)

- **Scripts & bundling:**
  - [`tsx`](https://github.com/esbuild-kit/tsx) for TypeScript execution
  - `npm` workspaces for managing multiple packages in one repo

- **On-chain / off-chain data:**
  - RPC (Helius or public RPC)
  - DexScreener public API for DEX metrics


---

## Prerequisites

- **Node.js** 18 or 20 (LTS recommended)  
- **npm** 10+  

Optional but recommended:

- A **Helius API key** (for better RPC performance & rate limits), especially for:
  - Large tokens (many token accounts)
  - Frequent queries (e.g. snapshots, scans)


---

## Installation

Clone the repo and install dependencies once:

```bash
git clone https://github.com/smitskecbs/solana-tools.git
cd solana-tools
npm install


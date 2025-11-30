# Solana Tools – CLI toolkit for Solana (by Kevin Smits)

**Solana Tools** is a small TypeScript/Node monorepo with terminal utilities for:
- Inspecting Solana wallets (SOL + SPL balances, recent activity)
- Analyzing SPL token holder distributions
- Checking DEX liquidity (Raydium, etc.) via DexScreener
- Taking snapshots of SPL holders for airdrops
- Powering a Web2 dashboard (HTML) + API server on top of the same logic

All tools are **read-only** (no private keys required) and are meant for:
- Builders who want quick on-chain insights from the terminal
- Token creators who need holder snapshots, whale overviews, or DEX metrics
- People exploring Solana research/analytics without spinning up a full backend

> Built by **Kevin Smits** (Netherlands) – X: [@smitske180](https://x.com/smitske180)

---

## Repo structure

This is a small monorepo with multiple packages:

- `packages/wallet-info` – wallet analysis (SOL balance, SPL tokens, recent tx)
- `packages/holder-info` – SPL token holder distribution + concentration
- `packages/cbs-metrics` – DexScreener-based DEX metrics for a given SPL mint
- `packages/snapshot-airdrop` – snapshot SPL holders and export for airdrops
- `api-server/` – Express API that wraps the tools for use in Web2 frontends
- `docs/` – static Web2 dashboard (HTML) that calls the `api-server` endpoints

Each package has its own `README.md` with more detailed usage, flags and examples.  
This root README is meant as the **high-level overview** + quickstart.

---

## Tech stack

- **Language:** TypeScript
- **Runtime:** Node.js (tested with Node 18/20)
- **Solana:**
  - Primarily using [`@solana/web3.js`](https://github.com/solana-labs/solana-web3.js)
  - Some tools are being migrated to **Solana Kit** (new v2-style APIs)
- **Scripts & bundling:**
  - [`tsx`](https://github.com/esbuild-kit/tsx) for TypeScript execution
  - `npm workspaces` for managing multiple packages
- **On-chain data sources:**
  - RPC (Helius or public RPC)
  - DexScreener public API for DEX metrics

---

## Prerequisites

- **Node.js** 18 or 20 (LTS)  
- **npm** 10+ (your system is already on this)

Optional but recommended:

- A **Helius API key** (for better RPC performance & rate limits)

---

## Installation

Clone the repo and install dependencies once:

```bash
git clone https://github.com/smitskecbs/solana-tools.git
cd solana-tools
npm install

Environment configuration

You can use the tools out-of-the-box with the default Solana RPC,
but for better stability (especially with large tokens like JUP) it’s recommended to set:

Create a .env file in the repo root:

HELIUS_API_KEY=your_helius_key_here
# Optional: override full RPC URL if you want:
# RPC_URL=https://mainnet.helius-rpc.com/?api-key=your_helius_key_here

The code will:

Prefer RPC_URL if set

Otherwise build an RPC URL from HELIUS_API_KEY

Otherwise fall back to https://api.mainnet-beta.solana.com

The same config is used by:

CLI tools under packages/*

The api-server Express backend

General usage pattern

All tools are workspace packages. You run them like this:

npm run <script> -w ./packages/<tool-name> -- [arguments...]

There are generally two script styles:

dev – uses the current web3.js-style TypeScript entry (src/index.ts)

dev:kit – uses the newer Solana Kit-style entry (src/index.kit.ts)
(Kit migration is in progress; some Kit entries may still be experimental.)

If in doubt, use dev (non-kit), unless the package README says otherwise.

Tools overview
1. wallet-info – quick wallet inspection

Show SOL balance, SPL tokens (non-zero), and recent transactions for a wallet.

Example:

npm run dev -w ./packages/wallet-info -- 3g7qECanbhXrX6HGrkqUCCNgzSdtDmjQUidUv7LdgRQH


Output includes:

SOL balance (in SOL + raw lamports)

Non-zero SPL token holdings (mint, amount, decimals)

A small list of recent transactions

Info on whether Helius RPC was used or not

A Kit-based entry (dev:kit) exists but may still be under active development.
Use dev for now if you want the stable behavior.

2. holder-info – SPL holder distribution

Aggregates SPL token accounts by owner and computes holder concentration.

Typical usage:

npm run dev -w ./packages/holder-info -- --mint <MINT_ADDRESS>


Optional flags (depending on CLI parsing implementation):

--min <amount> – minimum token amount (in UI units) to include in the list

--limit <n> – maximum number of top holders to display

Outputs (approximate for very large tokens):

totalHolders – number of unique owners detected

filteredCount – after applying --min, if used

concentration:

top1 – % of supply held by the largest owner

top5 – % of supply held by top 5

top10 – % of supply held by top 10

A table of top holders with:

Owner address

uiAmount

% of total supply

⚠ Note:
For very large / popular tokens (e.g. JUP), holder-info may hit:

RPC timeouts

Rate limits (429 Too Many Requests)

Memory limits on free hosting tiers

In those cases, totalHolders may be incomplete or approximate.
The tool is optimized for small/mid-cap tokens and focused snapshots.

3. cbs-metrics – DEX metrics via DexScreener

Queries DexScreener for all pools of a given SPL token and summarizes DEX liquidity.

Example:

npm run dev -w ./packages/cbs-metrics -- --mint <MINT_ADDRESS>

You’ll get:

Number of DEX pools found

Raydium vs other DEX pools

Approximate Raydium liquidity in USD

Per-pool info (pair, price, liquidity, URL)

Useful for:

Checking if a token is actually live on DEXs

Seeing how much liquidity sits on Raydium

Quickly inspecting CBS Coin or any other SPL token with DexScreener coverage

4. snapshot-airdrop – export holders for airdrops

This tool takes an SPL token, walks token accounts, and exports holder data for use in airdrops.

Basic usage:

npm run dev:kit -w ./packages/snapshot-airdrop

With options:

npm run dev:kit -w ./packages/snapshot-airdrop -- \
  --mint B9z8cEWFmc7LvQtjKsaLoKqW5MJmGRCWqs1DPKupCfkk \
  --min 1 \
  --exclude wallet1,wallet2 \
  --out snapshots

Where:

--mint – SPL token mint to snapshot

--min – minimum token amount to include

--exclude – comma-separated list of wallets to ignore (team, burn, etc.)

--out – output folder for CSV/JSON files

Outputs typically include:

A CSV/JSON of holders and their balances

Data ready to be used for custom airdrop scripts or on-chain distributions

API server & Web2 dashboard (optional)

The same logic powering the CLI can also be exposed via HTTP:

api-server/ contains an Express app that exposes endpoints like:

GET /api/wallet-info?address=...

GET /api/token-info?mint=...

GET /api/cbs-metrics?mint=...

GET /api/holder-info?mint=...

GET /api/token-safety-check?mint=...

GET /api/whale-tracker?mint=...&minPct=1&limit=20

docs/ contains a static HTML dashboard that can call these endpoints from the browser.

This is what powers the public Solana Tools Web2 dashboard that Kevin uses as a “builder CV”.

If you’re just here for the CLI tools, you don’t need to run the API server.

Limitations & notes

RPC limits: free/public RPC endpoints can rate-limit or time out, especially on:

Huge token mints with many accounts (JUP, USDC, etc.)

Rapid repeated queries (e.g. refreshing holder data too often)

Totals for very large tokens:
totalHolders and similar aggregates are best-effort and may undercount when the RPC truncates results or refuses large scans.

Heuristic tools only:
Anything like “safety checks” is purely heuristic and not financial advice.

Contributing / feedback

This repo is actively evolving while Kevin learns and builds in public.

If you:

Spot a bug

Have ideas for new tools

Want a feature around CBS Coin or general Solana analytics

Feel free to open an issue or reach out on:

X: @smitske180

Telegram: @smitske

License

This repo is intended as open, community-friendly tooling.
If no explicit license file is present yet, treat it as source available for learning and non-malicious use.
A proper license may be added later as the project matures.


::contentReference[oaicite:0]{index=0}








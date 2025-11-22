# Token Info Fetcher

Fetches basic SPL token information from Solana:
- name + symbol (Metaplex metadata)
- decimals
- total supply
- optional price via Jupiter

## Install
Run this command in your terminal (inside this folder):

```bash
npm install
node index.js <MINT_ADDRESS>
node index.js B9z8cEWFmc7LvQtjKsaLoKqW5MJmGRCWqs1DPKupCfkk
Notes

Do not paste these commands into this file.

They are meant to be run in your terminal.

Uses Solana mainnet by default.

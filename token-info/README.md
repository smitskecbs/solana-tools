# Token Info Fetcher

Fetches basic SPL token information from Solana:
- name + symbol (Metaplex metadata)
- decimals
- total supply
- optional price via Jupiter

## Install

Run this command in your terminal (inside this folder):

npm install

## Run

Run this command in your terminal to fetch info for any token mint:

node index.js <MINT_ADDRESS>

### Example (CBS mint)

node index.js B9z8cEWFmc7LvQtjKsaLoKqW5MJmGRCWqs1DPKupCfkk

## Notes

- Do NOT paste these commands into this file.
- They are meant to be run in your terminal.
- Uses Solana mainnet by default.

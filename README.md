# solana-tools 🛠️  
A clean, beginner-friendly toolbox of Solana CLI utilities — built in TypeScript, fully workspace-based, and supporting both:

- **V1 (legacy)** — using `@solana/web3.js`
- **V2 (modern)** — using `@solana/kit`

Alle tools hebben een **dev** en **dev:kit** versie.  
Alles werkt op mainnet en gebruikt optioneel je `.env` voor RPC en Helius.

---

## 📦 Inhoud van deze toolkit

### 1) `holder-info`
Analyseer SPL token holders:
- top 50 holders
- totale non-zero holders
- tokenAccounts + amounts
- werkt perfect voor CBS Coin

**Run:**
```bash
npm run dev     -w ./packages/holder-info -- <MINT>
npm run dev:kit -w ./packages/holder-info -- <MINT>

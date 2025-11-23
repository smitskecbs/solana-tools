import "dotenv/config";
import {
  createSolanaRpc,
  address,
  type Address
} from "@solana/kit";

/**
 * CONFIG
 * Zet RPC_URL in je .env (bijv Helius / QuickNode / Triton / mainnet-beta)
 * Voorbeeld:
 * RPC_URL=https://mainnet.helius-rpc.com/?api-key=XXXX
 */
const RPC_URL = process.env.RPC_URL ?? "https://api.mainnet-beta.solana.com";

// jouw CBS mint als default (je kan dit later CLI-arg maken)
const DEFAULT_MINT =
  "B9z8cEWFmc7LvQtjKsaLoKqW5MJmGRCWqs1DPKupCfkk";

type HolderRow = {
  owner: string;
  tokenAccount: string;
  amount: bigint;
};

async function main() {
  const mintArg = process.argv[2];
  const mint = address(mintArg ?? DEFAULT_MINT) as Address;

  const rpc = createSolanaRpc(RPC_URL);

  console.log("Fetching token accounts for mint:", mint);

  // 1) pak alle token accounts van deze mint via Token Program
  const resp = await rpc.getProgramAccounts(
    address("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
    {
      encoding: "base64",
      filters: [
        { dataSize: 165 }, // SPL token account size
        {
          memcmp: {
            offset: 0, // mint staat op offset 0 in token account
            bytes: mint
          }
        }
      ]
    }
  );

  const accounts = resp.value;
  console.log("Accounts found:", accounts.length);

  // 2) decode minimalistisch: owner + amount
  // token account layout:
  // mint (32) | owner (32) | amount (8 LE)
  const holders: HolderRow[] = accounts.map((a) => {
    const dataBase64 = a.account.data[0];
    const data = Buffer.from(dataBase64, "base64");

    const owner = data.subarray(32, 64);
    const amountLE = data.subarray(64, 72);

    const ownerStr = address(owner) as string;
    const amount = amountLE.readBigUInt64LE(0);

    return {
      owner: ownerStr,
      tokenAccount: a.pubkey,
      amount
    };
  });

  // 3) filter lege accounts, sorteer desc
  const nonZero = holders.filter((h) => h.amount > 0n);
  nonZero.sort((a, b) => (a.amount > b.amount ? -1 : 1));

  // 4) print top 50
  console.log("\nTop holders:");
  nonZero.slice(0, 50).forEach((h, i) => {
    console.log(
      `${i + 1}. owner=${h.owner} amount=${h.amount.toString()} tokenAcc=${h.tokenAccount}`
    );
  });

  console.log(`\nNon-zero holders: ${nonZero.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

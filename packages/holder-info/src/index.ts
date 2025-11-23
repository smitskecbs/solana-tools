import "dotenv/config";
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";

const RPC_URL = process.env.RPC_URL ?? clusterApiUrl("mainnet-beta");
const DEFAULT_MINT =
  "B9z8cEWFmc7LvQtjKsaLoKqW5MJmGRCWqs1DPKupCfkk";

const TOKEN_PROGRAM_ID = new PublicKey(
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
);

type HolderRow = {
  owner: string;
  tokenAccount: string;
  amount: bigint;
};

function toBuffer(dataField: any): Buffer {
  // web3.js can return:
  // - Buffer
  // - [base64String, "base64"]
  // - Uint8Array / number[]
  if (Buffer.isBuffer(dataField)) return dataField;

  if (Array.isArray(dataField) && typeof dataField[0] === "string") {
    return Buffer.from(dataField[0], "base64");
  }

  return Buffer.from(dataField); // Uint8Array / number[]
}

async function main() {
  const mintArg = process.argv[2];
  const mint = new PublicKey(mintArg ?? DEFAULT_MINT);

  const connection = new Connection(RPC_URL, "confirmed");

  console.log("RPC:", RPC_URL);
  console.log("Fetching token accounts for mint:", mint.toBase58());

  const accounts = await connection.getProgramAccounts(TOKEN_PROGRAM_ID, {
    // encoding mag, maar we maken decode robuust dus maakt niet meer uit
    encoding: "base64",
    filters: [
      { dataSize: 165 },
      {
        memcmp: {
          offset: 0,
          bytes: mint.toBase58(),
        },
      },
    ],
  });

  console.log("Accounts found:", accounts.length);

  const holders: HolderRow[] = accounts.map((a: any) => {
    const data = toBuffer(a.account.data);

    // SPL token account layout:
    // mint (32) | owner (32) | amount (8 LE)
    const ownerBytes = data.subarray(32, 64);
    const amountLE = data.subarray(64, 72);

    const owner = new PublicKey(ownerBytes).toBase58();
    const amount = amountLE.readBigUInt64LE(0);

    return {
      owner,
      tokenAccount: a.pubkey.toBase58(),
      amount,
    };
  });

  const nonZero = holders.filter((h) => h.amount > 0n);
  nonZero.sort((x, y) => (x.amount > y.amount ? -1 : 1));

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

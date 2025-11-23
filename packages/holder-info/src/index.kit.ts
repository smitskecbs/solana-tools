import "dotenv/config";
import { createSolanaRpc, address, type Address } from "@solana/kit";
import { PublicKey } from "@solana/web3.js";

const RPC_URL = process.env.RPC_URL ?? "https://api.mainnet-beta.solana.com";
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

  console.log("RPC:", RPC_URL);
  console.log("Fetching token accounts for mint:", mint);

  // Kit filter types are branded; runtime is fine, DTS is strict -> cast filters to any.
  const filters: any = [
    { dataSize: 165n },
    {
      memcmp: {
        offset: 0n,
        bytes: mint
      }
    }
  ];

  // In Kit typings, getProgramAccounts().send() returns the array directly (not { value })
  const accounts = (await rpc
    .getProgramAccounts(
      address("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA") as Address,
      {
        encoding: "base64",
        filters
      }
    )
    .send()) as any[];

  console.log("Accounts found:", accounts.length);

  const holders: HolderRow[] = accounts.map((a: any) => {
    const dataBase64 = a.account.data[0] as string;
    const data = Buffer.from(dataBase64, "base64");

    const ownerBytes = data.subarray(32, 64);
    const amountLE = data.subarray(64, 72);

    return {
      owner: new PublicKey(ownerBytes).toBase58(),
      tokenAccount: a.pubkey as string,
      amount: amountLE.readBigUInt64LE(0)
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

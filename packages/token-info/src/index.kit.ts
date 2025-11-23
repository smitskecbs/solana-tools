import "dotenv/config";
import {
  createSolanaRpc,
  address,
  type Address
} from "@solana/kit";
import { PublicKey } from "@solana/web3.js";

const RPC_URL = process.env.RPC_URL ?? "https://api.mainnet-beta.solana.com";

const DEFAULT_MINT = "B9z8cEWFmc7LvQtjKsaLoKqW5MJmGRCWqs1DPKupCfkk";

async function main() {
  const mintArg = process.argv[2];
  const mint = address(mintArg ?? DEFAULT_MINT) as Address;

  const rpc = createSolanaRpc(RPC_URL);

  console.log("RPC:", RPC_URL);
  console.log("Fetching token info for:", mint);

  // -------------------------------------------------------
  // 1. Get Mint Account
  // -------------------------------------------------------
  const mintAcc = await rpc.getAccountInfo(mint, { encoding: "base64" }).send();

  if (!mintAcc.value) {
    console.error("Mint not found!");
    return;
  }

  const dataBase64 = mintAcc.value.data[0] as string;
  const data = Buffer.from(dataBase64, "base64");

  const supplyLE = data.subarray(36, 44);
  const decimals = data[44];
  const isInitialized = data[45] === 1;
  const mintAuthorityBytes = data.subarray(0, 32);
  const freezeAuthorityBytes = data.subarray(32, 64);

  const mintAuthority =
    Buffer.compare(mintAuthorityBytes, Buffer.alloc(32)) === 0
      ? null
      : new PublicKey(mintAuthorityBytes).toBase58();

  const freezeAuthority =
    Buffer.compare(freezeAuthorityBytes, Buffer.alloc(32)) === 0
      ? null
      : new PublicKey(freezeAuthorityBytes).toBase58();

  const supply = supplyLE.readBigUInt64LE(0);

  console.log("\n=== Mint Account Info ===");
  console.log("Decimals:", decimals);
  console.log("Supply (raw):", supply.toString());
  console.log("Supply (human):", Number(supply) / 10 ** decimals);
  console.log("Mint authority:", mintAuthority ?? "None");
  console.log("Freeze authority:", freezeAuthority ?? "None");
  console.log("Initialized:", isInitialized);

  // -------------------------------------------------------
  // 2. Token Metadata PDA (Metaplex)
  // -------------------------------------------------------
  const METAPLEX_METADATA_PROGRAM =
    "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s";

  const [metadataPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      new PublicKey(METAPLEX_METADATA_PROGRAM).toBuffer(),
      new PublicKey(mint).toBuffer(),
    ],
    new PublicKey(METAPLEX_METADATA_PROGRAM)
  );

  console.log("\nMetadata PDA:", metadataPda.toBase58());

  const metaAcc = await rpc
    .getAccountInfo(address(metadataPda.toBase58()), { encoding: "base64" })
    .send();

  if (!metaAcc.value) {
    console.log("No metadata account found.");
    return;
  }

  const metaDataRaw = Buffer.from(metaAcc.value.data[0], "base64");

  // Metadata is Borsh encoded — we extract the URI using offset scanning
  const uri = extractMetadataUri(metaDataRaw);

  console.log("\n=== Metadata ===");
  console.log("URI:", uri ?? "Not Found");
}

function extractMetadataUri(buf: Buffer): string | null {
  const text = buf.toString("utf8");
  const match = text.match(/https?:\/\/[^\s"]+/);
  return match ? match[0] : null;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

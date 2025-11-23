import "dotenv/config";
import { createSolanaRpc, address, type Address } from "@solana/kit";
import { PublicKey } from "@solana/web3.js";

const RPC_URL = process.env.RPC_URL ?? "https://api.mainnet-beta.solana.com";
const DEFAULT_MINT = "B9z8cEWFmc7LvQtjKsaLoKqW5MJmGRCWqs1DPKupCfkk";

function readBorshString(buf: Buffer, offset: number) {
  const len = buf.readUInt32LE(offset);
  const start = offset + 4;
  const end = start + len;
  const value = buf.subarray(start, end).toString("utf8");
  return { value, offset: end };
}

function parseMintAuthorities(mintData: Buffer) {
  const mintAuthorityOption = mintData.readUInt32LE(0);
  const mintAuthorityBytes = mintData.subarray(4, 36);

  const freezeAuthorityOption = mintData.readUInt32LE(46);
  const freezeAuthorityBytes = mintData.subarray(50, 82);

  const mintAuthority =
    mintAuthorityOption === 0
      ? null
      : new PublicKey(mintAuthorityBytes).toBase58();

  const freezeAuthority =
    freezeAuthorityOption === 0
      ? null
      : new PublicKey(freezeAuthorityBytes).toBase58();

  return { mintAuthority, freezeAuthority };
}

async function main() {
  const mintArg = process.argv[2];
  const mint = address(mintArg ?? DEFAULT_MINT) as Address;
  const rpc = createSolanaRpc(RPC_URL);

  console.log("RPC:", RPC_URL);
  console.log("Fetching token info for:", mint);

  // -------------------------------------------------------
  // 1) Mint account (correct SPL Mint layout)
  // -------------------------------------------------------
  const mintAcc = await rpc.getAccountInfo(mint, { encoding: "base64" }).send();
  if (!mintAcc.value) {
    console.error("Mint not found!");
    return;
  }

  const mintDataBase64 = mintAcc.value.data[0] as string;
  const mintData = Buffer.from(mintDataBase64, "base64");

  const supplyLE = mintData.subarray(36, 44);
  const decimals = mintData[44];
  const isInitialized = mintData[45] === 1;

  const supply = supplyLE.readBigUInt64LE(0);
  const { mintAuthority, freezeAuthority } = parseMintAuthorities(mintData);

  console.log("\n=== Mint Account Info ===");
  console.log("Decimals:", decimals);
  console.log("Supply (raw):", supply.toString());
  console.log("Supply (human):", Number(supply) / 10 ** decimals);
  console.log("Mint authority:", mintAuthority ?? "None");
  console.log("Freeze authority:", freezeAuthority ?? "None");
  console.log("Initialized:", isInitialized);

  // -------------------------------------------------------
  // 2) Metaplex Metadata account (manual Borsh decode)
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

  const metaBase64 = metaAcc.value.data[0] as string;
  const metaBytes = Buffer.from(metaBase64, "base64");

  const updateAuthority = new PublicKey(metaBytes.subarray(1, 33)).toBase58();

  let off = 65;
  const nameRes = readBorshString(metaBytes, off); off = nameRes.offset;
  const symbolRes = readBorshString(metaBytes, off); off = symbolRes.offset;
  const uriRes = readBorshString(metaBytes, off); off = uriRes.offset;

  console.log("\n=== Metadata ===");
  console.log("Name:", nameRes.value.replace(/\0/g, "").trim());
  console.log("Symbol:", symbolRes.value.replace(/\0/g, "").trim());
  console.log("URI:", uriRes.value.replace(/\0/g, "").trim());
  console.log("Update authority:", updateAuthority);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

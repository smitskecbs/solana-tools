import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { Metadata, PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata";

// helper: zet raw supply om naar normale units
function uiAmount(raw, decimals) {
  return Number(raw) / Math.pow(10, decimals);
}

async function main() {
  const mintStr = process.argv[2];
  if (!mintStr) {
    console.log("Usage: node index.js <MINT_ADDRESS>");
    process.exit(1);
  }

  const mint = new PublicKey(mintStr);

  // connect to Solana mainnet
  const rpcUrl = process.env.RPC_URL || clusterApiUrl("mainnet-beta");
  const connection = new Connection(rpcUrl, "confirmed");

  console.log("\n🔎 Fetching token info for mint:");
  console.log(mint.toBase58(), "\n");

  // 1) supply + decimals
  const supplyInfo = await connection.getTokenSupply(mint);
  const decimals = supplyInfo.value.decimals;
  const rawSupply = supplyInfo.value.amount; // big number string
  const totalSupplyUi = uiAmount(rawSupply, decimals);

  // 2) Metaplex metadata PDA vinden
  const [metadataPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      mint.toBuffer()
    ],
    TOKEN_METADATA_PROGRAM_ID
  );

  let name = "Unknown";
  let symbol = "Unknown";

  // 3) metadata lezen (name/symbol)
  const metadataAccount = await connection.getAccountInfo(metadataPda);
  if (metadataAccount?.data) {
    const [metadata] = Metadata.deserialize(metadataAccount.data);
    name = metadata.data.name.trim();
    symbol = metadata.data.symbol.trim();
  }

  // 4) optioneel prijs via Jupiter
  let price = null;
  try {
    const res = await fetch(`https://price.jup.ag/v6/price?ids=${mint.toBase58()}`);
    const json = await res.json();
    price = json?.data?.[mint.toBase58()]?.price ?? null;
  } catch {}

  // Output
  console.log("✅ Name:       ", name);
  console.log("✅ Symbol:     ", symbol);
  console.log("✅ Decimals:   ", decimals);
  console.log("✅ TotalSupply:", totalSupplyUi.toLocaleString());

  if (price !== null) {
    console.log("✅ Price (JUP):", `$${price}`);
  } else {
    console.log("ℹ️ Price:      ", "not available (Jupiter endpoint optional)");
  }

  console.log("\nDone.\n");
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});

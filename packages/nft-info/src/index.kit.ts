import "dotenv/config";
import { createSolanaRpc, address, type Address } from "@solana/kit";

const HELIUS_KEY = process.env.HELIUS_API_KEY ?? null;
if (!HELIUS_KEY) {
  console.log("❌ No Helius key found. Add HELIUS_API_KEY= to your .env");
  process.exit(1);
}

const RPC_URL =
  process.env.RPC_URL ??
  `https://mainnet.helius-rpc.com/?api-key=${HELIUS_KEY}`;

const DEFAULT_ASSET =
  "B9z8cEWFmc7LvQtjKsaLoKqW5MJmGRCWqs1DPKupCfkk";

async function main() {
  const arg = process.argv[2];
  const assetId = address(arg ?? DEFAULT_ASSET) as Address;

  console.log("\n🖼️  Fetching Solana asset info for:");
  console.log(assetId, "\n");

  // Helius DAS v1 endpoint
  const url = `https://api.helius.xyz/v0/assets/${assetId}?api-key=${HELIUS_KEY}`;

  let json;
  try {
    const res = await fetch(url);
    json = await res.json();
  } catch (e) {
    console.log("❌ Fetch failed:", e);
    process.exit(1);
  }

  if (!json || json.error) {
    console.log("❌ Asset not found or invalid response.");
    process.exit(1);
  }

  const asset = json;

  // ----------------------------------
  // BASIC INFO
  // ----------------------------------
  const name = asset.content?.metadata?.name ?? "(unknown)";
  const symbol = asset.content?.metadata?.symbol ?? "(unknown)";
  const desc = asset.content?.metadata?.description ?? "(none)";
  const uri = asset.content?.json_uri ?? null;

  const image =
    asset.content?.files?.find((f: any) => f.mime === "image/png")?.uri ??
    asset.content?.files?.find((f: any) => f.mime?.startsWith("image/"))
      ?.uri ??
    asset.content?.links?.image ??
    null;

  console.log(`✅ Name:         ${name}`);
  console.log(`✅ Symbol:       ${symbol}`);
  console.log(`✅ Description:  ${desc}\n`);
  console.log(`🏷️  Asset ID:     ${asset.id}`);
  console.log(`🏷️  Interface:    ${asset.interface ?? "Unknown"}`);
  console.log(
    `🏷️  Compressed:   ${asset.compression?.compressed ? "Yes" : "No"}`
  );
  console.log(
    `🏷️  Owner:        ${asset.ownership?.owner ?? "Unknown"}`
  );

  const royaltyPct = asset.royalty?.bps
    ? (asset.royalty.bps / 100).toFixed(2)
    : "0.00";

  console.log(`🏷️  Royalty:      ${royaltyPct}%`);
  console.log(`🏷️  JSON URI:     ${uri ?? "(none)"}`);
  console.log(`🏷️  Image:        ${image ?? "(no image found)"}`);

  // ----------------------------------
  // Creators
  // ----------------------------------
  console.log("\n👥 Creators:");
  const creators = asset.creators ?? [];
  if (creators.length === 0) {
    console.log("  (none)");
  } else {
    creators.forEach((c: any) =>
      console.log(
        `  • ${c.address} — share ${c.share ?? 0}% — ${
          c.verified ? "verified" : "unverified"
        }`
      )
    );
  }

  // ----------------------------------
  // Authorities
  // ----------------------------------
  console.log("\n🛡️  Authorities:");
  const auth = asset.authorities ?? [];
  if (auth.length === 0) {
    console.log("  (none)");
  } else {
    auth.forEach((a: any) =>
      console.log(`  • ${a.address} — scopes: ${a.scopes.join(", ")}`)
    );
  }

  console.log("\nDone.\n");
}

main();

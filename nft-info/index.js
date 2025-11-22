#!/usr/bin/env node
import { PublicKey } from "@solana/web3.js";

async function safeJsonFetch(url, opts = {}) {
  try {
    const res = await fetch(url, opts);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function pickCollection(grouping = []) {
  if (!Array.isArray(grouping)) return null;
  const col = grouping.find(g => g?.group_key === "collection");
  return col?.group_value || null;
}

function fmtCreators(creators = []) {
  if (!Array.isArray(creators) || creators.length === 0) return [];
  return creators.map(c => ({
    address: c.address,
    share: c.share,
    verified: !!c.verified
  }));
}

async function fetchOffchainJson(jsonUri) {
  if (!jsonUri) return null;
  return await safeJsonFetch(jsonUri);
}

async function getAssetDAS(assetId, heliusKey) {
  const url = `https://mainnet.helius-rpc.com/?api-key=${heliusKey}`;
  const body = {
    jsonrpc: "2.0",
    id: "nft-info",
    method: "getAsset",
    params: { id: assetId }
  };

  return await safeJsonFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}

async function main() {
  const idArg = process.argv[2];
  const rawFlag = process.argv.includes("--raw");

  if (!idArg) {
    console.log("Usage: node index.js <NFT_MINT_OR_ASSET_ID> [--raw]");
    process.exit(1);
  }

  // validate base58-ish (mint or asset id). If it parses to PublicKey, fine.
  try { new PublicKey(idArg); } catch {}

  const HELIUS_API_KEY = process.env.HELIUS_API_KEY;
  if (!HELIUS_API_KEY) {
    console.log("\n❌ HELIUS_API_KEY is missing.");
    console.log("Set it like this (only for your current terminal):\n");
    console.log('export HELIUS_API_KEY="YOUR_KEY_HERE"\n');
    console.log("Then run again.\n");
    process.exit(1);
  }

  console.log(`\n🖼️  Fetching Solana asset info for:\n${idArg}\n`);

  const das = await getAssetDAS(idArg, HELIUS_API_KEY);

  if (!das?.result) {
    console.log("❌ No DAS result returned. Check your key or asset id.\n");
    process.exit(1);
  }

  if (rawFlag) {
    console.log(JSON.stringify(das.result, null, 2));
    return;
  }

  const a = das.result;

  const name =
    a?.content?.metadata?.name ||
    a?.content?.json?.name ||
    "Unknown";

  const symbol =
    a?.content?.metadata?.symbol ||
    a?.content?.json?.symbol ||
    "Unknown";

  const description =
    a?.content?.metadata?.description ||
    a?.content?.json?.description ||
    "";

  const jsonUri = a?.content?.json_uri || null;

  const files = a?.content?.files || [];
  const image =
    files.find(f => (f?.mime || "").startsWith("image/"))?.uri ||
    a?.content?.links?.image ||
    a?.content?.json?.image ||
    null;

  const attributes =
    a?.content?.metadata?.attributes ||
    a?.content?.json?.attributes ||
    null;

  const offchain = await fetchOffchainJson(jsonUri);
  const offAttrs = offchain?.attributes || null;

  const compression = a?.compression || {};
  const isCompressed = !!compression.compressed;

  const owner = a?.ownership?.owner || "Unknown";
  const delegate = a?.ownership?.delegate || null;

  const royaltyBp = a?.royalty?.basis_points;
  const royaltyPct = typeof royaltyBp === "number" ? (royaltyBp / 100).toFixed(2) + "%" : "Unknown";

  const collection = pickCollection(a?.grouping);
  const creators = fmtCreators(a?.creators);

  const authorities = Array.isArray(a?.authorities) ? a.authorities : [];

  console.log("✅ Name:        ", name);
  console.log("✅ Symbol:      ", symbol);
  if (description) console.log("✅ Description: ", description);

  console.log("✅ Asset ID:    ", a?.id || idArg);
  if (a?.interface) console.log("✅ Interface:   ", a.interface);

  console.log("✅ Compressed:  ", isCompressed ? "Yes (cNFT)" : "No (standard NFT)");
  if (isCompressed) {
    console.log("   Tree:        ", compression.tree || "Unknown");
    console.log("   Leaf ID:     ", compression.leaf_id ?? "Unknown");
    console.log("   Data Hash:   ", compression.data_hash || "Unknown");
    console.log("   Creator Hash:", compression.creator_hash || "Unknown");
  }

  console.log("✅ Owner:       ", owner);
  if (delegate) console.log("✅ Delegate:    ", delegate);

  console.log("✅ Royalty:     ", royaltyPct);

  if (collection) console.log("✅ Collection:  ", collection);

  if (jsonUri) console.log("✅ JSON URI:    ", jsonUri);
  if (image) console.log("✅ Image:       ", image);

  const attrsToShow = attributes || offAttrs;
  if (Array.isArray(attrsToShow) && attrsToShow.length) {
    console.log("\n🎛️  Attributes:");
    for (const at of attrsToShow) {
      console.log(`  • ${at.trait_type ?? at.traitType ?? "trait"}: ${at.value}`);
    }
  }

  if (creators.length) {
    console.log("\n👥 Creators:");
    creators.forEach(c =>
      console.log(`  • ${c.address} — share ${c.share}% — ${c.verified ? "verified" : "unverified"}`)
    );
  }

  if (authorities.length) {
    console.log("\n🛡️  Authorities:");
    authorities.forEach(x =>
      console.log(`  • ${x.address} — scopes: ${(x.scopes || []).join(", ") || "unknown"}`)
    );
  }

  console.log("\nDone.\n");
}

main().catch((e) => {
  console.error("Error:", e);
  process.exit(1);
});

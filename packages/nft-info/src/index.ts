import "dotenv/config";
import { clusterApiUrl } from "@solana/web3.js";

// ---------------------------
// tiny helpers (typed)
// ---------------------------
async function safeFetch<T = any>(url: string, opts: RequestInit = {}): Promise<T | null> {
  try {
    const res = await fetch(url, opts);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

type DasCreator = {
  address: string;
  share: number;
  verified: boolean;
};

type DasAuthority = {
  address: string;
  scopes: string[];
};

type DasGrouping = {
  group_key: string;
  group_value: string;
};

type DasAsset = {
  id: string;
  interface?: string;
  compressed?: boolean;
  compression?: { compressed?: boolean };
  ownership?: { owner?: string | null };
  royalty?: { basis_points?: number | null };
  content?: {
    json_uri?: string | null;
    files?: { uri: string; mime?: string | null }[] | null;
    metadata?: {
      name?: string | null;
      symbol?: string | null;
      description?: string | null;
      token_standard?: string | null;
    } | null;
  } | null;
  creators?: DasCreator[] | null;
  authorities?: DasAuthority[] | null;
  grouping?: DasGrouping[] | null;
};

type DasRpcResponse = {
  jsonrpc: string;
  id: string;
  result?: DasAsset;
  error?: { message?: string };
};

// ---------------------------
// config
// ---------------------------
const HELIUS_KEY = process.env.HELIUS_API_KEY || process.env.HELIUS_KEY || "";
const RPC_URL =
  process.env.RPC_URL ||
  (HELIUS_KEY
    ? `https://mainnet.helius-rpc.com/?api-key=${HELIUS_KEY}`
    : clusterApiUrl("mainnet-beta"));

const DEFAULT_ASSET =
  process.env.DEFAULT_ASSET ||
  "B9z8cEWFmc7LvQtjKsaLoKqW5MJmGRCWqs1DPKupCfkk";

// ---------------------------
// main
// ---------------------------
async function getAssetDAS(assetId: string): Promise<DasAsset | null> {
  const body = {
    jsonrpc: "2.0",
    id: "das-get-asset",
    method: "getAsset",
    params: { id: assetId }
  };

  const resp = await safeFetch<DasRpcResponse>(RPC_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });

  if (!resp) return null;
  if (resp.error) {
    console.log("DAS error:", resp.error.message || resp.error);
    return null;
  }
  return resp.result ?? null;
}

async function main() {
  const assetId = process.argv[2] || DEFAULT_ASSET;
  if (!assetId) {
    console.log("Usage: tsx src/index.ts <ASSET_ID>");
    process.exit(1);
  }

  console.log("\n🖼️  Fetching Solana asset info for:\n" + assetId + "\n");

  const asset = await getAssetDAS(assetId);
  if (!asset) {
    console.log("❌ No asset data returned. Check RPC_URL / HELIUS key.");
    process.exit(1);
  }

  const md = asset.content?.metadata ?? {};
  const name = md.name ?? "(unknown)";
  const symbol = md.symbol ?? "(unknown)";
  const description = md.description ?? "(none)";
  const jsonUri = asset.content?.json_uri ?? "(none)";
  const files = asset.content?.files ?? [];
  const imageFile = files.find((f) => (f.mime ?? "").startsWith("image/"));
  const imageUri = imageFile?.uri ?? "(none)";

  const isCompressed =
    asset.compression?.compressed ?? asset.compressed ?? false;

  const owner = asset.ownership?.owner ?? "Unknown";
  const royaltyBp = asset.royalty?.basis_points ?? 0;
  const royaltyPct = (royaltyBp / 100).toFixed(2);

  console.log(`✅ Name:         ${name}`);
  console.log(`✅ Symbol:       ${symbol}`);
  console.log(`✅ Description:  ${description}`);
  console.log(`✅ Asset ID:     ${asset.id}`);
  console.log(`✅ Interface:    ${asset.interface ?? "(unknown)"}`);
  console.log(`✅ Compressed:   ${isCompressed ? "Yes" : "No (standard NFT)"}`);
  console.log(`✅ Owner:        ${owner}`);
  console.log(`✅ Royalty:      ${royaltyPct}%`);
  console.log(`✅ JSON URI:     ${jsonUri}`);
  console.log(`✅ Image:        ${imageUri}`);

  const grouping = asset.grouping ?? [];
  if (grouping.length) {
    console.log("\n📌 Grouping:");
    grouping.forEach((g) =>
      console.log(`  • ${g.group_key}: ${g.group_value}`)
    );
  }

  const creators = asset.creators ?? [];
  if (creators.length) {
    console.log("\n👥 Creators:");
    creators.forEach((c) => {
      console.log(
        `  • ${c.address} — share ${c.share}% — ${c.verified ? "verified" : "unverified"}`
      );
    });
  }

  const authorities = asset.authorities ?? [];
  if (authorities.length) {
    console.log("\n🛡️  Authorities:");
    authorities.forEach((a) => {
      console.log(`  • ${a.address} — scopes: ${a.scopes.join(", ")}`);
    });
  }

  console.log("\nDone.\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

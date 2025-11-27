import "dotenv/config";
import { createSolanaRpc, address } from "@solana/kit";
import fs from "fs";
import path from "path";

// ---------- RPC SETUP ----------

const RPC_URL =
  process.env.RPC_URL ||
  process.env.HELIUS_RPC_URL ||
  "https://api.mainnet-beta.solana.com";

const rpc = createSolanaRpc(RPC_URL);

// ---------- TYPES ----------

type WhaleHolder = {
  rank: number;
  address: string;
  uiAmount: number;
  sharePercent: number;
};

export type WhaleSnapshot = {
  mint: string;
  fetchedAt: string; // ISO-string
  totalSupplyUi: number | null;
  decimals: number | null;
  holders: WhaleHolder[];
};

type WhaleDiffStatus = "new" | "gone" | "increased" | "decreased" | "unchanged";

export type WhaleDiffEntry = {
  address: string;
  prevRank: number | null;
  newRank: number | null;
  prevAmount: number | null;
  newAmount: number | null;
  deltaAmount: number;
  deltaShare: number;
  status: WhaleDiffStatus;
};

export type WhaleDiff = {
  mint: string;
  from: string;
  to: string;
  holders: WhaleDiffEntry[];
};

// ---------- ON-CHAIN FETCH ----------

async function fetchWhaleSnapshot(
  mintStr: string,
  limit = 20
): Promise<WhaleSnapshot> {
  const mintAddr = address(mintStr);

  const [supplyRes, largestRes]: any = await Promise.all([
    rpc.getTokenSupply(mintAddr).send(),
    rpc.getTokenLargestAccounts(mintAddr).send(),
  ]);

  const supplyVal = supplyRes?.value;
  const totalUi: number | null =
    typeof supplyVal?.uiAmount === "number"
      ? supplyVal.uiAmount
      : supplyVal?.uiAmountString
      ? parseFloat(supplyVal.uiAmountString)
      : null;

  const decimals: number | null = supplyVal?.decimals ?? null;

  const accounts: any[] = largestRes?.value ?? [];

  // Sorteer grootste eerst en limiteer
  const sorted = accounts
    .map((acc) => {
      const rawUi =
        typeof acc.uiAmount === "number"
          ? acc.uiAmount
          : acc.uiAmountString
          ? parseFloat(acc.uiAmountString)
          : 0;

      const share =
        totalUi && totalUi > 0 ? (rawUi / totalUi) * 100 : 0;

      return {
        address: acc.address as string,
        uiAmount: rawUi,
        sharePercent: share,
      };
    })
    .sort((a, b) => b.uiAmount - a.uiAmount)
    .slice(0, Math.max(1, Math.min(limit, accounts.length || limit)));

  const holders: WhaleHolder[] = sorted.map((h, idx) => ({
    rank: idx + 1,
    ...h,
  }));

  return {
    mint: mintStr,
    fetchedAt: new Date().toISOString(),
    totalSupplyUi: totalUi,
    decimals,
    holders,
  };
}

// ---------- DIFF LOGICA ----------

function diffSnapshots(prev: WhaleSnapshot, curr: WhaleSnapshot): WhaleDiff {
  const prevMap = new Map<string, WhaleHolder>();
  const currMap = new Map<string, WhaleHolder>();

  prev.holders.forEach((h) => prevMap.set(h.address, h));
  curr.holders.forEach((h) => currMap.set(h.address, h));

  const allAddresses = new Set<string>([
    ...prevMap.keys(),
    ...currMap.keys(),
  ]);

  const entries: WhaleDiffEntry[] = [];

  for (const addr of allAddresses) {
    const prevH = prevMap.get(addr) || null;
    const currH = currMap.get(addr) || null;

    const prevAmount = prevH?.uiAmount ?? null;
    const newAmount = currH?.uiAmount ?? null;
    const prevShare = prevH?.sharePercent ?? 0;
    const newShare = currH?.sharePercent ?? 0;

    let status: WhaleDiffStatus;

    if (!prevH && currH) {
      status = "new";
    } else if (prevH && !currH) {
      status = "gone";
    } else if (prevH && currH) {
      // Beide bestaan: we vergelijken amounts, maar vangen null af
      const pa = prevAmount ?? 0;
      const na = newAmount ?? 0;

      if (Math.abs(na - pa) < 1e-9) {
        status = "unchanged";
      } else if (na > pa) {
        status = "increased";
      } else {
        status = "decreased";
      }
    } else {
      // zou praktisch niet moeten gebeuren
      status = "unchanged";
    }

    entries.push({
      address: addr,
      prevRank: prevH?.rank ?? null,
      newRank: currH?.rank ?? null,
      prevAmount,
      newAmount,
      deltaAmount: (newAmount ?? 0) - (prevAmount ?? 0),
      deltaShare: newShare - prevShare,
      status,
    });
  }

  // Sort: nieuwe snapshot rank eerst, dan grootste absolute delta
  entries.sort((a, b) => {
    const rankA = a.newRank ?? 9999;
    const rankB = b.newRank ?? 9999;
    if (rankA !== rankB) return rankA - rankB;
    return Math.abs(b.deltaAmount) - Math.abs(a.deltaAmount);
  });

  return {
    mint: curr.mint,
    from: prev.fetchedAt,
    to: curr.fetchedAt,
    holders: entries,
  };
}

// ---------- CLI TABEL WEERGAVE ----------

function shorten(addr: string, len = 4): string {
  if (addr.length <= len * 2 + 3) return addr;
  return addr.slice(0, len) + "..." + addr.slice(-len);
}

function formatNumber(x: number | null, digits = 2): string {
  if (x == null || Number.isNaN(x)) return "-";
  return x.toLocaleString(undefined, {
    maximumFractionDigits: digits,
  });
}

function sign(x: number): string {
  if (x > 0) return "+" + formatNumber(x);
  if (x < 0) return formatNumber(x);
  return "0";
}

function colorStatus(status: WhaleDiffStatus): string {
  switch (status) {
    case "new":
      return "NEW";
    case "gone":
      return "GONE";
    case "increased":
      return "UP";
    case "decreased":
      return "DOWN";
    case "unchanged":
    default:
      return "FLAT";
  }
}

function printSnapshot(snapshot: WhaleSnapshot) {
  console.log("");
  console.log(
    `== Whale snapshot for ${snapshot.mint} @ ${snapshot.fetchedAt} ==`
  );
  console.log(
    `Total supply (UI): ${
      snapshot.totalSupplyUi != null
        ? formatNumber(snapshot.totalSupplyUi, 4)
        : "unknown"
    }`
  );
  console.log("");

  const header = "RANK  ADDRESS                 AMOUNT          SHARE%";
  console.log(header);
  console.log("-".repeat(header.length));

  snapshot.holders.forEach((h) => {
    const rank = String(h.rank).padStart(2, " ");
    const addr = shorten(h.address, 4).padEnd(22, " ");
    const amt = formatNumber(h.uiAmount, 4).padStart(13, " ");
    const share = (h.sharePercent ?? 0).toLocaleString(undefined, {
      maximumFractionDigits: 2,
    });
    const shareStr = share.padStart(7, " ") + "%";
    console.log(`${rank}.  ${addr}  ${amt}   ${shareStr}`);
  });

  console.log("");
}

function printDiff(diff: WhaleDiff) {
  console.log("");
  console.log(
    `== Whale movement for ${diff.mint} (${diff.from} -> ${diff.to}) ==`
  );
  console.log(
    "Union of top holders from previous + current snapshot (by address)."
  );
  console.log("");

  const header =
    "ADDR                  STATUS   RANK(prev→now)     ΔAMOUNT        ΔSHARE%";
  console.log(header);
  console.log("-".repeat(header.length));

  diff.holders.forEach((h) => {
    const addr = shorten(h.address, 4).padEnd(22, " ");
    const status = colorStatus(h.status).padEnd(7, " ");
    const prevRank =
      h.prevRank != null ? String(h.prevRank).padStart(2, " ") : "--";
    const newRank =
      h.newRank != null ? String(h.newRank).padStart(2, " ") : "--";
    const rankStr = `${prevRank}→${newRank}`.padEnd(11, " ");
    const dAmt = sign(h.deltaAmount).padStart(13, " ");
    const dShare = sign(h.deltaShare).padStart(9, " ") + "%";

    console.log(`${addr}  ${status}  ${rankStr}   ${dAmt}   ${dShare}`);
  });

  console.log("");
}

// ---------- CLI PARSER ----------

type CliOptions = {
  mint: string;
  limit: number;
  out?: string;
  prev?: string;
};

function parseArgs(argv: string[]): CliOptions {
  let mint: string | undefined;
  let limit = 20;
  let out: string | undefined;
  let prev: string | undefined;

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--mint") {
      mint = argv[++i];
    } else if (arg === "--limit") {
      limit = Number(argv[++i] || NaN);
    } else if (arg === "--out") {
      out = argv[++i];
    } else if (arg === "--prev") {
      prev = argv[++i];
    } else if (!mint) {
      // allow simple: ts-node index.ts <mint>
      mint = arg;
    } else {
      console.warn("Unknown argument:", arg);
    }
  }

  if (!mint) {
    console.error(
      "Usage: ts-node src/index.ts --mint <MINT> [--limit 20] [--out file.json] [--prev prevSnapshot.json]"
    );
    process.exit(1);
  }

  if (!Number.isFinite(limit) || limit <= 0) limit = 20;

  return { mint, limit, out, prev };
}

// ---------- PUBLIC API ----------

export async function scanWhales(
  mint: string,
  limit = 20
): Promise<WhaleSnapshot> {
  return fetchWhaleSnapshot(mint, limit);
}

export { diffSnapshots };

// ---------- MAIN ----------

async function main() {
  const { mint, limit, out, prev } = parseArgs(process.argv);

  console.log("RPC URL:", RPC_URL);
  console.log("Mint:", mint);
  console.log("Limit:", limit);
  console.log("");

  let prevSnapshot: WhaleSnapshot | null = null;
  if (prev) {
    try {
      const prevRaw = fs.readFileSync(prev, "utf8");
      prevSnapshot = JSON.parse(prevRaw) as WhaleSnapshot;
      console.log("Loaded previous snapshot from:", prev);
    } catch (e) {
      console.warn("Could not read previous snapshot:", e);
    }
  }

  const snapshot = await fetchWhaleSnapshot(mint, limit);
  printSnapshot(snapshot);

  let diff: WhaleDiff | null = null;
  if (prevSnapshot) {
    diff = diffSnapshots(prevSnapshot, snapshot);
    printDiff(diff);
  }

  if (out) {
    const dir = path.dirname(out);
    if (dir && dir !== ".") {
      fs.mkdirSync(dir, { recursive: true });
    }

    const payload = diff
      ? { snapshot, diff }
      : { snapshot };

    fs.writeFileSync(out, JSON.stringify(payload, null, 2), "utf8");
    console.log("Saved JSON to:", out);
  }
}

if (require.main === module) {
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  main().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  });
}

/**
 * Seed CoYYns Historical Data
 *
 * Backfills the transaction ledger from the couple's manual records
 * and lets the trigger set correct wallet balances.
 *
 * Usage: node scripts/seed-coyyns-history.mjs
 * Requires: .env.local with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 *
 * Idempotent — checks for existing "Initial balance" transactions before inserting.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Load env vars from .env.local ──────────────────────────────
function loadEnv() {
  const envPath = resolve(__dirname, "../.env.local");
  const content = readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx);
    const value = trimmed.slice(eqIdx + 1);
    process.env[key] = value;
  }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── Transaction ledger ─────────────────────────────────────────
// Dates use noon Cairo time (UTC+2)
function cairoNoon(dateStr) {
  return `${dateStr}T12:00:00+02:00`;
}

function buildTransactions(yahyaId, yaraId) {
  // Initial balance transactions — account for untracked pre-May-2025 history.
  // Calculated: final_balance - sum(tracked_transactions)
  //   Yara:  2550 - 80  = 2470
  //   Yahya: 1905 - 370 = 1535
  return [
    // ── Initial balances (pre-history) ───────────────────────
    {
      user_id: yaraId,
      amount: 2470,
      type: "earn",
      category: "initial_balance",
      description: "Initial balance — untracked history before May 2025",
      metadata: {},
      created_at: cairoNoon("2025-05-30"),
    },
    {
      user_id: yahyaId,
      amount: 1535,
      type: "earn",
      category: "initial_balance",
      description: "Initial balance — untracked history before May 2025",
      metadata: {},
      created_at: cairoNoon("2025-05-30"),
    },

    // ── Tracked transactions (chronological) ─────────────────
    {
      user_id: yaraId,
      amount: -50,
      type: "spend",
      category: "dare_penalty",
      description: "bahebek ya koki ❌",
      metadata: {},
      created_at: cairoNoon("2025-05-31"),
    },
    {
      user_id: yaraId,
      amount: 60,
      type: "earn",
      category: "dare_complete",
      description: "Bahebek ya koki ✅",
      metadata: {},
      created_at: cairoNoon("2025-05-31"),
    },
    {
      user_id: yaraId,
      amount: 20,
      type: "earn",
      category: "manual",
      description: "Bahebek ya koki",
      metadata: {},
      created_at: cairoNoon("2025-06-25"),
    },
    {
      user_id: yahyaId,
      amount: 50,
      type: "earn",
      category: "manual",
      description: "Treasure Hunt in Seoudi",
      metadata: {},
      created_at: cairoNoon("2025-07-08"),
    },
    {
      user_id: yaraId,
      amount: 100,
      type: "earn",
      category: "manual",
      description: "SEAT is espanol 🇪🇸",
      metadata: {},
      created_at: cairoNoon("2025-08-18"),
    },
    {
      user_id: yahyaId,
      amount: 20,
      type: "earn",
      category: "manual",
      description: "bahebek ya koki",
      metadata: {},
      created_at: cairoNoon("2025-08-18"),
    },
    {
      user_id: yahyaId,
      amount: 100,
      type: "earn",
      category: "manual",
      description: "Smokery guess the check",
      metadata: {},
      created_at: cairoNoon("2025-08-18"),
    },
    {
      user_id: yahyaId,
      amount: 200,
      type: "earn",
      category: "manual",
      description: "koubaisy location",
      metadata: {},
      created_at: cairoNoon("2025-08-18"),
    },
    {
      user_id: yaraId,
      amount: 100,
      type: "earn",
      category: "manual",
      description: "Khalto gayya",
      metadata: {},
      created_at: cairoNoon("2025-10-10"),
    },
    {
      user_id: yaraId,
      amount: -500,
      type: "spend",
      category: "manual",
      description: "awta bf in the world",
      metadata: {},
      created_at: cairoNoon("2025-10-10"),
    },
    {
      user_id: yaraId,
      amount: 250,
      type: "earn",
      category: "manual",
      description: "fasyet el fasyat",
      metadata: {},
      created_at: cairoNoon("2025-10-10"),
    },
    {
      user_id: yaraId,
      amount: 100,
      type: "earn",
      category: "manual",
      description: "khairat elsham",
      metadata: {},
      created_at: cairoNoon("2025-11-07"),
    },
  ];
}

// ── Main ──────────────────────────────────────────────────────

async function main() {
  console.log("Seeding CoYYns historical data...\n");

  // Step 1: Look up user IDs
  console.log("Step 1: Looking up user IDs...");
  const { data: profiles, error: profileErr } = await supabase
    .from("profiles")
    .select("id, display_name")
    .in("display_name", ["Yahya", "Yara"]);

  if (profileErr) throw profileErr;

  const yahya = profiles.find((p) => p.display_name === "Yahya");
  const yara = profiles.find((p) => p.display_name === "Yara");

  if (!yahya || !yara) {
    console.error(
      "Could not find both users. Found:",
      profiles.map((p) => p.display_name)
    );
    console.error("Run seed-users.mjs first.");
    process.exit(1);
  }

  console.log(`  Yahya: ${yahya.id}`);
  console.log(`  Yara:  ${yara.id}`);
  console.log("");

  // Step 2: Check if already seeded
  console.log("Step 2: Checking for existing seed data...");
  const { data: existing, error: checkErr } = await supabase
    .from("coyyns_transactions")
    .select("id, user_id")
    .eq("category", "initial_balance");

  if (checkErr) throw checkErr;

  if (existing && existing.length > 0) {
    const seededUsers = existing.map((t) =>
      t.user_id === yahya.id ? "Yahya" : "Yara"
    );
    console.log(`  Already seeded for: ${seededUsers.join(", ")}`);
    console.log("  Skipping insertion. Delete existing data to re-seed.");
    console.log("");

    // Still verify current state
    await printVerification(yahya.id, yara.id);
    return;
  }

  console.log("  No existing seed data found. Proceeding...");
  console.log("");

  // Step 3: Insert transactions chronologically
  console.log("Step 3: Inserting transactions...");
  const transactions = buildTransactions(yahya.id, yara.id);

  for (let i = 0; i < transactions.length; i++) {
    const tx = transactions[i];
    const userName = tx.user_id === yahya.id ? "Yahya" : "Yara";
    const sign = tx.amount > 0 ? "+" : "";

    const { error: insertErr } = await supabase
      .from("coyyns_transactions")
      .insert(tx);

    if (insertErr) {
      console.error(
        `  FAILED [${i + 1}/${transactions.length}] ${userName} ${sign}${tx.amount} "${tx.description}": ${insertErr.message}`
      );
      throw insertErr;
    }

    console.log(
      `  [${i + 1}/${transactions.length}] ${userName} ${sign}${tx.amount} — ${tx.description}`
    );
  }

  console.log("");

  // Step 4: Verify
  await printVerification(yahya.id, yara.id);
}

async function printVerification(yahyaId, yaraId) {
  console.log("Step 4: Verification...");
  console.log("");

  // Wallet balances
  const { data: wallets, error: walletErr } = await supabase
    .from("coyyns_wallets")
    .select("user_id, balance, lifetime_earned, lifetime_spent")
    .in("user_id", [yahyaId, yaraId]);

  if (walletErr) throw walletErr;

  const yahyaWallet = wallets.find((w) => w.user_id === yahyaId);
  const yaraWallet = wallets.find((w) => w.user_id === yaraId);

  console.log("  Wallet Balances:");
  console.log("  ┌──────────┬─────────┬─────────────────┬────────────────┐");
  console.log("  │ User     │ Balance │ Lifetime Earned │ Lifetime Spent │");
  console.log("  ├──────────┼─────────┼─────────────────┼────────────────┤");

  if (yaraWallet) {
    const balOk = yaraWallet.balance === 2550 ? "✓" : "✗";
    const earnOk = yaraWallet.lifetime_earned === 3100 ? "✓" : "✗";
    const spendOk = yaraWallet.lifetime_spent === 550 ? "✓" : "✗";
    console.log(
      `  │ Yara     │ ${String(yaraWallet.balance).padStart(5)}${balOk} │ ${String(yaraWallet.lifetime_earned).padStart(13)}${earnOk} │ ${String(yaraWallet.lifetime_spent).padStart(12)}${spendOk} │`
    );
  }

  if (yahyaWallet) {
    const balOk = yahyaWallet.balance === 1905 ? "✓" : "✗";
    const earnOk = yahyaWallet.lifetime_earned === 1905 ? "✓" : "✗";
    const spendOk = yahyaWallet.lifetime_spent === 0 ? "✓" : "✗";
    console.log(
      `  │ Yahya    │ ${String(yahyaWallet.balance).padStart(5)}${balOk} │ ${String(yahyaWallet.lifetime_earned).padStart(13)}${earnOk} │ ${String(yahyaWallet.lifetime_spent).padStart(12)}${spendOk} │`
    );
  }

  console.log("  └──────────┴─────────┴─────────────────┴────────────────┘");
  console.log("");

  // Transaction history
  const { data: txns, error: txErr } = await supabase
    .from("coyyns_transactions")
    .select("user_id, amount, type, category, description, created_at")
    .in("user_id", [yahyaId, yaraId])
    .order("created_at", { ascending: true });

  if (txErr) throw txErr;

  console.log(`  Transaction History (${txns.length} records):`);
  for (const tx of txns) {
    const name = tx.user_id === yahyaId ? "Yahya" : "Yara ";
    const sign = tx.amount > 0 ? "+" : "";
    const date = tx.created_at.slice(0, 10);
    console.log(
      `    ${date} | ${name} | ${sign}${String(tx.amount).padStart(5)} | ${tx.description}`
    );
  }

  console.log("\n========================================");
  console.log("Seed verification complete!");
  console.log("========================================\n");
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});

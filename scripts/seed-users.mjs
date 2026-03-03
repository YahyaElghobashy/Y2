/**
 * Seed Real User Accounts
 *
 * Creates Yahya & Yara in Supabase Auth, sets display names,
 * links partners, and seeds CoYYns wallets.
 *
 * Usage: node scripts/seed-users.mjs
 * Requires: .env.local with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
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

// ── User definitions ───────────────────────────────────────────
const USERS = [
  {
    email: "yahya.elghobashy99@gmail.com",
    password: "HaYYaH",
    displayName: "Yahya",
  },
  {
    email: "yora_hano_1998@hotmail.com",
    password: "HaYYaH",
    displayName: "Yara",
  },
];

// ── Helpers ────────────────────────────────────────────────────

async function createOrGetUser({ email, password, displayName }) {
  // Try to create the user
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: displayName },
  });

  if (!error) {
    console.log(`  Created ${displayName} (${email}) -> ${data.user.id}`);
    return data.user.id;
  }

  // User already exists — fetch their UUID
  if (
    error.message.includes("already been registered") ||
    error.message.includes("already exists")
  ) {
    console.log(`  ${displayName} already exists, fetching UUID...`);
    const {
      data: { users },
      error: listErr,
    } = await supabase.auth.admin.listUsers();
    if (listErr) throw listErr;

    const existing = users.find((u) => u.email === email);
    if (!existing) throw new Error(`Could not find existing user: ${email}`);

    console.log(`  Found ${displayName} (${email}) -> ${existing.id}`);
    return existing.id;
  }

  throw error;
}

// ── Main ──────────────────────────────────────────────────────

async function main() {
  console.log("Seeding Y2 user accounts...\n");

  // Step 1: Create or get both users
  console.log("Step 1: Creating auth users...");
  const yahyaId = await createOrGetUser(USERS[0]);
  const yaraId = await createOrGetUser(USERS[1]);

  console.log("");

  // Step 2: Ensure profile rows exist and set display names
  // (The handle_new_user trigger may not have fired if auth users were
  // created before migrations were applied. Upsert handles both cases.)
  console.log("Step 2: Ensuring profiles exist with display names...");
  for (const { email, displayName } of USERS) {
    const userId = displayName === "Yahya" ? yahyaId : yaraId;
    const { error } = await supabase
      .from("profiles")
      .upsert(
        { id: userId, display_name: displayName, email },
        { onConflict: "id" }
      );

    if (error) {
      console.warn(`  Warning upserting ${displayName} profile: ${error.message}`);
    } else {
      console.log(`  ${displayName} profile ready`);
    }
  }

  console.log("");

  // Step 3: Link partners
  console.log("Step 3: Linking partners...");
  const { error: linkErr1 } = await supabase
    .from("profiles")
    .update({ partner_id: yaraId })
    .eq("id", yahyaId);

  const { error: linkErr2 } = await supabase
    .from("profiles")
    .update({ partner_id: yahyaId })
    .eq("id", yaraId);

  if (linkErr1 || linkErr2) {
    console.warn(
      `  Warning linking partners: ${linkErr1?.message || ""} ${linkErr2?.message || ""}`
    );
  } else {
    console.log("  Partner link confirmed (Yahya <-> Yara)");
  }

  console.log("");

  // Step 4: Seed CoYYns wallets
  console.log("Step 4: Seeding CoYYns wallets...");
  for (const { displayName } of USERS) {
    const userId = displayName === "Yahya" ? yahyaId : yaraId;
    const { error } = await supabase
      .from("coyyns_wallets")
      .upsert(
        {
          user_id: userId,
          balance: 0,
          lifetime_earned: 0,
          lifetime_spent: 0,
        },
        { onConflict: "user_id", ignoreDuplicates: true }
      );

    if (error) {
      console.warn(`  Warning seeding ${displayName} wallet: ${error.message}`);
    } else {
      console.log(`  ${displayName} wallet seeded`);
    }
  }

  // Summary
  console.log("\n========================================");
  console.log("Seed complete!");
  console.log("========================================");
  console.log(`  Yahya: ${yahyaId}`);
  console.log(`    Email: yahya.elghobashy99@gmail.com`);
  console.log(`  Yara:  ${yaraId}`);
  console.log(`    Email: yora_hano_1998@hotmail.com`);
  console.log(`  Password (both): HaYYaH`);
  console.log("========================================\n");
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});

/**
 * Seed Trip #2 — Malaysia & Vietnam (hosted bundle: content/trips/malaysia-vietnam)
 *
 * Mirrors the cambridge-london hosted-trip seed: creates ONE `trips` row
 * (kind=hosted, hosted_path=malaysia-vietnam) under the same owner as the
 * existing UK trip. Idempotent — re-running leaves exactly one row.
 *
 * Usage: node scripts/seed-malaysia-trip.mjs
 * Requires: .env.local with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const envPath = resolve(__dirname, "../.env.local");
  const content = readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    process.env[trimmed.slice(0, eqIdx)] = trimmed.slice(eqIdx + 1);
  }
}
loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}
const supabase = createClient(url, key, { auth: { persistSession: false } });

const HOSTED_PATH = "malaysia-vietnam";

async function main() {
  // Idempotency: bail if the trip already exists.
  const { data: existing, error: exErr } = await supabase
    .from("trips")
    .select("id, title")
    .eq("hosted_path", HOSTED_PATH)
    .maybeSingle();
  if (exErr) throw exErr;
  if (existing) {
    console.log(`Already seeded: "${existing.title}" (${existing.id}) — nothing to do.`);
    return;
  }

  // Owner = whoever owns the existing UK hosted trip (real Yahya).
  const { data: uk, error: ukErr } = await supabase
    .from("trips")
    .select("id, created_by")
    .eq("hosted_path", "cambridge-london")
    .maybeSingle();
  if (ukErr) throw ukErr;
  if (!uk) {
    console.error("cambridge-london trip not found — cannot infer owner. Aborting.");
    process.exit(1);
  }

  const { data: trip, error: insErr } = await supabase
    .from("trips")
    .insert({
      created_by: uk.created_by,
      title: "Malaysia & Vietnam",
      destination: "Kuala Lumpur · Cyberjaya · Hanoi · Sapa",
      start_date: "2026-09-23",
      end_date: "2026-10-07",
      // The trip site's own hero image (same convention as the UK trip's cover).
      cover_image:
        "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?auto=format&fit=crop&w=1200&q=70",
      summary:
        "Conference at MMU Cyberjaya squeezed dry: Batu Caves, the Sentral spine, a KL masterpiece evening — then eight nights north in Vietnam. VN guide coming.",
      kind: "hosted",
      hosted_path: HOSTED_PATH,
      status: "upcoming",
    })
    .select("id, title, status, hosted_path")
    .single();
  if (insErr) throw insErr;

  console.log("Seeded trip:", trip);
  console.log(`Open it at /travels/${trip.id} → "Open the trip" serves content/trips/${HOSTED_PATH}/`);
}

main().catch((e) => {
  console.error("Seed failed:", e.message || e);
  process.exit(1);
});

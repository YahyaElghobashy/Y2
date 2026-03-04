import type { Database } from "./database.types"

// ── Row types (what you read from Supabase) ──────────────────
export type PrayerLog = Database["public"]["Tables"]["prayer_log"]["Row"]
export type QuranLog = Database["public"]["Tables"]["quran_log"]["Row"]
export type AzkarSession = Database["public"]["Tables"]["azkar_sessions"]["Row"]

// ── Insert types (what you write to Supabase) ────────────────
export type PrayerLogInsert = Database["public"]["Tables"]["prayer_log"]["Insert"]
export type QuranLogInsert = Database["public"]["Tables"]["quran_log"]["Insert"]
export type AzkarSessionInsert = Database["public"]["Tables"]["azkar_sessions"]["Insert"]

// ── Update types ─────────────────────────────────────────────
export type PrayerLogUpdate = Database["public"]["Tables"]["prayer_log"]["Update"]
export type QuranLogUpdate = Database["public"]["Tables"]["quran_log"]["Update"]
export type AzkarSessionUpdate = Database["public"]["Tables"]["azkar_sessions"]["Update"]

// ── Domain constants ─────────────────────────────────────────
export const PRAYER_NAMES = ["fajr", "dhuhr", "asr", "maghrib", "isha"] as const
export type PrayerName = (typeof PRAYER_NAMES)[number]

export const AZKAR_SESSION_TYPES = ["morning", "evening"] as const
export type AzkarSessionType = (typeof AZKAR_SESSION_TYPES)[number]

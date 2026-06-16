import data from "@/lib/data/quran-ayat.json"

/**
 * Daily ayah — sourced factually, never generated.
 *
 * The Arabic (Uthmani) and English (Saheeh International) text live in
 * `src/lib/data/quran-ayat.json`, fetched verbatim from the canonical
 * alquran.cloud API (see scripts/fetch-quran-ayat.py) and committed so the
 * app is offline-safe and every verse is auditable by surah:ayah against the
 * Mushaf. No LLM or hand-authored Qur'an text is permitted in this app.
 */
export type Ayah = {
  surah: number
  ayah: number
  ref: string
  surahNameAr: string
  surahNameEn: string
  arabic: string
  translation: string
}

export const QURAN_ATTRIBUTION = {
  source: data._source,
  arabicEdition: data._arabicEdition,
  translationEdition: data._translationEdition,
  translatorCredit: "Saheeh International",
} as const

const VERSES: Ayah[] = data.verses as Ayah[]

/** Days since the Unix epoch in UTC — stable, timezone-independent. */
function epochDay(date: Date): number {
  return Math.floor(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / 86_400_000)
}

/**
 * Deterministic verse for a given day: the same date always yields the same
 * ayah, rotating through the full curated set. No randomness (keeps it stable
 * across reloads, server/client, and offline).
 */
export function getDailyAyah(date: Date = new Date()): Ayah {
  if (VERSES.length === 0) {
    // Should never happen (dataset is committed), but never crash the Soul screen.
    return { surah: 0, ayah: 0, ref: "", surahNameAr: "", surahNameEn: "", arabic: "", translation: "" }
  }
  return VERSES[epochDay(date) % VERSES.length]
}

export { VERSES as QURAN_VERSES }

import {
  Coordinates,
  CalculationMethod,
  PrayerTimes,
  type CalculationParameters,
} from "adhan"
import { PRAYER_NAMES, type PrayerName } from "@/lib/types/spiritual.types"

/**
 * Factual prayer-time computation.
 *
 * Prayer times are COMPUTED astronomically from the user's coordinates via the
 * `adhan` library — they are never fabricated or hard-coded. (This is distinct
 * from the Qur'an, which is only ever read from the vetted dataset.)
 *
 * Pure functions only — no React, no Supabase — so they can be unit-tested
 * against fixed coordinates + dates.
 */

/** A single prayer slot shown in the UI. */
export type PrayerSlot = {
  key: PrayerName | "sunrise"
  /** Absolute time today for this prayer. */
  time: Date
}

/** All daily times derived from coordinates. */
export type DailyPrayerTimes = {
  fajr: Date
  sunrise: Date
  dhuhr: Date
  asr: Date
  maghrib: Date
  isha: Date
  /** Ordered slots (the 5 obligatory prayers + sunrise) for rendering. */
  slots: PrayerSlot[]
}

export type NextPrayer = {
  key: PrayerName
  /** When it begins (today or, after Isha, Fajr tomorrow). */
  time: Date
  /** Milliseconds remaining until it begins (>= 0). */
  msUntil: number
}

/**
 * adhan CalculationMethod keys we support. Egyptian = Egyptian General
 * Authority of Survey (the sensible default for Cairo / Egypt).
 */
export const PRAYER_METHODS = [
  "Egyptian",
  "MuslimWorldLeague",
  "Karachi",
  "UmmAlQura",
  "Dubai",
  "Qatar",
  "Kuwait",
  "Turkey",
  "NorthAmerica",
] as const
export type PrayerMethod = (typeof PRAYER_METHODS)[number]

export const DEFAULT_PRAYER_METHOD: PrayerMethod = "Egyptian"

/** Resolve a (possibly null/invalid) method string to adhan parameters. */
export function resolveMethod(method?: string | null): CalculationParameters {
  const key = (method ?? DEFAULT_PRAYER_METHOD) as PrayerMethod
  const factory = (CalculationMethod as Record<string, () => CalculationParameters>)[key]
  if (typeof factory === "function") return factory()
  return CalculationMethod[DEFAULT_PRAYER_METHOD]()
}

/**
 * Compute today's prayer times for given coordinates.
 * `date` defaults to now; pass a fixed Date in tests.
 */
export function computePrayerTimes(
  latitude: number,
  longitude: number,
  method?: string | null,
  date: Date = new Date(),
): DailyPrayerTimes {
  const coords = new Coordinates(latitude, longitude)
  const params = resolveMethod(method)
  const t = new PrayerTimes(coords, date, params)

  const slots: PrayerSlot[] = [
    { key: "fajr", time: t.fajr },
    { key: "sunrise", time: t.sunrise },
    { key: "dhuhr", time: t.dhuhr },
    { key: "asr", time: t.asr },
    { key: "maghrib", time: t.maghrib },
    { key: "isha", time: t.isha },
  ]

  return {
    fajr: t.fajr,
    sunrise: t.sunrise,
    dhuhr: t.dhuhr,
    asr: t.asr,
    maghrib: t.maghrib,
    isha: t.isha,
    slots,
  }
}

/**
 * The next obligatory prayer relative to `now`. After Isha, rolls over to
 * tomorrow's Fajr so there is always a valid countdown target.
 */
export function getNextPrayer(
  latitude: number,
  longitude: number,
  method?: string | null,
  now: Date = new Date(),
): NextPrayer {
  const today = computePrayerTimes(latitude, longitude, method, now)

  const obligatory: { key: PrayerName; time: Date }[] = PRAYER_NAMES.map((key) => ({
    key,
    time: today[key],
  }))

  const upcoming = obligatory.find((p) => p.time.getTime() > now.getTime())
  if (upcoming) {
    return { key: upcoming.key, time: upcoming.time, msUntil: upcoming.time.getTime() - now.getTime() }
  }

  // Past Isha — next is tomorrow's Fajr.
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const next = computePrayerTimes(latitude, longitude, method, tomorrow)
  return { key: "fajr", time: next.fajr, msUntil: next.fajr.getTime() - now.getTime() }
}

/** Format an absolute time as a localized "h:mm AM/PM" string. */
export function formatPrayerTime(date: Date, timeZone?: string | null): string {
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    ...(timeZone ? { timeZone } : {}),
  })
}

/** Format a millisecond duration as "h:mm:ss" (or "mm:ss" under an hour). */
export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const pad = (n: number) => String(n).padStart(2, "0")
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`
}

import { describe, it, expect } from "vitest"
import {
  computePrayerTimes,
  getNextPrayer,
  resolveMethod,
  formatCountdown,
  DEFAULT_PRAYER_METHOD,
} from "@/lib/prayer/compute"

// Cairo, Egypt — fixed reference point.
const CAIRO_LAT = 30.0444
const CAIRO_LNG = 31.2357

// A fixed midday date so computed times are deterministic and verifiable.
const FIXED_DATE = new Date("2024-06-15T12:00:00Z")

describe("prayer/compute", () => {
  // ── Unit: astronomical computation ──────────────────────────
  describe("computePrayerTimes", () => {
    it("computes the 5 prayers + sunrise for fixed Cairo coords + date", () => {
      const t = computePrayerTimes(CAIRO_LAT, CAIRO_LNG, "Egyptian", FIXED_DATE)

      // Adhan output for Cairo / Egyptian method on 2024-06-15 (UTC).
      expect(t.fajr.toISOString()).toBe("2024-06-15T01:08:00.000Z")
      expect(t.sunrise.toISOString()).toBe("2024-06-15T02:53:00.000Z")
      expect(t.dhuhr.toISOString()).toBe("2024-06-15T09:57:00.000Z")
      expect(t.maghrib.toISOString()).toBe("2024-06-15T16:58:00.000Z")
    })

    it("returns ordered slots: fajr, sunrise, dhuhr, asr, maghrib, isha", () => {
      const t = computePrayerTimes(CAIRO_LAT, CAIRO_LNG, "Egyptian", FIXED_DATE)
      expect(t.slots.map((s) => s.key)).toEqual([
        "fajr",
        "sunrise",
        "dhuhr",
        "asr",
        "maghrib",
        "isha",
      ])
    })

    it("times are strictly increasing across the day", () => {
      const t = computePrayerTimes(CAIRO_LAT, CAIRO_LNG, "Egyptian", FIXED_DATE)
      const ms = t.slots.map((s) => s.time.getTime())
      for (let i = 1; i < ms.length; i++) {
        expect(ms[i]).toBeGreaterThan(ms[i - 1])
      }
    })

    it("different methods produce different fajr times (method is honored)", () => {
      const egyptian = computePrayerTimes(CAIRO_LAT, CAIRO_LNG, "Egyptian", FIXED_DATE)
      const mwl = computePrayerTimes(CAIRO_LAT, CAIRO_LNG, "MuslimWorldLeague", FIXED_DATE)
      expect(egyptian.fajr.getTime()).not.toBe(mwl.fajr.getTime())
    })
  })

  // ── Unit: method resolution / fallback ──────────────────────
  describe("resolveMethod", () => {
    it("falls back to the default for null/undefined", () => {
      const fallback = resolveMethod(null)
      const explicit = resolveMethod(DEFAULT_PRAYER_METHOD)
      expect(fallback.fajrAngle).toBe(explicit.fajrAngle)
    })

    it("falls back to the default for an unknown method string", () => {
      const bogus = resolveMethod("NotARealMethod")
      const def = resolveMethod(DEFAULT_PRAYER_METHOD)
      expect(bogus.fajrAngle).toBe(def.fajrAngle)
    })
  })

  // ── Unit: next prayer + rollover ────────────────────────────
  describe("getNextPrayer", () => {
    it("returns the upcoming prayer when one remains today", () => {
      // 05:00 UTC is after dhuhr-prep but before dhuhr (09:57Z) → next is dhuhr.
      const now = new Date("2024-06-15T05:00:00Z")
      const next = getNextPrayer(CAIRO_LAT, CAIRO_LNG, "Egyptian", now)
      expect(next.key).toBe("dhuhr")
      expect(next.msUntil).toBeGreaterThan(0)
    })

    it("rolls over to tomorrow's Fajr after Isha", () => {
      // 22:00 UTC is past Isha → next must be Fajr (tomorrow).
      const now = new Date("2024-06-15T22:00:00Z")
      const next = getNextPrayer(CAIRO_LAT, CAIRO_LNG, "Egyptian", now)
      expect(next.key).toBe("fajr")
      expect(next.msUntil).toBeGreaterThan(0)
      // Tomorrow's fajr, not today's.
      expect(next.time.getTime()).toBeGreaterThan(now.getTime())
    })

    it("never returns a negative countdown", () => {
      const now = new Date("2024-06-15T09:57:00Z") // exactly dhuhr
      const next = getNextPrayer(CAIRO_LAT, CAIRO_LNG, "Egyptian", now)
      expect(next.msUntil).toBeGreaterThanOrEqual(0)
    })
  })

  // ── Unit: formatting ────────────────────────────────────────
  describe("formatCountdown", () => {
    it("formats hours:minutes:seconds", () => {
      expect(formatCountdown(3 * 3600_000 + 5 * 60_000 + 9_000)).toBe("3:05:09")
    })
    it("drops the hour segment under an hour", () => {
      expect(formatCountdown(2 * 60_000 + 4_000)).toBe("2:04")
    })
    it("clamps negatives to zero", () => {
      expect(formatCountdown(-5000)).toBe("0:00")
    })
  })
})

"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Check, MapPin } from "lucide-react"
import { PosterCard } from "@/components/shared/PosterCard"
import { getDailyAyah } from "@/lib/quran/daily-ayah"

/**
 * SoulView — the sacred corner (docs/DESIGN_BLUEPRINT.md §7.2). The reverent
 * register: prayer-light video, Islamic geometry, Amiri du'a, teal+amber
 * stillness. Presentational; real trackers (PrayerTracker/Quran/Azkar/Ayah)
 * wire in behind the same layout.
 *
 * Prayer TIMES, when present, are COMPUTED astronomically from the user's
 * coordinates (adhan library) by usePrayerTimes — never fabricated. When no
 * location is set the screen shows a clean prompt instead of any times.
 */
const PRAYERS = [
  { key: "fajr", name: "Fajr" },
  { key: "dhuhr", name: "Dhuhr" },
  { key: "asr", name: "Asr" },
  { key: "maghrib", name: "Maghrib" },
  { key: "isha", name: "Isha" },
]

/** A formatted prayer-time row supplied by usePrayerTimes (or mock in preview). */
export type PrayerTimeRow = { key: string; label: string; isNext: boolean }

export type SoulPrayerTimes = {
  /** Formatted rows for the 5 prayers (+ optionally sunrise). */
  rows: PrayerTimeRow[]
  /** Name of the next prayer (e.g. "Asr"). */
  nextName: string
  /** Localized clock time of the next prayer. */
  nextLabel: string
  /** Live "h:mm:ss" countdown to the next prayer. */
  countdown: string
}

export type SoulData = {
  prayed: Record<string, boolean>
  ayah: { arabic: string; translation: string; ref: string }
  quran: { surah: string; pct: number }
  azkar: { goal: number; current?: number }
  /** Computed prayer times, or null when no location is saved. */
  prayerTimes?: SoulPrayerTimes | null
  /** True when the user has not set a location yet → show the prompt. */
  needsLocation?: boolean
  /** True while a location save is in flight. */
  locationSaving?: boolean
}

const PRAYER_LABELS: Record<string, string> = {
  fajr: "Fajr",
  sunrise: "Sunrise",
  dhuhr: "Dhuhr",
  asr: "Asr",
  maghrib: "Maghrib",
  isha: "Isha",
}

export function SoulView({
  data,
  onTogglePrayer,
  onIncrementAzkar,
  onDetectLocation,
}: {
  data: SoulData
  /** Authed: persist the toggle/count. Preview leaves them undefined (demo). */
  onTogglePrayer?: (key: string) => void
  onIncrementAzkar?: () => void
  /** Authed: capture device location to compute real times. Preview omits it. */
  onDetectLocation?: () => void
}) {
  const [prayed, setPrayed] = useState<Record<string, boolean>>(data.prayed)
  const [azkar, setAzkar] = useState(data.azkar.current ?? 0)

  // Re-sync from props when the source data changes (the page memoizes `data`
  // from realtime hook state, so these fire only on a real change). Without
  // this, a prayer your partner logged — or a fresh fetch — left the local
  // toggles/count stale.
  useEffect(() => { setPrayed(data.prayed) }, [data.prayed])
  useEffect(() => { setAzkar(data.azkar.current ?? 0) }, [data.azkar.current])

  const toggle = (k: string) => {
    setPrayed((p) => ({ ...p, [k]: !p[k] }))
    onTogglePrayer?.(k)
  }
  const countAzkar = () => {
    setAzkar((c) => Math.min(data.azkar.goal, c + 1))
    onIncrementAzkar?.()
  }

  return (
    <div className="skin-aware texture-islamic min-h-[100dvh] pb-28" style={{ background: "var(--background)" }}>
      {/* ── Ambient prayer-light hero ── */}
      <div className="relative h-[200px] overflow-hidden rounded-b-[28px]">
        <video
          autoPlay
          muted
          loop
          playsInline
          poster="/assets/video/anim-prayer-light-poster.webp"
          className="absolute inset-0 h-full w-full object-cover"
        >
          <source src="/assets/video/anim-prayer-light.webm" type="video/webm" />
          <source src="/assets/video/anim-prayer-light.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(25,26,44,0.15) 0%, rgba(21,112,111,0.55) 100%)" }} />
        <div className="absolute inset-x-0 bottom-0 p-5">
          <p className="text-[22px] leading-none" style={{ fontFamily: "var(--font-arabic)", color: "#F2E9DB" }}>الرّوح</p>
          <h1 className="mt-1.5 text-[30px] font-extrabold tracking-tight" style={{ fontFamily: "var(--font-display)", color: "#FFF7EF" }}>Soul</h1>
          <p className="mt-0.5 text-[14px]" style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", color: "#CDEAE6" }}>
            A quiet room, not a productivity dashboard.
          </p>
        </div>
      </div>

      <div className="px-5 pt-5">
        {/* ── Prayer tracker ── */}
        <div className="mb-3 flex items-center justify-between">
          {PRAYERS.map((p) => {
            const done = prayed[p.key]
            return (
              <button key={p.key} type="button" onClick={() => toggle(p.key)} data-testid={`prayer-toggle-${p.key}`} data-prayed={done} className="flex flex-1 flex-col items-center gap-1">
                <motion.span
                  whileTap={{ scale: 0.88 }}
                  className="grid h-11 w-11 place-items-center rounded-full border-2 transition-colors"
                  style={{
                    borderColor: done ? "var(--color-teal)" : "var(--border)",
                    background: done ? "var(--color-teal)" : "transparent",
                    color: done ? "#FFF7EF" : "var(--color-ink-soft)",
                  }}
                >
                  {done ? <Check size={18} strokeWidth={2.5} /> : <span className="text-[15px]">🕌</span>}
                </motion.span>
                <span className="text-[11px] font-bold" style={{ fontFamily: "var(--font-nav)", color: done ? "var(--color-teal-deep)" : "var(--color-ink)" }}>{p.name}</span>
              </button>
            )
          })}
        </div>

        {/* ── Prayer times (computed from location) ── */}
        {data.needsLocation ? (
          <PosterCard accent="teal" className="mb-3 text-center">
            <p className="text-[15px] font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}>
              See today's prayer times
            </p>
            <p className="mt-1 text-[13px]" style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", color: "var(--color-ink-soft)" }}>
              Set your location and we'll compute the five daily times for where you are.
            </p>
            <motion.button
              whileTap={{ scale: 0.96 }}
              type="button"
              onClick={() => onDetectLocation?.()}
              disabled={data.locationSaving}
              className="mt-3 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[14px] font-bold disabled:opacity-60"
              style={{ background: "var(--color-teal)", color: "#FFF7EF", fontFamily: "var(--font-nav)" }}
              data-testid="set-location-button"
            >
              <MapPin size={16} strokeWidth={2.5} />
              {data.locationSaving ? "Locating…" : "Use my location"}
            </motion.button>
          </PosterCard>
        ) : data.prayerTimes ? (
          <PosterCard accent="teal" className="mb-3">
           <div data-testid="prayer-times-card">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ fontFamily: "var(--font-nav)", color: "var(--color-teal-deep)" }}>
                Prayer Times
              </p>
              <div className="text-right" data-testid="next-prayer">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em]" style={{ fontFamily: "var(--font-nav)", color: "var(--color-amber)" }}>
                  {data.prayerTimes.nextName} in {data.prayerTimes.countdown}
                </p>
                <p className="text-[12px]" style={{ color: "var(--color-ink-soft)" }}>at {data.prayerTimes.nextLabel}</p>
              </div>
            </div>
            <ul className="space-y-1.5">
              {data.prayerTimes.rows.map((r) => (
                <li
                  key={r.key}
                  data-testid={`prayer-row-${r.key}`}
                  data-next={r.isNext}
                  className="flex items-center justify-between rounded-lg px-2.5 py-1.5"
                  style={r.isNext ? { background: "var(--color-sand)" } : undefined}
                >
                  <span
                    className="text-[14px]"
                    style={{
                      fontFamily: "var(--font-nav)",
                      fontWeight: r.isNext ? 800 : 600,
                      color: r.isNext ? "var(--color-teal-deep)" : "var(--color-ink)",
                    }}
                  >
                    {PRAYER_LABELS[r.key] ?? r.key}
                  </span>
                  <span
                    className="text-[14px] tabular-nums"
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontWeight: r.isNext ? 800 : 500,
                      color: r.isNext ? "var(--color-teal-deep)" : "var(--color-ink-soft)",
                    }}
                  >
                    {r.label}
                  </span>
                </li>
              ))}
            </ul>
           </div>
          </PosterCard>
        ) : null}

        {/* ── Daily Ayah (centerpiece) ── */}
        <PosterCard grain={false} className="relative overflow-hidden text-center" accent="amber">
          <span aria-hidden className="absolute -right-4 -top-4 text-[64px] opacity-[0.06]">۞</span>
          <p className="px-2 text-[26px] leading-[1.7]" style={{ fontFamily: "var(--font-arabic)", color: "var(--color-teal-deep)" }} dir="rtl">
            {data.ayah.arabic}
          </p>
          <p className="mt-3 px-2 text-[15px] leading-relaxed" style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", color: "var(--color-ink-soft)" }}>
            “{data.ayah.translation}”
          </p>
          <p className="mt-2 text-[12px] font-bold uppercase tracking-[0.16em]" style={{ fontFamily: "var(--font-nav)", color: "var(--color-amber)" }}>
            {data.ayah.ref}
          </p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.14em]" style={{ color: "var(--color-ink-soft)", opacity: 0.6 }}>
            Saheeh International
          </p>
        </PosterCard>

        {/* ── Quran + Azkar ── */}
        <div className="mt-3 grid grid-cols-2 gap-3">
          <PosterCard accent="teal" className="!p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ fontFamily: "var(--font-nav)", color: "var(--color-teal-deep)" }}>Qur'an</p>
            <p className="mt-1 text-[15px] font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}>{data.quran.surah}</p>
            <div className="mt-2 h-2 overflow-hidden rounded-full" style={{ background: "var(--color-sand)" }}>
              <div className="h-full rounded-full" style={{ width: `${data.quran.pct}%`, background: "var(--color-teal)" }} />
            </div>
            <p className="mt-1.5 text-[12px]" style={{ color: "var(--color-ink-soft)" }}>{data.quran.pct}% this month</p>
          </PosterCard>

          <PosterCard accent="amber" className="!p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ fontFamily: "var(--font-nav)", color: "var(--color-terracotta)" }}>Azkar</p>
            <button type="button" onClick={countAzkar} className="mt-1 w-full text-left">
              <span data-testid="azkar-count" className="text-[34px] font-extrabold tabular-nums leading-none" style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}>
                {azkar}
              </span>
              <span className="ml-1 text-[14px]" style={{ color: "var(--color-ink-soft)" }}>/ {data.azkar.goal}</span>
            </button>
            <p className="mt-1.5 text-[12px]" style={{ color: "var(--color-ink-soft)" }}>tap to count</p>
          </PosterCard>
        </div>
      </div>
    </div>
  )
}

const MOCK_AYAH = getDailyAyah()

// Preview/demo prayer times — fixed Cairo coordinates so /preview renders a
// realistic card without geolocation. These are illustrative demo values for
// the design preview only; the live screen computes real times via adhan.
const MOCK_PRAYER_TIMES: SoulPrayerTimes = {
  rows: [
    { key: "fajr", label: "3:09 AM", isNext: false },
    { key: "sunrise", label: "4:53 AM", isNext: false },
    { key: "dhuhr", label: "11:57 AM", isNext: true },
    { key: "asr", label: "3:33 PM", isNext: false },
    { key: "maghrib", label: "6:58 PM", isNext: false },
    { key: "isha", label: "8:29 PM", isNext: false },
  ],
  nextName: "Dhuhr",
  nextLabel: "11:57 AM",
  countdown: "1:24:00",
}

export const SOUL_MOCK: SoulData = {
  prayed: { fajr: true, dhuhr: true, asr: false, maghrib: false, isha: false },
  // Sourced from the vetted Qur'an dataset — never hand-typed.
  ayah: { arabic: MOCK_AYAH.arabic, translation: MOCK_AYAH.translation, ref: `${MOCK_AYAH.surahNameEn} ${MOCK_AYAH.ref}` },
  quran: { surah: "Al-Mulk", pct: 40 },
  azkar: { goal: 33 },
  prayerTimes: MOCK_PRAYER_TIMES,
  needsLocation: false,
}

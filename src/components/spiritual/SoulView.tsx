"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Check } from "lucide-react"
import { PosterCard } from "@/components/shared/PosterCard"

/**
 * SoulView — the sacred corner (docs/DESIGN_BLUEPRINT.md §7.2). The reverent
 * register: prayer-light video, Islamic geometry, Amiri du'a, teal+amber
 * stillness. Presentational; real trackers (PrayerTracker/Quran/Azkar/Ayah)
 * wire in behind the same layout.
 */
const PRAYERS = [
  { key: "fajr", name: "Fajr", time: "4:42" },
  { key: "dhuhr", name: "Dhuhr", time: "12:58" },
  { key: "asr", name: "Asr", time: "4:31" },
  { key: "maghrib", name: "Maghrib", time: "7:54" },
  { key: "isha", name: "Isha", time: "9:22" },
]

export type SoulData = {
  prayed: Record<string, boolean>
  ayah: { arabic: string; translation: string; ref: string }
  quran: { surah: string; pct: number }
  azkar: { goal: number; current?: number }
}

export function SoulView({
  data,
  onTogglePrayer,
  onIncrementAzkar,
}: {
  data: SoulData
  /** Authed: persist the toggle/count. Preview leaves them undefined (demo). */
  onTogglePrayer?: (key: string) => void
  onIncrementAzkar?: () => void
}) {
  const [prayed, setPrayed] = useState<Record<string, boolean>>(data.prayed)
  const [azkar, setAzkar] = useState(data.azkar.current ?? 0)
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
              <button key={p.key} type="button" onClick={() => toggle(p.key)} className="flex flex-1 flex-col items-center gap-1">
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
                <span className="text-[10px]" style={{ color: "var(--color-ink-soft)" }}>{p.time}</span>
              </button>
            )
          })}
        </div>

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
        </PosterCard>

        {/* ── Quran + Azkar ── */}
        <div className="mt-3 grid grid-cols-2 gap-3">
          <PosterCard accent="teal" className="!p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ fontFamily: "var(--font-nav)", color: "var(--color-teal-deep)" }}>Qur'an</p>
            <p className="mt-1 text-[15px] font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}>{data.quran.surah}</p>
            <div className="mt-2 h-2 overflow-hidden rounded-full" style={{ background: "var(--color-sand)" }}>
              <div className="h-full rounded-full" style={{ width: `${data.quran.pct}%`, background: "var(--color-teal)" }} />
            </div>
            <p className="mt-1.5 text-[12px]" style={{ color: "var(--color-ink-soft)" }}>{data.quran.pct}% of the juz</p>
          </PosterCard>

          <PosterCard accent="amber" className="!p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ fontFamily: "var(--font-nav)", color: "var(--color-terracotta)" }}>Azkar</p>
            <button type="button" onClick={countAzkar} className="mt-1 w-full text-left">
              <span className="text-[34px] font-extrabold tabular-nums leading-none" style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}>
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

export const SOUL_MOCK: SoulData = {
  prayed: { fajr: true, dhuhr: true, asr: false, maghrib: false, isha: false },
  ayah: {
    arabic: "وَهُوَ مَعَكُمْ أَيْنَ مَا كُنتُمْ",
    translation: "And He is with you wherever you are.",
    ref: "Al-Hadid · 57:4",
  },
  quran: { surah: "Al-Mulk", pct: 40 },
  azkar: { goal: 33 },
}

"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ChevronRight } from "lucide-react"
import { PosterCard } from "@/components/shared/PosterCard"

/**
 * KeepsakeView — the memory world's home (docs/DESIGN_BLUEPRINT.md §6.0). An
 * "on this day" hero that resurfaces a past memory, the four memory rooms, and
 * the days-together counter. Sepia, nostalgic. Presentational.
 */
const hideOnError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  e.currentTarget.style.display = "none"
}

type Room = { label: string; line: string; href: string; emoji: string; accent: "amber" | "teal" | "coral" | "rose" }
const ROOMS: Room[] = [
  { label: "Snaps", line: "a photo a day", href: "/snap", emoji: "📷", accent: "amber" },
  { label: "Garden", line: "blooms of your days", href: "/garden", emoji: "🌿", accent: "teal" },
  { label: "2026 Vision", line: "the year you're building", href: "/2026", emoji: "🌅", accent: "coral" },
  { label: "Letters", line: "words, sealed", href: "/keepsake/letters", emoji: "✉️", accent: "rose" },
]

export type KeepsakeData = {
  onThisDay: { yearsAgo: number; photo: string; line: string } | null
  daysTogether: number
  nextMilestone: { label: string; inDays: number }
}

export function KeepsakeView({ data }: { data: KeepsakeData }) {
  return (
    <div className="skin-aware min-h-[100dvh] px-5 pb-28 pt-6" style={{ background: "var(--background)" }}>
      <header className="mb-4">
        <p className="text-[19px] leading-none" style={{ fontFamily: "var(--font-arabic)", color: "var(--color-teal-deep)" }}>الذّكرى</p>
        <h1 className="mt-1 text-[30px] font-extrabold tracking-tight" style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}>Keepsake</h1>
      </header>

      {/* ── On this day ── */}
      {data.onThisDay && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative mb-5 overflow-hidden rounded-[24px]" style={{ boxShadow: "var(--shadow-warm-lg)" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={data.onThisDay.photo} alt="" aria-hidden onError={hideOnError} className="h-[210px] w-full object-cover" style={{ filter: "sepia(0.18)" }} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(42,32,24,0) 35%, rgba(42,32,24,0.72) 100%)" }} />
          <div className="absolute inset-x-0 bottom-0 p-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ fontFamily: "var(--font-nav)", color: "#F2C99B" }}>
              On this day · {data.onThisDay.yearsAgo}y ago
            </p>
            <p className="mt-1 text-[20px] leading-snug" style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", color: "#FFF7EF" }}>
              “{data.onThisDay.line}”
            </p>
          </div>
        </motion.div>
      )}

      {/* ── Days together ── */}
      <PosterCard accent="teal" grain={false} className="mb-5 flex items-center justify-between">
        <div>
          <span className="text-[34px] font-extrabold leading-none tabular-nums" style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}>{data.daysTogether}</span>
          <span className="ml-1.5 text-[14px]" style={{ color: "var(--color-ink-soft)" }}>days, together</span>
        </div>
        <div className="text-right">
          <p className="text-[12px] font-bold uppercase tracking-[0.14em]" style={{ fontFamily: "var(--font-nav)", color: "var(--color-terracotta)" }}>{data.nextMilestone.label}</p>
          <p className="text-[13px]" style={{ color: "var(--color-ink-soft)" }}>in {data.nextMilestone.inDays} days</p>
        </div>
      </PosterCard>

      {/* ── Memory rooms ── */}
      <div className="grid grid-cols-2 gap-3">
        {ROOMS.map((r) => (
          <Link key={r.href} href={r.href}>
            <PosterCard accent={r.accent} interactive className="flex h-full flex-col gap-2 !p-4">
              <span className="grid h-11 w-11 place-items-center rounded-2xl text-2xl" style={{ background: "var(--color-sand)" }}>{r.emoji}</span>
              <span>
                <span className="block text-[15px] font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}>{r.label}</span>
                <span className="flex items-center gap-0.5 text-[12px]" style={{ color: "var(--color-ink-soft)" }}>{r.line}<ChevronRight size={12} /></span>
              </span>
            </PosterCard>
          </Link>
        ))}
      </div>
    </div>
  )
}

export const KEEPSAKE_MOCK: KeepsakeData = {
  onThisDay: { yearsAgo: 1, photo: "/assets/scenes/scene-rooftop-couple-night.webp", line: "You fell asleep mid-sentence and I just watched the city instead." },
  daysTogether: 128,
  nextMilestone: { label: "Half a year", inDays: 54 },
}

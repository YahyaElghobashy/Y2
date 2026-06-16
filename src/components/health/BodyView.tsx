"use client"

import { motion } from "framer-motion"
import { PosterCard } from "@/components/shared/PosterCard"

/**
 * BodyView — the cycle companion (docs/DESIGN_BLUEPRINT.md §7.1). Calm-warm, NOT
 * clinical-cold: rose register, a gentle phase hero, an insight, a soft cycle
 * ribbon, and the fitness goal. Owner-only in the real app. Presentational.
 */
type Phase = "menstrual" | "follicular" | "ovulation" | "luteal"
const PHASE_COLOR: Record<Phase, string> = {
  menstrual: "#C8556F",
  follicular: "#E0A8B4",
  ovulation: "#F2A93B",
  luteal: "#A8B5A0",
}
const PHASE_LABEL: Record<Phase, string> = {
  menstrual: "Menstrual",
  follicular: "Follicular",
  ovulation: "Ovulation",
  luteal: "Luteal",
}

export type BodyData = {
  day: number
  cycleLength: number
  phase: Phase
  nextPeriodDays: number
  energy: string
  ribbon: Phase[] // one per cycle day
  // Real fitness data — optional. When absent/null there is no fitness source yet,
  // and the section renders an honest "coming soon" state instead of fabricating a
  // progress bar with made-up kilograms.
  fitness?: { goalKg: number; currentKg: number; startKg: number } | null
}

export function BodyView({ data }: { data: BodyData }) {
  const fitness = data.fitness ?? null
  const fitPct = fitness
    ? Math.round(((fitness.startKg - fitness.currentKg) / (fitness.startKg - fitness.goalKg)) * 100)
    : 0
  return (
    <div className="skin-aware min-h-[100dvh] px-5 pb-28 pt-6" style={{ background: "var(--background)" }}>
      <header className="mb-4">
        <p className="text-[19px] leading-none" style={{ fontFamily: "var(--font-arabic)", color: PHASE_COLOR.menstrual }}>الجسد</p>
        <h1 className="mt-1 text-[30px] font-extrabold tracking-tight" style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}>Body</h1>
      </header>

      {/* ── Phase hero ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[26px] p-6 text-center"
        style={{ background: `radial-gradient(120% 90% at 50% 0%, ${PHASE_COLOR[data.phase]}33, var(--card) 70%)`, boxShadow: "var(--shadow-warm-md)", border: "1px solid var(--border)" }}
      >
        <p className="text-[12px] font-bold uppercase tracking-[0.2em]" style={{ fontFamily: "var(--font-nav)", color: PHASE_COLOR[data.phase] }}>
          {PHASE_LABEL[data.phase]}
        </p>
        <p className="mt-1 text-[52px] font-extrabold leading-none" style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}>
          Day {data.day}
        </p>
        <p className="mt-1 text-[15px]" style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", color: "var(--color-ink-soft)" }}>
          of a {data.cycleLength}-day cycle
        </p>
        {/* cycle ribbon */}
        <div className="mt-5 flex justify-center gap-[3px]">
          {data.ribbon.map((p, i) => (
            <span
              key={i}
              className="h-6 flex-1 rounded-full"
              style={{
                maxWidth: 9,
                background: PHASE_COLOR[p],
                opacity: i + 1 === data.day ? 1 : 0.4,
                outline: i + 1 === data.day ? "2px solid var(--foreground)" : "none",
                outlineOffset: 1,
              }}
            />
          ))}
        </div>
      </motion.div>

      {/* ── Insights ── */}
      <div className="mt-3 grid grid-cols-2 gap-3">
        <PosterCard accent="rose" grain={false} className="!p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ fontFamily: "var(--font-nav)", color: PHASE_COLOR.menstrual }}>Next period</p>
          <p className="mt-1 text-[26px] font-extrabold leading-none" style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}>~{data.nextPeriodDays}d</p>
          <p className="mt-1 text-[12px]" style={{ color: "var(--color-ink-soft)" }}>a gentle heads-up</p>
        </PosterCard>
        <PosterCard accent="amber" grain={false} className="!p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ fontFamily: "var(--font-nav)", color: "var(--color-terracotta)" }}>Energy</p>
          <p className="mt-1 text-[22px] font-extrabold leading-none" style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}>{data.energy}</p>
          <p className="mt-1 text-[12px]" style={{ color: "var(--color-ink-soft)" }}>plan the week around it</p>
        </PosterCard>
      </div>

      {/* ── Fitness ── */}
      <h2 className="mb-2 mt-6 text-[17px] font-bold tracking-tight" style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}>
        {fitness ? `Toward ${fitness.goalKg}kg` : "Fitness"}
      </h2>
      {fitness ? (
        <PosterCard accent="teal" grain={false}>
          <div className="flex items-end justify-between">
            <span className="text-[28px] font-extrabold leading-none" style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}>{fitness.currentKg}<span className="text-[15px] font-medium" style={{ color: "var(--color-ink-soft)" }}> kg</span></span>
            <span className="text-[13px]" style={{ color: "var(--color-ink-soft)" }}>{fitPct}% there</span>
          </div>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full" style={{ background: "var(--color-sand)" }}>
            <div className="h-full rounded-full" style={{ width: `${Math.max(4, Math.min(100, fitPct))}%`, background: "var(--color-teal)" }} />
          </div>
        </PosterCard>
      ) : (
        /* No real fitness source yet — stay honest: a calm note, no fabricated kilograms. */
        <PosterCard accent="teal" grain={false}>
          <p className="text-[15px] font-bold leading-snug" style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}>
            Fitness tracking is coming soon
          </p>
          <p className="mt-1 text-[13px]" style={{ color: "var(--color-ink-soft)" }}>
            A gentle place to follow the journey — once it&rsquo;s ready.
          </p>
        </PosterCard>
      )}
    </div>
  )
}

export const BODY_MOCK: BodyData = {
  day: 14,
  cycleLength: 28,
  phase: "ovulation",
  nextPeriodDays: 14,
  energy: "High",
  ribbon: [
    "menstrual", "menstrual", "menstrual", "menstrual", "menstrual",
    "follicular", "follicular", "follicular", "follicular", "follicular", "follicular", "follicular", "follicular",
    "ovulation", "ovulation", "ovulation",
    "luteal", "luteal", "luteal", "luteal", "luteal", "luteal", "luteal", "luteal", "luteal", "luteal", "luteal", "luteal",
  ],
  fitness: { goalKg: 85, currentKg: 91, startKg: 98 },
}

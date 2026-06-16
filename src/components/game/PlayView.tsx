"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ChevronRight, Disc3, Sparkles, Play } from "lucide-react"
import { PosterCard } from "@/components/shared/PosterCard"

/**
 * PlayView — the games hub (docs/DESIGN_BLUEPRINT.md §4.2). The playful register:
 * coral+indigo, bounce, a resume banner + three game modes + wheel/bank.
 * Presentational; modes link to the existing /game/* flows.
 */
type Accent = "teal" | "indigo" | "coral"
const MODES: { key: string; name: string; arabic: string; desc: string; emoji: string; accent: Accent; href: string }[] = [
  { key: "checkin", name: "Check-In", arabic: "اطمئنان", desc: "Five quick questions — see where you align.", emoji: "🤝", accent: "teal", href: "/game/check-in" },
  { key: "deepdive", name: "Deep Dive", arabic: "غوص", desc: "One topic. All the way down.", emoji: "🌊", accent: "indigo", href: "/game/deep-dive" },
  { key: "datenight", name: "Date Night", arabic: "ليلة", desc: "Truth, dare, and CoYYns on the line.", emoji: "🎲", accent: "coral", href: "/game/date-night" },
]

const ACCENT_VAR: Record<Accent, string> = {
  teal: "var(--color-teal)",
  indigo: "var(--color-indigo)",
  coral: "var(--color-coral)",
}

export type PlayData = {
  active: { mode: string; round: number; yourTurn: boolean; href: string } | null
}

export function PlayView({ data }: { data: PlayData }) {
  return (
    <div className="skin-aware min-h-[100dvh] px-5 pb-28 pt-6" style={{ background: "var(--background)" }}>
      <header className="mb-4">
        <p className="text-[19px] leading-none" style={{ fontFamily: "var(--font-arabic)", color: "var(--color-coral)" }}>نلعب</p>
        <h1 className="mt-1 text-[30px] font-extrabold tracking-tight" style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}>Play</h1>
      </header>

      {/* ── Resume banner ── */}
      {data.active && (
        <Link href={data.active.href}>
          <motion.div
            whileTap={{ scale: 0.99 }}
            className="mb-4 flex items-center gap-3 overflow-hidden rounded-2xl p-4"
            style={{ background: "linear-gradient(135deg, var(--color-indigo), var(--color-coral))", boxShadow: "var(--shadow-warm-md)" }}
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full" style={{ background: "rgba(255,247,239,0.16)", color: "#FFF7EF" }}>
              <Play size={20} fill="#FFF7EF" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[11px] font-bold uppercase tracking-[0.16em]" style={{ fontFamily: "var(--font-nav)", color: "#F2C99B" }}>Resume</span>
              <span className="block text-[16px] font-bold" style={{ fontFamily: "var(--font-display)", color: "#FFF7EF" }}>
                {data.active.mode} · Round {data.active.round}
              </span>
            </span>
            <span className="rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ background: "#FFF7EF", color: "var(--color-indigo)" }}>
              {data.active.yourTurn ? "your turn" : "their turn"}
            </span>
          </motion.div>
        </Link>
      )}

      {/* ── Game modes ── */}
      <div className="grid gap-3">
        {MODES.map((m, i) => (
          <motion.div key={m.key} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 + i * 0.07 }}>
            <Link href={m.href}>
              <PosterCard accent={m.accent} interactive className="flex items-center gap-4">
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-3xl" style={{ background: "var(--color-sand)" }}>
                  {m.emoji}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline gap-2">
                    <span className="text-[18px] font-extrabold" style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}>{m.name}</span>
                    <span className="text-[14px]" style={{ fontFamily: "var(--font-arabic)", color: ACCENT_VAR[m.accent] }}>{m.arabic}</span>
                  </span>
                  <span className="mt-0.5 block text-[13px]" style={{ fontFamily: "var(--font-serif)", color: "var(--color-ink-soft)" }}>{m.desc}</span>
                </span>
                <ChevronRight size={18} style={{ color: "var(--color-ink-soft)" }} />
              </PosterCard>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* ── Wheel + Bank ── */}
      <div className="mt-3 grid grid-cols-2 gap-3">
        <Link href="/wheel">
          <PosterCard grain={false} interactive className="flex flex-col items-start gap-2 !p-4">
            <span className="grid h-9 w-9 place-items-center rounded-xl" style={{ background: "var(--color-sand)", color: "var(--color-terracotta)" }}>
              <Disc3 size={20} />
            </span>
            <span className="text-[14px] font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}>Spin the Wheel</span>
          </PosterCard>
        </Link>
        <Link href="/game/bank">
          <PosterCard grain={false} interactive className="flex flex-col items-start gap-2 !p-4">
            <span className="grid h-9 w-9 place-items-center rounded-xl" style={{ background: "var(--color-sand)", color: "var(--color-amber)" }}>
              <Sparkles size={20} />
            </span>
            <span className="text-[14px] font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}>Question Bank</span>
          </PosterCard>
        </Link>
      </div>
    </div>
  )
}

export const PLAY_MOCK: PlayData = {
  active: { mode: "Date Night", round: 3, yourTurn: true, href: "/game/date-night" },
}

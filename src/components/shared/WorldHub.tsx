"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ChevronRight } from "lucide-react"
import { PosterCard } from "@/components/shared/PosterCard"

/**
 * WorldHub — the calm entry of a world (docs/DESIGN_BLUEPRINT.md §4.0/§5.0/§6.0).
 * A title + a few "room" PosterCards. Props-driven so it renders in the authed
 * route and the /preview harness alike.
 */
type Accent = "terracotta" | "amber" | "coral" | "teal" | "indigo" | "rose"

export type HubRoom = {
  label: string
  line: string
  href: string
  emoji: string
  accent: Accent
}

const EASE: [number, number, number, number] = [0.25, 0.1, 0.25, 1]

export function WorldHub({
  title,
  arabic,
  intro,
  rooms,
}: {
  title: string
  arabic: string
  intro: string
  rooms: HubRoom[]
}) {
  return (
    <div className="skin-aware min-h-[100dvh] px-5 pb-28 pt-6" style={{ background: "var(--background)" }}>
      <motion.header
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE }}
      >
        <p className="text-[20px] leading-none" style={{ fontFamily: "var(--font-arabic)", color: "var(--color-terracotta)" }} dir="rtl">
          {arabic}
        </p>
        <h1 className="mt-1 text-[32px] font-extrabold tracking-tight" style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}>
          {title}
        </h1>
        <p className="mt-1 max-w-[40ch] text-[15px]" style={{ fontFamily: "var(--font-serif)", color: "var(--color-ink-soft)" }}>
          {intro}
        </p>
      </motion.header>

      <div className="mt-5 grid gap-3">
        {rooms.map((r, i) => (
          <motion.div
            key={r.href}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: EASE, delay: 0.05 + i * 0.06 }}
          >
            <Link href={r.href}>
              <PosterCard accent={r.accent} interactive className="flex items-center gap-3.5">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-2xl" style={{ background: "var(--color-sand)" }}>
                  {r.emoji}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[16px] font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}>
                    {r.label}
                  </span>
                  <span className="block truncate text-[13px]" style={{ color: "var(--color-ink-soft)" }}>
                    {r.line}
                  </span>
                </span>
                <ChevronRight size={18} style={{ color: "var(--color-ink-soft)" }} />
              </PosterCard>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

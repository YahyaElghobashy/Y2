"use client"

import { motion } from "framer-motion"
import { PenLine } from "lucide-react"

/**
 * LettersView — words, sealed (docs/DESIGN_BLUEPRINT.md §6.4). The most intimate
 * screen: candle-flicker ambient, Fraunces letter bodies, Caveat signatures, a
 * wax seal to send. Presentational.
 */
const hideOnError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  e.currentTarget.style.display = "none"
}

export type Letter = { id: string; from: string; date: string; body: string; signature: string }

export function LettersView({ letters, partnerName = "Yara" }: { letters: Letter[]; partnerName?: string }) {
  return (
    <div className="skin-aware min-h-[100dvh] pb-28" style={{ background: "var(--background)" }}>
      {/* ── Compose hero (candle ambient) ── */}
      <div className="relative h-[180px] overflow-hidden rounded-b-[28px]">
        <video autoPlay muted loop playsInline poster="/assets/video/anim-candle-flicker-poster.webp" className="absolute inset-0 h-full w-full object-cover">
          <source src="/assets/video/anim-candle-flicker.webm" type="video/webm" />
          <source src="/assets/video/anim-candle-flicker.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(42,32,24,0.1) 0%, rgba(42,32,24,0.74) 100%)" }} />
        <div className="absolute inset-x-0 bottom-0 p-5">
          <p className="text-[20px] leading-none" style={{ fontFamily: "var(--font-arabic)", color: "#F2C99B" }}>الرّسائل</p>
          <h1 className="mt-1.5 text-[28px] font-extrabold tracking-tight" style={{ fontFamily: "var(--font-display)", color: "#FFF7EF" }}>Letters</h1>
        </div>
      </div>

      <div className="px-5 pt-5">
        <button
          type="button"
          className="mb-6 flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-[15px] font-bold"
          style={{ background: "var(--color-terracotta)", color: "#FFF7EF", fontFamily: "var(--font-body)", boxShadow: "var(--shadow-glow-copper)" }}
        >
          <PenLine size={18} /> Write {partnerName} this month&apos;s
        </button>

        <div className="grid gap-5">
          {letters.map((l, i) => (
            <motion.article
              key={l.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: i * 0.08 }}
              className="relative texture-parchment overflow-hidden rounded-[18px] p-6"
              style={{ background: "#FFFDF7", border: "1px solid var(--border)", boxShadow: "var(--shadow-warm-lg)" }}
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ fontFamily: "var(--font-nav)", color: "var(--color-ink-faint)" }}>
                {l.date} · from {l.from}
              </p>
              <p className="mt-3 text-[18px] leading-[1.7]" style={{ fontFamily: "var(--font-serif)", color: "var(--color-ink)" }}>
                {l.body}
              </p>
              <p className="mt-4 text-[26px] leading-none" style={{ fontFamily: "var(--font-handwritten)", color: "var(--color-teal-deep)" }}>
                {l.signature}
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/seals/seal-yy-wax.webp" alt="" aria-hidden onError={hideOnError} className="absolute -bottom-3 -right-3 h-16 w-16 rotate-[-10deg] object-contain opacity-90" />
            </motion.article>
          ))}
        </div>
      </div>
    </div>
  )
}

export const LETTERS_MOCK: Letter[] = [
  {
    id: "1",
    from: "Yara",
    date: "June",
    body: "Some months I don't have words, and you let me be quiet. This month I have a few: thank you for the morning you woke up early just to watch me sleep a little longer. I noticed.",
    signature: "— yours, always",
  },
  {
    id: "2",
    from: "You",
    date: "May",
    body: "I keep a list of small things you do. It's getting long. The way you say my name when you're half-asleep is at the top.",
    signature: "— y.",
  },
]

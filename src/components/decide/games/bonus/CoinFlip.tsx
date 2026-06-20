"use client"

import { useEffect, useState } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { Coins } from "lucide-react"
import { weightedPick, winnerSummary } from "../../shared/random"
import { haptic, playDecideSound } from "../../shared/primitives"
import { SubToolFrame, useDecideOnce, type SubToolProps } from "./shared"

const ACCENT = "var(--color-amber)"
const SPINS = 5 // full rotations before landing

/**
 * COIN FLIP — bind two options to heads / tails, then flip a 3D-ish coin that
 * lands on the winning face. Uses the first two options (a coin is binary).
 */
export default function CoinFlip({ options, onResult, onBack }: SubToolProps) {
  const reduce = useReducedMotion()
  const commit = useDecideOnce(onResult)
  const heads = options[0]
  const tails = options[1]
  const [face, setFace] = useState<"heads" | "tails" | null>(null)

  // The hub guarantees >= 2 options; this only guards a direct/degenerate mount.
  useEffect(() => {
    if (options.length >= 2) return
    commit(
      {
        winner: options[0] ?? null,
        summary: winnerSummary(options[0] ?? null),
        detail: { tool: "bonus", subTool: "coin-flip" },
      },
      0,
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function flip() {
    if (face) return
    const winner = weightedPick([heads, tails])
    const landed: "heads" | "tails" = winner?.id === heads.id ? "heads" : "tails"
    playDecideSound("spin")
    haptic([8, 30, 8])
    setFace(landed)
    commit({
      winner,
      summary: winnerSummary(winner),
      detail: {
        tool: "bonus",
        subTool: "coin-flip",
        face: landed,
        heads: heads.label,
        tails: tails.label,
      },
    })
  }

  // Even half-turns show the front (heads); +180° shows the back (tails).
  const targetDeg = face === "tails" ? SPINS * 360 + 180 : SPINS * 360
  const winnerLabel = face === "tails" ? tails.label : face === "heads" ? heads.label : null

  if (options.length < 2) return null

  return (
    <SubToolFrame title="Coin Flip" accent={ACCENT} onBack={onBack}>
      <div className="flex items-center justify-center gap-3">
        {([
          ["Heads", heads.label],
          ["Tails", tails.label],
        ] as const).map(([side, label]) => (
          <div
            key={side}
            className="flex min-w-0 flex-1 flex-col items-center rounded-xl border px-3 py-2 text-center"
            style={{ borderColor: "var(--border)", background: "var(--color-paper)" }}
          >
            <span
              className="text-[11px] font-bold uppercase tracking-wider"
              style={{ fontFamily: "var(--font-nav)", color: "var(--color-ink-soft)" }}
            >
              {side}
            </span>
            <span
              className="max-w-full truncate text-[14px] font-semibold"
              style={{ fontFamily: "var(--font-body)", color: "var(--foreground)" }}
            >
              {label}
            </span>
          </div>
        ))}
      </div>

      {options.length > 2 && (
        <p
          className="-mt-1 text-center text-[12px]"
          style={{ fontFamily: "var(--font-body)", color: "var(--color-ink-soft)" }}
        >
          A coin is binary — this flips the first two options.
        </p>
      )}

      <div className="grid place-items-center py-3" style={{ perspective: 900 }}>
        <motion.div
          className="relative"
          style={{ width: 132, height: 132, transformStyle: "preserve-3d" }}
          animate={{ rotateY: targetDeg }}
          transition={reduce ? { duration: 0 } : { duration: 1, ease: [0.2, 0.85, 0.25, 1] }}
        >
          <CoinFace label={heads.label} background="var(--color-amber)" foreground="var(--color-ink)" />
          <CoinFace
            label={tails.label}
            background="var(--color-clay)"
            foreground="var(--color-ink)"
            style={{ transform: "rotateY(180deg)" }}
          />
        </motion.div>
      </div>

      <div className="min-h-[26px] text-center">
        {winnerLabel && (
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reduce ? { duration: 0 } : undefined}
            className="text-[18px] font-extrabold"
            style={{ fontFamily: "var(--font-display)", color: "var(--color-amber)" }}
          >
            {face === "heads" ? "Heads" : "Tails"} — {winnerLabel}
          </motion.p>
        )}
      </div>

      <motion.button
        type="button"
        onClick={flip}
        disabled={!!face}
        whileTap={{ scale: 0.96 }}
        className="flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-[15px] font-bold disabled:opacity-40"
        style={{ background: ACCENT, color: "var(--color-ink)", fontFamily: "var(--font-nav)" }}
        data-testid="coin-flip-btn"
      >
        <Coins size={18} strokeWidth={2.2} />
        {face ? "Flipping…" : "Flip the coin"}
      </motion.button>
    </SubToolFrame>
  )
}

function CoinFace({
  label,
  background,
  foreground,
  style,
}: {
  label: string
  background: string
  foreground: string
  style?: React.CSSProperties
}) {
  return (
    <div
      className="absolute inset-0 grid place-items-center rounded-full border-2 px-3 text-center"
      style={{
        background,
        color: foreground,
        borderColor: "color-mix(in srgb, var(--color-ink) 18%, transparent)",
        boxShadow: "var(--shadow-warm-md)",
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden",
        ...style,
      }}
    >
      <span className="max-w-full truncate text-[14px] font-extrabold" style={{ fontFamily: "var(--font-display)" }}>
        {label}
      </span>
    </div>
  )
}

"use client"

import { useState } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { Sparkles } from "lucide-react"
import { weightedPick, winnerSummary } from "../../shared/random"
import { haptic, playDecideSound } from "../../shared/primitives"
import { SubToolFrame, useDecideOnce, type SubToolProps } from "./shared"
import type { DecideOption } from "../../contract"

const ACCENT = "var(--color-indigo)"

/** Warm, affirmative flavor — the ball always lands on a real option. */
const FLAVORS = [
  "It is decided.",
  "Without a doubt.",
  "The signs point here.",
  "Fate leans this way.",
  "My heart says this one.",
  "The stars align.",
  "Trust this one.",
  "Yes — go with it.",
]

/**
 * MAGIC 8-BALL — give it a shake and it answers with warm flavor, settling on
 * one of the options. Affirmative energy, never a flat "no".
 */
export default function MagicEightBall({ options, onResult, onBack }: SubToolProps) {
  const reduce = useReducedMotion()
  const commit = useDecideOnce(onResult)
  const [answer, setAnswer] = useState<{ phrase: string; winner: DecideOption | null } | null>(null)

  function ask() {
    if (answer) return
    const winner = weightedPick(options)
    const phrase = FLAVORS[Math.floor(Math.random() * FLAVORS.length)]
    playDecideSound("roll")
    haptic([12, 40, 12, 40, 18])
    setAnswer({ phrase, winner })
    commit({
      winner,
      summary: winnerSummary(winner),
      detail: { tool: "bonus", subTool: "magic-8-ball", phrase },
    })
  }

  return (
    <SubToolFrame title="Magic 8-Ball" accent={ACCENT} onBack={onBack}>
      <div className="grid place-items-center py-2">
        <motion.div
          className="relative grid h-36 w-36 place-items-center rounded-full"
          style={{
            background:
              "radial-gradient(circle at 34% 30%, color-mix(in srgb, var(--color-indigo) 75%, white) 0%, var(--color-indigo) 55%, color-mix(in srgb, var(--color-indigo) 65%, black) 100%)",
            boxShadow: "var(--shadow-warm-lg)",
          }}
          animate={answer && !reduce ? { x: [0, -9, 8, -6, 4, 0], rotate: [0, -3, 3, -2, 1, 0] } : undefined}
          transition={{ duration: 0.55 }}
        >
          {answer ? (
            <motion.div
              key="window"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={reduce ? { duration: 0 } : { delay: 0.35, type: "spring", stiffness: 220, damping: 16 }}
              className="grid h-[88px] w-[88px] place-items-center rounded-full px-2 text-center"
              style={{
                background: "color-mix(in srgb, color-mix(in srgb, var(--color-indigo) 70%, black) 92%, transparent)",
                border: "2px solid color-mix(in srgb, var(--color-amber) 55%, transparent)",
              }}
            >
              <span
                className="text-[11px] font-semibold leading-tight"
                style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", color: "var(--color-amber)" }}
              >
                {answer.phrase}
              </span>
            </motion.div>
          ) : (
            <div
              className="grid h-12 w-12 place-items-center rounded-full"
              style={{ background: "var(--color-paper)", color: "var(--color-indigo)" }}
            >
              <span className="text-[22px] font-black" style={{ fontFamily: "var(--font-display)" }}>
                8
              </span>
            </div>
          )}
        </motion.div>
      </div>

      <div className="min-h-[30px] text-center">
        {answer && (
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reduce ? { duration: 0 } : { delay: 0.5 }}
            className="text-[20px] font-extrabold"
            style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}
          >
            {answer.winner?.label ?? "—"}
          </motion.p>
        )}
      </div>

      <motion.button
        type="button"
        onClick={ask}
        disabled={!!answer}
        whileTap={{ scale: 0.96 }}
        className="flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-[15px] font-bold disabled:opacity-40"
        style={{ background: ACCENT, color: "var(--primary-foreground)", fontFamily: "var(--font-nav)" }}
        data-testid="eightball-ask-btn"
      >
        <Sparkles size={18} strokeWidth={2.2} />
        {answer ? "The ball has spoken" : "Shake the 8-ball"}
      </motion.button>
    </SubToolFrame>
  )
}

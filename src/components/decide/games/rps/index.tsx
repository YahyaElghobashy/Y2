"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import type { DecideResult, SelectorGame, SelectorGameProps } from "../../contract"
import { weightedPick, winnerSummary } from "../../shared/random"
import { haptic, playDecideSound } from "../../shared/primitives"

/**
 * STUB — minimal working "binary" tiebreaker. D3 replaces with real
 * rock-paper-scissors (two-player, best of three). Keep the default export.
 */
function RpsStub({ options, onResult }: SelectorGameProps) {
  const [picked, setPicked] = useState<string | null>(null)

  function run() {
    const winner = weightedPick(options)
    playDecideSound("tick")
    haptic()
    setPicked(winner?.label ?? null)
    const result: DecideResult = {
      winner,
      summary: winnerSummary(winner),
      detail: { tool: "rps", placeholder: true },
    }
    onResult(result)
  }

  return (
    <div className="flex flex-col items-center gap-4 py-2 text-center">
      <span
        className="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider"
        style={{ background: "var(--color-sand)", color: "var(--color-ink-soft)", fontFamily: "var(--font-nav)" }}
      >
        Placeholder · D3 builds the real rock-paper-scissors
      </span>

      <div className="flex flex-wrap justify-center gap-2">
        {options.map((o) => (
          <span
            key={o.id}
            className="rounded-full border px-3 py-1.5 text-[14px]"
            style={{
              borderColor: "var(--border)",
              background: picked === o.label ? "var(--color-amber)" : "transparent",
              color: picked === o.label ? "#2A2018" : "var(--foreground)",
              fontFamily: "var(--font-body)",
            }}
          >
            {o.label}
          </span>
        ))}
      </div>

      {picked && (
        <p
          className="text-[22px] font-extrabold"
          style={{ fontFamily: "var(--font-display)", color: "var(--color-coral)" }}
        >
          {picked}
        </p>
      )}

      <motion.button
        type="button"
        onClick={run}
        disabled={options.length === 0}
        whileTap={{ scale: 0.96 }}
        className="rounded-xl px-6 py-3 text-[15px] font-bold disabled:opacity-40"
        style={{ background: "var(--color-coral)", color: "#FFF7EF", fontFamily: "var(--font-nav)" }}
        data-testid="decide-game-run"
      >
        {picked ? "Best of three again" : "Shoot"}
      </motion.button>
    </div>
  )
}

const rps: SelectorGame = {
  id: "rps",
  label: "Rock Paper Scissors",
  arabicLabel: "حجر ورقة مقص",
  whenToUse: "Just the two of you, one pick — settle it hand to hand.",
  kind: "binary",
  asset: "/assets/objects/object-03.png",
  Component: RpsStub,
}

export default rps

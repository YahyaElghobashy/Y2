"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import type { DecideResult, SelectorGame, SelectorGameProps } from "../../contract"
import { weightedPick, winnerSummary } from "../../shared/random"
import { haptic, playDecideSound } from "../../shared/primitives"

/**
 * STUB — minimal working "weigh" picker. D4 replaces with a real pros/cons
 * board that scores each option and picks the heaviest. The weighted pick here
 * already respects `option.weight`, so it degrades sensibly. Keep the export.
 */
function ProsConsStub({ options, onResult }: SelectorGameProps) {
  const [picked, setPicked] = useState<string | null>(null)

  function run() {
    const winner = weightedPick(options)
    playDecideSound("tick")
    haptic()
    setPicked(winner?.label ?? null)
    const result: DecideResult = {
      winner,
      summary: winnerSummary(winner),
      detail: { tool: "proscons", placeholder: true },
    }
    onResult(result)
  }

  return (
    <div className="flex flex-col items-center gap-4 py-2 text-center">
      <span
        className="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider"
        style={{ background: "var(--color-sand)", color: "var(--color-ink-soft)", fontFamily: "var(--font-nav)" }}
      >
        Placeholder · D4 builds the real pros &amp; cons
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
            {typeof o.weight === "number" && o.weight !== 1 ? ` ·${o.weight}` : ""}
          </span>
        ))}
      </div>

      {picked && (
        <p
          className="text-[22px] font-extrabold"
          style={{ fontFamily: "var(--font-display)", color: "var(--color-teal)" }}
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
        style={{ background: "var(--color-teal)", color: "#FFF7EF", fontFamily: "var(--font-nav)" }}
        data-testid="decide-game-run"
      >
        {picked ? "Weigh again" : "Weigh it"}
      </motion.button>
    </div>
  )
}

const proscons: SelectorGame = {
  id: "proscons",
  label: "Pros & Cons",
  arabicLabel: "إيجابيات وسلبيات",
  whenToUse: "A real decision worth thinking through, not just chance.",
  kind: "weigh",
  asset: "/assets/objects/object-04.png",
  Component: ProsConsStub,
}

export default proscons

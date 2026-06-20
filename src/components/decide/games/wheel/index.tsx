"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import type { DecideResult, SelectorGame, SelectorGameProps } from "../../contract"
import { weightedPick, winnerSummary } from "../../shared/random"
import { haptic, playDecideSound } from "../../shared/primitives"

/**
 * STUB — minimal working "many" picker so the suite runs end-to-end.
 * D1 replaces this whole file with the real spinning wheel (reuse
 * src/components/wheel/SpinTheWheel). Keep the default export shape.
 */
function WheelStub({ options, onResult }: SelectorGameProps) {
  const [picked, setPicked] = useState<string | null>(null)

  function run() {
    const winner = weightedPick(options)
    playDecideSound("spin")
    haptic()
    setPicked(winner?.label ?? null)
    const result: DecideResult = {
      winner,
      summary: winnerSummary(winner),
      detail: { tool: "wheel", placeholder: true },
    }
    onResult(result)
  }

  return (
    <div className="flex flex-col items-center gap-4 py-2 text-center">
      <span
        className="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider"
        style={{ background: "var(--color-sand)", color: "var(--color-ink-soft)", fontFamily: "var(--font-nav)" }}
      >
        Placeholder · D1 builds the real wheel
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
          style={{ fontFamily: "var(--font-display)", color: "var(--color-terracotta)" }}
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
        style={{ background: "var(--color-terracotta)", color: "#FFF7EF", fontFamily: "var(--font-nav)" }}
        data-testid="decide-game-run"
      >
        {picked ? "Spin again" : "Spin"}
      </motion.button>
    </div>
  )
}

const wheel: SelectorGame = {
  id: "wheel",
  label: "Spin the Wheel",
  arabicLabel: "عجلة الحظ",
  whenToUse: "Several options, all roughly equal — let the wheel land on one.",
  kind: "many",
  asset: "/assets/objects/object-01.png",
  Component: WheelStub,
}

export default wheel

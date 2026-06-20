"use client"

import { useEffect, useMemo, useState } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { Hand } from "lucide-react"
import { shuffle, weightedPick, winnerSummary } from "../../shared/random"
import { haptic, playDecideSound } from "../../shared/primitives"
import { SubToolFrame, useDecideOnce, type SubToolProps } from "./shared"
import type { DecideOption } from "../../contract"

const ACCENT = "var(--color-teal)"

type Straw = { option: DecideOption; short: boolean }

/**
 * DRAW STRAWS — one short straw hides among the options. Pull them until it
 * turns up; whoever holds the short straw is chosen. The short straw is decided
 * up front (weighted), so the order you pull in is pure suspense.
 */
export default function DrawStraws({ options, onResult, onBack }: SubToolProps) {
  const reduce = useReducedMotion()
  const commit = useDecideOnce(onResult)
  const straws = useMemo<Straw[]>(() => {
    const chosen = weightedPick(options)
    const arr: Straw[] = options.map((o) => ({ option: o, short: o.id === chosen?.id }))
    return shuffle(arr)
  }, [options])

  const [pulled, setPulled] = useState<Set<number>>(new Set())
  const [done, setDone] = useState(false)

  // The hub guarantees options; this only guards a direct mount with none.
  useEffect(() => {
    if (options.length >= 1) return
    commit(
      { winner: null, summary: winnerSummary(null), detail: { tool: "bonus", subTool: "draw-straws", pulls: 0 } },
      0,
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function pull(i: number) {
    if (done || pulled.has(i)) return
    const straw = straws[i]
    const next = new Set(pulled)
    next.add(i)
    setPulled(next)

    if (straw.short) {
      setDone(true)
      playDecideSound("win")
      haptic([10, 40, 10, 40, 18])
      commit({
        winner: straw.option,
        summary: winnerSummary(straw.option),
        detail: { tool: "bonus", subTool: "draw-straws", pulls: next.size },
      })
    } else {
      playDecideSound("tick")
      haptic(8)
    }
  }

  return (
    <SubToolFrame title="Draw Straws" accent={ACCENT} onBack={onBack}>
      <p
        className="-mt-1 text-center text-[12px]"
        style={{ fontFamily: "var(--font-body)", color: "var(--color-ink-soft)" }}
      >
        {done ? "The short straw is drawn." : "Tap a straw to pull it."}
      </p>

      <div className="flex items-end justify-center gap-2 py-3" style={{ minHeight: 132 }}>
        {straws.map((straw, i) => {
          const revealed = pulled.has(i)
          const isShort = revealed && straw.short
          const fullH = 116
          const shortH = 64
          return (
            <button
              key={straw.option.id}
              type="button"
              onClick={() => pull(i)}
              disabled={done || revealed}
              aria-label={`Pull straw ${i + 1}`}
              className="group flex flex-col items-center justify-end gap-1.5"
              style={{ width: 34 }}
              data-testid={`straw-${i}`}
            >
              <motion.div
                className="w-[14px] rounded-full"
                initial={false}
                animate={{ height: revealed ? (straw.short ? shortH : fullH) : fullH, y: revealed ? -6 : 0 }}
                transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 320, damping: 22 }}
                style={{
                  background: isShort ? "var(--color-terracotta)" : "var(--color-clay)",
                  border: "1px solid color-mix(in srgb, var(--color-ink) 16%, transparent)",
                  boxShadow: revealed ? "var(--shadow-warm-sm)" : "none",
                  opacity: revealed && !straw.short ? 0.55 : 1,
                }}
              />
              <span
                className="h-[16px] max-w-[44px] truncate text-[10px] font-semibold"
                style={{
                  fontFamily: "var(--font-body)",
                  color: isShort ? "var(--color-terracotta)" : "var(--color-ink-soft)",
                }}
              >
                {revealed ? straw.option.label : ""}
              </span>
            </button>
          )
        })}
      </div>

      {done ? (
        <p
          className="text-center text-[18px] font-extrabold"
          style={{ fontFamily: "var(--font-display)", color: ACCENT }}
        >
          {straws.find((s) => s.short)?.option.label}
        </p>
      ) : (
        <div
          className="flex items-center justify-center gap-1.5 text-[13px] font-bold"
          style={{ fontFamily: "var(--font-nav)", color: "var(--color-ink-soft)" }}
        >
          <Hand size={16} strokeWidth={2.2} />
          {options.length - pulled.size} straws left
        </div>
      )}
    </SubToolFrame>
  )
}

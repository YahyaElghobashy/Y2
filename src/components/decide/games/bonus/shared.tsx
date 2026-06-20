"use client"

import { useCallback, useEffect, useRef } from "react"
import { ChevronLeft } from "lucide-react"
import type { DecideOption, DecideResult } from "../../contract"

/**
 * Shared scaffolding for the five "Ask Fate" quick deciders. Each sub-tool is a
 * self-contained picker that receives {options, onResult, onBack}: it animates
 * its own reveal, then commits the result. The hub swaps to its Result panel the
 * instant `onResult` fires (which unmounts the sub-tool), so the dramatic beat
 * MUST play inside the tool before committing — that's what `useDecideOnce`'s
 * delay buys us.
 */

/** How long the in-tool reveal animation gets before the hub takes over. */
export const REVEAL_MS = 1150

export type SubToolProps = {
  options: DecideOption[]
  onResult: (result: DecideResult) => void
  onBack: () => void
}

/**
 * Commit a `DecideResult` exactly once, after a reveal beat. Re-entrant taps are
 * ignored, and a pending commit is cancelled if the tool unmounts first.
 */
export function useDecideOnce(onResult: (result: DecideResult) => void) {
  const done = useRef(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    [],
  )

  return useCallback(
    (result: DecideResult, delay: number = REVEAL_MS) => {
      if (done.current) return
      done.current = true
      timer.current = setTimeout(() => onResult(result), delay)
    },
    [onResult],
  )
}

/** Back-to-menu bar + tool title, shared chrome for every sub-tool. */
export function SubToolFrame({
  title,
  accent,
  onBack,
  children,
}: {
  title: string
  accent: string
  onBack: () => void
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to deciders"
          data-testid="bonus-back"
          className="grid h-8 w-8 place-items-center rounded-full"
          style={{ background: "var(--color-sand)", color: "var(--color-ink-soft)" }}
        >
          <ChevronLeft size={18} strokeWidth={2.2} />
        </button>
        <span
          className="text-[13px] font-bold uppercase tracking-wider"
          style={{ fontFamily: "var(--font-nav)", color: accent }}
        >
          {title}
        </span>
      </div>
      {children}
    </div>
  )
}

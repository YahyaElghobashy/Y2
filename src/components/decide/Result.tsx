"use client"

import { motion } from "framer-motion"
import { RotateCcw } from "lucide-react"
import type { DecideResult, SelectorGame } from "./contract"

const hideOnError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  e.currentTarget.style.display = "none"
}

type ResultProps = {
  result: DecideResult
  game?: SelectorGame
  onReplay?: () => void
  onDone?: () => void
  saved?: boolean
  className?: string
}

/**
 * Result — the "it's decided" panel shown after a game emits its outcome.
 * Stamps a wax seal in, names the winner big, and offers replay / done.
 */
export function Result({ result, game, onReplay, onDone, saved, className }: ResultProps) {
  const winnerLabel = result.winner?.label ?? "—"

  return (
    <div className={className}>
      <div className="flex flex-col items-center gap-3 py-2 text-center">
        <motion.div
          initial={{ scale: 0.4, rotate: -16, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ type: "spring", damping: 12, stiffness: 200 }}
          style={{ width: 64, height: 64 }}
          className="drop-shadow-md"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/seals/seal-yy-wax.webp"
            alt=""
            aria-hidden
            onError={hideOnError}
            className="h-full w-full object-contain"
          />
        </motion.div>

        {game && (
          <span
            className="text-[12px] font-semibold uppercase tracking-[0.18em]"
            style={{ fontFamily: "var(--font-nav)", color: "var(--color-ink-soft)" }}
          >
            {game.label}
          </span>
        )}

        <motion.p
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="text-[34px] font-extrabold leading-tight"
          style={{ fontFamily: "var(--font-display)", color: "var(--color-terracotta)" }}
          data-testid="result-winner"
        >
          {winnerLabel}
        </motion.p>

        <p
          className="text-[15px]"
          style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", color: "var(--color-ink-soft)" }}
        >
          {result.summary}
        </p>

        {saved && (
          <span
            className="text-[12px] font-medium"
            style={{ fontFamily: "var(--font-nav)", color: "var(--color-teal)" }}
            data-testid="result-saved"
          >
            Saved to your history ✦
          </span>
        )}

        <div className="mt-2 flex items-center gap-3">
          {onReplay && (
            <button
              type="button"
              onClick={onReplay}
              className="flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-[14px] font-bold"
              style={{ borderColor: "var(--border)", color: "var(--foreground)", fontFamily: "var(--font-nav)" }}
              data-testid="result-replay"
            >
              <RotateCcw size={16} strokeWidth={2} />
              Again
            </button>
          )}
          {onDone && (
            <button
              type="button"
              onClick={onDone}
              className="rounded-xl px-5 py-2.5 text-[14px] font-bold"
              style={{ background: "var(--color-terracotta)", color: "#FFF7EF", fontFamily: "var(--font-nav)" }}
              data-testid="result-done"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

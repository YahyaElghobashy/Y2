"use client"

import { useState, useCallback, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowLeft, X, Trophy, ChevronDown, ChevronUp } from "lucide-react"
import { useWheel } from "@/lib/hooks/use-wheel"
import { SpinTheWheel } from "@/components/wheel/SpinTheWheel"
import { ModeSelector } from "@/components/wheel/ModeSelector"
import { EliminationTracker } from "@/components/wheel/EliminationTracker"
import { BestOfScoreboard } from "@/components/wheel/BestOfScoreboard"
import { cn } from "@/lib/utils"
import type { WheelMode } from "@/lib/types/wheel.types"

const EASE_OUT: [number, number, number, number] = [0.25, 0.1, 0.25, 1]

export default function WheelSessionPage() {
  const { presetId } = useParams<{ presetId: string }>()
  const router = useRouter()

  const {
    presets,
    activeSession,
    isLoading,
    error,
    startSession,
    spin,
    recordSpin,
    abandonSession,
    completeSession,
    currentSpins,
    remainingItems,
    tally,
    winner,
  } = useWheel()

  const [showLog, setShowLog] = useState(false)

  const preset = useMemo(
    () => presets.find((p) => p.id === presetId) ?? null,
    [presets, presetId]
  )

  const handleModeSelect = useCallback(
    async (mode: WheelMode, bestOfTarget?: number) => {
      await startSession(presetId, mode, bestOfTarget)
    },
    [presetId, startSession]
  )

  const handleResult = useCallback(
    async (label: string, resultIndex: number) => {
      if (!activeSession) return

      await recordSpin({
        resultIndex,
        angle: 0,
        label,
      })

      // Check completion conditions
      if (activeSession.mode === "selection") {
        await completeSession(label)
      } else if (activeSession.mode === "elimination") {
        // After recording, remaining is updated. If only 1 left, that's the winner
        const newRemaining = remainingItems.filter((i) => i.label !== label)
        if (newRemaining.length <= 1 && newRemaining.length > 0) {
          await completeSession(newRemaining[0].label)
        }
      } else if (activeSession.mode === "best_of" && activeSession.best_of_target) {
        const newTally = { ...tally }
        newTally[label] = (newTally[label] ?? 0) + 1
        if (newTally[label] >= activeSession.best_of_target) {
          await completeSession(label)
        }
      }
    },
    [activeSession, recordSpin, completeSession, remainingItems, tally]
  )

  const handleAbandon = useCallback(async () => {
    await abandonSession()
  }, [abandonSession])

  if (isLoading) {
    return (
      <div data-testid="session-loading" className="flex flex-col gap-3 px-5 py-5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-2xl bg-[var(--bg-secondary)]" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div data-testid="session-error" className="px-5 py-5 text-center text-[14px] text-red-500">
        {error}
      </div>
    )
  }

  if (!preset) {
    return (
      <div className="px-5 py-5 text-center text-[14px] text-[var(--text-muted)]">
        Preset not found
      </div>
    )
  }

  // Session complete — winner screen
  if (activeSession?.status === "completed" && winner) {
    return (
      <div data-testid="session-complete" className="flex flex-col items-center gap-5 px-5 py-8">
        <Trophy size={48} className="text-[var(--accent-primary,#C4956A)]" />
        <div className="text-center">
          <p className="text-[13px] text-[var(--text-muted)]">Winner</p>
          <p className="font-display text-[24px] font-bold text-[var(--accent-primary,#C4956A)]">
            {winner}
          </p>
        </div>
        <div className="flex w-full gap-3">
          <motion.button
            data-testid="retry-btn"
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.15, ease: EASE_OUT }}
            onClick={() => router.refresh()}
            className="flex-1 rounded-xl bg-[var(--accent-primary,#C4956A)] py-2.5 text-[14px] font-medium text-white"
          >
            Play Again
          </motion.button>
          <motion.button
            data-testid="back-btn"
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.15, ease: EASE_OUT }}
            onClick={() => router.push("/wheel")}
            className="flex-1 rounded-xl bg-[var(--bg-secondary)] py-2.5 text-[14px] font-medium text-[var(--text-secondary)]"
          >
            Back to Presets
          </motion.button>
        </div>
      </div>
    )
  }

  // No active session — show mode selector
  if (!activeSession) {
    return (
      <div data-testid="session-pre" className="px-5 py-5">
        <div className="mb-4 flex items-center gap-3">
          <button onClick={() => router.push("/wheel")} className="text-[var(--text-muted)]">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-display text-[18px] font-semibold text-[var(--text-primary)]">
            {preset.icon} {preset.name}
          </h1>
        </div>
        <ModeSelector onSelect={handleModeSelect} />
      </div>
    )
  }

  // Active session — live wheel
  return (
    <div data-testid="session-live" className="flex flex-col gap-4 px-5 py-5 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-display text-[16px] font-semibold text-[var(--text-primary)]">
          {preset.icon} {preset.name}
        </h1>
        <button
          data-testid="abandon-btn"
          onClick={handleAbandon}
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--bg-secondary)] text-[var(--text-muted)]"
        >
          <X size={16} />
        </button>
      </div>

      {/* Mode badge */}
      <div className="flex items-center gap-2">
        <span
          data-testid="mode-badge"
          className="rounded-full bg-[var(--accent-soft,#E8D5C0)] px-3 py-1 text-[11px] font-semibold capitalize text-[var(--accent-primary,#C4956A)]"
        >
          {activeSession.mode.replace("_", " ")}
        </span>
        {activeSession.mode === "best_of" && activeSession.best_of_target && (
          <span className="text-[11px] text-[var(--text-muted)]">
            First to {activeSession.best_of_target}
          </span>
        )}
      </div>

      {/* Wheel */}
      <SpinTheWheel
        items={remainingItems}
        onSpin={spin}
        onResult={handleResult}
        state={remainingItems.length < 2 ? "disabled" : "idle"}
      />

      {/* Mode-specific UI */}
      {activeSession.mode === "elimination" && (
        <EliminationTracker
          allItems={preset.items}
          remainingItems={remainingItems}
        />
      )}

      {activeSession.mode === "best_of" && activeSession.best_of_target && (
        <BestOfScoreboard
          tally={tally}
          target={activeSession.best_of_target}
        />
      )}

      {/* Spin log (collapsible) */}
      {currentSpins.length > 0 && (
        <div>
          <button
            data-testid="toggle-log"
            onClick={() => setShowLog(!showLog)}
            className="flex w-full items-center justify-between rounded-xl bg-[var(--bg-secondary)] px-3 py-2 font-nav text-[11px] font-medium uppercase tracking-widest text-[var(--text-secondary)]"
          >
            <span>Spin Log ({currentSpins.length})</span>
            {showLog ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {showLog && (
            <div data-testid="spin-log" className="mt-2 flex flex-col gap-1.5">
              {currentSpins.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-3 rounded-lg bg-[var(--bg-elevated,#FFFFFF)] px-3 py-2 text-[12px]"
                >
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft,#E8D5C0)] font-display text-[11px] font-bold text-[var(--accent-copper,#B87333)]">
                    {s.spin_number}
                  </span>
                  <span className="flex-1 font-medium text-[var(--text-primary)]">
                    {s.result_label}
                  </span>
                  {s.eliminated_item && (
                    <span className="text-[11px] text-red-400 line-through">{s.eliminated_item}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

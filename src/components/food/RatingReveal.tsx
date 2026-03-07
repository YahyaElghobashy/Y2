"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Lock, Unlock, RefreshCcw } from "lucide-react"
import { cn } from "@/lib/utils"
import { PreferenceDot } from "./PreferenceDot"
import { RATING_DIMENSIONS } from "@/lib/types/food-journal.types"
import type { FoodRating, PreferenceDotColor } from "@/lib/types/food-journal.types"

const EASE_OUT: [number, number, number, number] = [0.25, 0.1, 0.25, 1]

const STAGGER_DELAY = 0.3 // seconds between each row
const VIBE_PAUSE = 1000 // ms pause before vibe reveal
const SIMILARITY_THRESHOLD = 0.5

type RatingRevealProps = {
  myRating: FoodRating
  partnerRating: FoodRating
  onClose: () => void
}

export function RatingReveal({
  myRating,
  partnerRating,
  onClose,
}: RatingRevealProps) {
  const [revealPhase, setRevealPhase] = useState<"stagger" | "pause" | "vibe" | "done">("stagger")
  const [visibleRows, setVisibleRows] = useState(0)
  const [vibeRevealed, setVibeRevealed] = useState(false)
  const [animKey, setAnimKey] = useState(0)

  const prefersReducedMotion = useMemo(() => {
    if (typeof window === "undefined") return false
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches
  }, [])

  // Non-vibe dimensions (first 8)
  const mainDimensions = RATING_DIMENSIONS.filter((d) => d.key !== "vibe_score")

  const getPreferenceDot = useCallback(
    (myVal: number, partnerVal: number): PreferenceDotColor => {
      const diff = myVal - partnerVal
      if (Math.abs(diff) <= SIMILARITY_THRESHOLD) return "similar"
      return diff > 0 ? "me" : "partner"
    },
    []
  )

  const getScore = useCallback(
    (rating: FoodRating, key: string): number => {
      return (rating as unknown as Record<string, number>)[key] ?? 0
    },
    []
  )

  const vibeMatch = useMemo(() => {
    const diff = Math.abs(getScore(myRating, "vibe_score") - getScore(partnerRating, "vibe_score"))
    if (diff <= 1) return "You felt the same!"
    if (diff === 2) return "Close!"
    return "Interesting..."
  }, [myRating, partnerRating, getScore])

  // Stagger animation
  useEffect(() => {
    if (prefersReducedMotion) {
      setVisibleRows(8)
      setRevealPhase("done")
      setVibeRevealed(true)
      return
    }

    if (revealPhase !== "stagger") return

    if (visibleRows < mainDimensions.length) {
      const timer = setTimeout(() => {
        setVisibleRows((v) => v + 1)
      }, STAGGER_DELAY * 1000)
      return () => clearTimeout(timer)
    }

    // All 8 rows shown → pause before vibe
    setRevealPhase("pause")
  }, [visibleRows, revealPhase, mainDimensions.length, prefersReducedMotion])

  // Vibe pause
  useEffect(() => {
    if (revealPhase !== "pause") return
    const timer = setTimeout(() => {
      setRevealPhase("vibe")
    }, VIBE_PAUSE)
    return () => clearTimeout(timer)
  }, [revealPhase])

  // Vibe reveal
  useEffect(() => {
    if (revealPhase !== "vibe") return
    const timer = setTimeout(() => {
      setVibeRevealed(true)
      setRevealPhase("done")
    }, 600)
    return () => clearTimeout(timer)
  }, [revealPhase])

  const handleReplay = () => {
    setVisibleRows(0)
    setVibeRevealed(false)
    setRevealPhase("stagger")
    setAnimKey((k) => k + 1)
  }

  return (
    <motion.div
      data-testid="rating-reveal"
      key={animKey}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col bg-[var(--bg-primary,#FBF8F4)] overflow-y-auto"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4">
        <h2 className="text-[18px] font-bold font-display text-[var(--text-primary)]">
          Rating Reveal
        </h2>
        <button
          data-testid="close-reveal"
          onClick={onClose}
          className="text-[13px] font-medium text-[var(--text-secondary)]"
        >
          Close
        </button>
      </div>

      <div className="flex-1 px-5 pb-8">
        {/* Main dimension rows */}
        <div className="flex flex-col gap-3">
          {mainDimensions.map((dim, i) => {
            const myVal = getScore(myRating, dim.key)
            const partnerVal = getScore(partnerRating, dim.key)
            const isVisible = i < visibleRows

            return (
              <AnimatePresence key={dim.key}>
                {isVisible && (
                  <motion.div
                    data-testid={`reveal-row-${dim.key}`}
                    initial={prefersReducedMotion ? false : { opacity: 0, x: -40 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.35, ease: EASE_OUT }}
                    className="flex items-center gap-3"
                  >
                    {/* Label + dot */}
                    <div className="w-20 flex items-center gap-1.5">
                      <PreferenceDot
                        color={getPreferenceDot(myVal, partnerVal)}
                        myScore={myVal}
                        partnerScore={partnerVal}
                      />
                      <span className="text-[12px] text-[var(--text-secondary)] truncate">
                        {dim.label}
                      </span>
                    </div>

                    {/* Score bars */}
                    <div className="flex-1 flex flex-col gap-1">
                      {/* My bar */}
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(myVal / 10) * 100}%` }}
                            transition={{ duration: 0.4, delay: 0.1, ease: EASE_OUT }}
                            className="h-full rounded-full bg-[var(--accent-primary,#C4956A)]"
                          />
                        </div>
                        <span className="w-5 text-end text-[11px] font-medium text-[var(--text-primary)]">
                          {myVal}
                        </span>
                      </div>
                      {/* Partner bar */}
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(partnerVal / 10) * 100}%` }}
                            transition={{ duration: 0.4, delay: 0.2, ease: EASE_OUT }}
                            className="h-full rounded-full bg-[#B5ADA4]"
                          />
                        </div>
                        <span className="w-5 text-end text-[11px] font-medium text-[var(--text-muted)]">
                          {partnerVal}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            )
          })}
        </div>

        {/* Vibe section */}
        {(revealPhase === "vibe" || revealPhase === "done") && (
          <motion.div
            data-testid="vibe-reveal-section"
            initial={prefersReducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="mt-6"
          >
            <div
              className={cn(
                "relative rounded-2xl p-5",
                "bg-gradient-to-br from-[#E85D75]/10 via-[#C4956A]/10 to-[#F5F0E8]"
              )}
            >
              {/* Lock / Unlock icon */}
              <div className="flex justify-center mb-3">
                <div className="relative h-8 w-8">
                  <motion.div
                    data-testid="vibe-lock"
                    animate={{ opacity: vibeRevealed ? 0 : 1 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <Lock size={20} className="text-[var(--text-muted)]" />
                  </motion.div>
                  <motion.div
                    data-testid="vibe-unlock"
                    animate={{ opacity: vibeRevealed ? 1 : 0 }}
                    transition={{ duration: 0.3, delay: 0.15 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <Unlock size={20} className="text-[var(--accent-primary,#C4956A)]" />
                  </motion.div>
                </div>
              </div>

              <h3 className="text-center text-[14px] font-bold font-display text-[var(--text-primary)] mb-3">
                Vibe
              </h3>

              {vibeRevealed ? (
                <motion.div
                  data-testid="vibe-scores"
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col items-center gap-2"
                >
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <span className="text-[10px] text-[var(--text-muted)]">You</span>
                      <p className="text-[22px] font-bold font-display text-[var(--accent-primary,#C4956A)]">
                        {getScore(myRating, "vibe_score")}
                      </p>
                    </div>
                    <PreferenceDot
                      color={getPreferenceDot(
                        getScore(myRating, "vibe_score"),
                        getScore(partnerRating, "vibe_score")
                      )}
                      myScore={getScore(myRating, "vibe_score")}
                      partnerScore={getScore(partnerRating, "vibe_score")}
                    />
                    <div className="text-center">
                      <span className="text-[10px] text-[var(--text-muted)]">Partner</span>
                      <p className="text-[22px] font-bold font-display text-[#B5ADA4]">
                        {getScore(partnerRating, "vibe_score")}
                      </p>
                    </div>
                  </div>
                  <p
                    data-testid="vibe-match-msg"
                    className="text-[13px] font-medium text-[var(--text-secondary)]"
                  >
                    {vibeMatch}
                  </p>
                </motion.div>
              ) : (
                <div className="flex justify-center py-4">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--accent-primary)] border-t-transparent" />
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Overall + actions */}
        {revealPhase === "done" && (
          <motion.div
            data-testid="reveal-footer"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="mt-6 flex flex-col items-center gap-4"
          >
            {/* Overall scores */}
            <div className="flex items-center gap-8">
              <div className="text-center">
                <span className="text-[11px] text-[var(--text-muted)]">Your Overall</span>
                <p
                  data-testid="my-overall"
                  className="text-[28px] font-bold font-display text-[var(--accent-primary,#C4956A)]"
                >
                  {myRating.overall_average?.toFixed(1) ?? "—"}
                </p>
              </div>
              <div className="text-center">
                <span className="text-[11px] text-[var(--text-muted)]">Partner Overall</span>
                <p
                  data-testid="partner-overall"
                  className="text-[28px] font-bold font-display text-[#B5ADA4]"
                >
                  {partnerRating.overall_average?.toFixed(1) ?? "—"}
                </p>
              </div>
            </div>

            {/* Replay */}
            <button
              data-testid="replay-btn"
              onClick={handleReplay}
              className="flex items-center gap-2 text-[13px] font-medium text-[var(--text-secondary)]"
            >
              <RefreshCcw size={14} />
              Replay
            </button>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

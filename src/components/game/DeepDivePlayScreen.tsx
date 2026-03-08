"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Pause, Loader2, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/providers/AuthProvider"
import { useGameEngine } from "@/lib/hooks/use-game-engine"
import { CATEGORY_META } from "@/lib/types/game.types"

// ─── Claymorphism helpers ───
const clay = {
  card: "rounded-[20px] border border-white/60 bg-white/80 backdrop-blur-sm",
  shadow: "shadow-[0_4px_16px_rgba(44,40,37,0.08),0_1px_4px_rgba(44,40,37,0.04)]",
  shadowLg: "shadow-[0_8px_32px_rgba(44,40,37,0.10),0_2px_8px_rgba(44,40,37,0.05)]",
  pressed: "active:shadow-[0_1px_4px_rgba(44,40,37,0.06)] active:translate-y-[1px]",
}

const difficultyMeta = {
  light: { emoji: "☀️", label: "Light", color: "#6B9B6B" },
  medium: { emoji: "🌤️", label: "Medium", color: "#D4A040" },
  deep: { emoji: "🌊", label: "Deep", color: "#3A7B94" },
} as const

export function DeepDivePlayScreen() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session") ?? undefined
  const { user, partner } = useAuth()

  const {
    session,
    rounds,
    currentRound,
    currentRoundIndex,
    isLoading,
    error,
    submitJournal,
    nextRound,
    pauseSession,
    completeSession,
  } = useGameEngine(sessionId)

  const [journalText, setJournalText] = useState("")
  const [showJournal, setShowJournal] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showPauseMenu, setShowPauseMenu] = useState(false)

  const question = currentRound?.question ?? null
  const totalRounds = rounds.length
  const progress = totalRounds > 0 ? ((currentRoundIndex + 1) / totalRounds) * 100 : 0
  const isLastRound = currentRoundIndex >= totalRounds - 1
  const difficulty = question?.difficulty ?? "light"
  const diffMeta = difficultyMeta[difficulty]
  const category = question?.category
  const categoryMeta = category ? CATEGORY_META[category] : null

  // Reset journal per round
  useEffect(() => {
    setJournalText("")
    setShowJournal(false)
  }, [currentRoundIndex])

  const handleNext = useCallback(async () => {
    // Save journal if written
    if (journalText.trim()) {
      setIsSaving(true)
      await submitJournal(journalText.trim())
      setIsSaving(false)
    }

    if (isLastRound) {
      await completeSession()
      router.push(`/game/deep-dive/complete?session=${sessionId}`)
    } else {
      nextRound()
    }
  }, [journalText, isLastRound, completeSession, router, sessionId, nextRound, submitJournal])

  const handlePause = async () => {
    if (journalText.trim()) {
      await submitJournal(journalText.trim())
    }
    await pauseSession()
    router.push("/game")
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(180deg, #FBF8F4 0%, #EFF5F0 100%)" }}>
        <motion.div className="flex flex-col items-center gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Loader2 className="w-8 h-8 text-[#7EC8E3] animate-spin" />
          <p className="text-sm text-[#8C8279]">Preparing your deep dive...</p>
        </motion.div>
      </div>
    )
  }

  if (error || !question) {
    return (
      <div className="min-h-screen flex items-center justify-center px-5" style={{ background: "linear-gradient(180deg, #FBF8F4 0%, #EFF5F0 100%)" }}>
        <div className={cn(clay.card, clay.shadow, "p-6 text-center")}>
          <p className="text-sm text-[#C75050] mb-3">{error ?? "No questions found."}</p>
          <button className="text-sm font-medium text-[#3A7B94]" onClick={() => router.push("/game")}>
            Back to Games
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen pb-8"
      style={{ background: "linear-gradient(180deg, #FBF8F4 0%, #EEF5F2 50%, #F0EBE3 100%)" }}
    >
      {/* Top Bar */}
      <div className="px-5 pt-4 pb-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-[#8C8279]">
            {currentRoundIndex + 1} of {totalRounds}
          </span>
          <motion.button
            className="w-8 h-8 rounded-full bg-white/70 border border-white/80 flex items-center justify-center shadow-sm"
            whileTap={{ scale: 0.92 }}
            onClick={() => setShowPauseMenu(true)}
          >
            <Pause size={14} className="text-[#8C8279]" />
          </motion.button>
        </div>

        {/* Thin progress bar */}
        <div className="h-1 rounded-full bg-[#E5D9CB]/60 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: "#7EC8E3" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div className="px-5 mt-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={`q-${currentRoundIndex}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-5"
          >
            {/* Category + Difficulty badges */}
            <div className="flex items-center justify-center gap-2">
              {categoryMeta && (
                <span className="text-xs font-medium px-3 py-1 rounded-full bg-[#7EC8E3]/10 text-[#3A7B94]">
                  {categoryMeta.emoji} {categoryMeta.label}
                </span>
              )}
              <span
                className="text-xs font-medium px-3 py-1 rounded-full"
                style={{ backgroundColor: `${diffMeta.color}15`, color: diffMeta.color }}
              >
                {diffMeta.emoji} {diffMeta.label}
              </span>
            </div>

            {/* Question text — large, centered, calm */}
            <motion.h2
              className="text-[22px] font-bold text-[#2C2825] text-center leading-relaxed px-2"
              style={{ fontFamily: "'Playfair Display', serif" }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              {question.text}
            </motion.h2>

            {/* Gentle instruction */}
            <motion.p
              className="text-center text-sm text-[#B5ADA4] italic"
              style={{ fontFamily: "'Caveat', cursive", fontSize: "16px" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Take your time. Discuss. When you&apos;re ready, move on.
            </motion.p>

            {/* Optional Journal */}
            <motion.div
              className={cn(clay.card, clay.shadow, "overflow-hidden")}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <button
                className="w-full px-5 py-3.5 flex items-center justify-between"
                onClick={() => setShowJournal(!showJournal)}
              >
                <span className="text-sm font-medium text-[#3A7B94]">
                  ✍️ Want to write something?
                </span>
                {showJournal ? (
                  <ChevronUp size={16} className="text-[#8C8279]" />
                ) : (
                  <ChevronDown size={16} className="text-[#8C8279]" />
                )}
              </button>

              <AnimatePresence>
                {showJournal && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-4">
                      <textarea
                        className="w-full h-28 resize-none rounded-xl bg-[#FBF8F4] border border-[#E5D9CB] px-4 py-3 text-sm text-[#2C2825] placeholder:text-[#B5ADA4] focus:outline-none focus:border-[#7EC8E3]/50 transition-colors"
                        placeholder="Write your thoughts here... This is just for you."
                        value={journalText}
                        onChange={e => setJournalText(e.target.value)}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Next button */}
            <motion.div
              className="pt-4 flex justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <motion.button
                className="px-10 py-3.5 rounded-full bg-[#3A7B94] text-white font-semibold text-sm shadow-[0_4px_16px_rgba(58,123,148,0.25)]"
                whileTap={{ scale: 0.97 }}
                onClick={handleNext}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : isLastRound ? "Finish Deep Dive 🌊" : "Next →"}
              </motion.button>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Pause Menu Overlay */}
      <AnimatePresence>
        {showPauseMenu && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className={cn(clay.card, clay.shadowLg, "p-6 mx-5 w-full max-w-sm space-y-4")}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <h3
                className="text-lg font-bold text-[#2C2825] text-center"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Pause Deep Dive?
              </h3>
              <p className="text-sm text-[#8C8279] text-center">
                Your journals are saved. Resume anytime.
              </p>
              <div className="space-y-2">
                <button
                  className="w-full py-3 rounded-full bg-[#3A7B94] text-white font-semibold text-sm"
                  onClick={handlePause}
                >
                  Pause & Save
                </button>
                <button
                  className="w-full py-3 rounded-full bg-white border border-[#E5D9CB] text-[#8C8279] font-medium text-sm"
                  onClick={() => setShowPauseMenu(false)}
                >
                  Continue Exploring
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

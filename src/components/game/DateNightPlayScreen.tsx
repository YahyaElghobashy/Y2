"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Pause, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/providers/AuthProvider"
import { useGameEngine } from "@/lib/hooks/use-game-engine"
import { GameCard } from "./GameCard"
import { DareCard } from "./DareCard"
import { TruthCard } from "./TruthCard"

// ─── Claymorphism helpers ───
const clay = {
  card: "rounded-[20px] border border-white/60 bg-white/80 backdrop-blur-sm",
  shadow: "shadow-[0_4px_16px_rgba(44,40,37,0.08),0_1px_4px_rgba(44,40,37,0.04)]",
  shadowLg: "shadow-[0_8px_32px_rgba(44,40,37,0.10),0_2px_8px_rgba(44,40,37,0.05)]",
}

type RoundPhase = "face_down" | "truth_or_dare_choice" | "truth_reveal" | "question_reveal" | "dare_reveal" | "done"

export function DateNightPlayScreen() {
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
    submitAnswer,
    submitJournal,
    completeDare,
    skipDare,
    nextRound,
    pauseSession,
    completeSession,
  } = useGameEngine(sessionId)

  const [phase, setPhase] = useState<RoundPhase>("face_down")
  const [showPauseMenu, setShowPauseMenu] = useState(false)

  const isPlayer1 = session?.created_by === user?.id
  const partnerName = partner?.display_name ?? "Partner"
  const round = currentRound?.round ?? null
  const question = currentRound?.question ?? null
  const dare = currentRound?.dare ?? null
  const custom = currentRound?.customContent ?? null
  const isPartnerAuthored = currentRound?.isPartnerAuthored ?? false
  const authorName = currentRound?.authorName ?? null
  const roundType = round?.round_type ?? "question"

  const totalRounds = rounds.length
  const progress = totalRounds > 0 ? ((currentRoundIndex + 1) / totalRounds) * 100 : 0
  const isLastRound = currentRoundIndex >= totalRounds - 1

  // Scoreboard
  const myScore = isPlayer1 ? (session?.player1_score ?? 0) : (session?.player2_score ?? 0)
  const partnerScore = isPlayer1 ? (session?.player2_score ?? 0) : (session?.player1_score ?? 0)

  // Reset phase on round change
  useEffect(() => {
    setPhase("face_down")
  }, [currentRoundIndex])

  // Handle card tap (face down → reveal or choice)
  const handleCardTap = useCallback(() => {
    if (roundType === "truth_or_dare") {
      setPhase("truth_or_dare_choice")
    } else if (roundType === "dare" || dare || (custom?.content_type === "dare")) {
      setPhase("dare_reveal")
    } else {
      setPhase("question_reveal")
    }
  }, [roundType, dare, custom])

  // Truth or Dare choice
  const handleChooseTruth = () => setPhase("truth_reveal")
  const handleChooseDare = () => setPhase("dare_reveal")

  // Handle dare actions
  const handleDareComplete = async () => {
    await completeDare()
    setPhase("done")
  }

  const handleDareSkip = async () => {
    await skipDare()
    setPhase("done")
  }

  // Handle next round
  const handleNext = useCallback(async () => {
    if (isLastRound) {
      await completeSession()
      router.push(`/game/date-night/complete?session=${sessionId}`)
    } else {
      nextRound()
    }
  }, [isLastRound, completeSession, router, sessionId, nextRound])

  // Handle truth response save
  const handleTruthResponse = async (text: string) => {
    await submitJournal(text)
  }

  const handlePause = async () => {
    await pauseSession()
    router.push("/game")
  }

  // Loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1C1A18]">
        <motion.div className="flex flex-col items-center gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Loader2 className="w-8 h-8 text-[#F4A8B8] animate-spin" />
          <p className="text-sm text-white/50">Setting up game night...</p>
        </motion.div>
      </div>
    )
  }

  if (error || !round) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1C1A18] px-5">
        <div className={cn(clay.card, clay.shadow, "p-6 text-center")}>
          <p className="text-sm text-[#C75050] mb-3">{error ?? "No rounds found."}</p>
          <button className="text-sm font-medium text-[#F4A8B8]" onClick={() => router.push("/game")}>
            Back to Games
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#1C1A18] pb-8">
      {/* Top Bar: Scoreboard + Progress */}
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          {/* My score */}
          <div className="flex items-center gap-1.5">
            <span className="w-7 h-7 rounded-full bg-[#B87333] flex items-center justify-center text-[10px] font-bold text-white">
              {user?.user_metadata?.display_name?.[0] ?? "Y"}
            </span>
            <span className="text-sm font-bold text-white">{myScore}</span>
            <span className="text-[10px] text-white/40">🪙</span>
          </div>

          {/* Round counter */}
          <span className="text-xs text-white/40">
            {currentRoundIndex + 1} / {totalRounds}
          </span>

          {/* Partner score */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-white/40">🪙</span>
            <span className="text-sm font-bold text-white">{partnerScore}</span>
            <span className="w-7 h-7 rounded-full bg-[#7EC8E3] flex items-center justify-center text-[10px] font-bold text-white">
              {partnerName[0]}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 rounded-full bg-white/10 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-[#F4A8B8]"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Pause button */}
        <div className="flex justify-end mt-2">
          <motion.button
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
            whileTap={{ scale: 0.92 }}
            onClick={() => setShowPauseMenu(true)}
          >
            <Pause size={14} className="text-white/60" />
          </motion.button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="px-5 mt-2">
        <AnimatePresence mode="wait">
          {/* FACE DOWN — card to tap */}
          {phase === "face_down" && (
            <motion.div
              key={`facedown-${currentRoundIndex}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="max-w-xs mx-auto"
            >
              {(roundType === "dare" || (dare && !question)) ? (
                <DareCard
                  dare={dare}
                  customContent={custom}
                  isPartnerAuthored={isPartnerAuthored}
                  authorName={authorName}
                  isRevealed={false}
                  onFlip={handleCardTap}
                  onComplete={handleDareComplete}
                  onSkip={handleDareSkip}
                />
              ) : (
                <GameCard
                  question={question}
                  customContent={custom}
                  isPartnerAuthored={isPartnerAuthored}
                  authorName={authorName}
                  isRevealed={false}
                  onFlip={handleCardTap}
                />
              )}
            </motion.div>
          )}

          {/* TRUTH OR DARE CHOICE */}
          {phase === "truth_or_dare_choice" && (
            <motion.div
              key="tod-choice"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              className="space-y-4"
            >
              <h2
                className="text-xl font-bold text-white text-center"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Truth or Dare?
              </h2>
              <p className="text-sm text-white/40 text-center mb-6">
                Truth is safe but scoreless. Dare earns CoYYns.
              </p>

              <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto">
                {/* Truth card */}
                <motion.button
                  className="aspect-[3/4] rounded-[24px] border-2 border-white/20 bg-gradient-to-br from-white/10 to-white/5 flex flex-col items-center justify-center"
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ borderColor: "rgba(255,255,255,0.4)" }}
                  onClick={handleChooseTruth}
                >
                  <span className="text-4xl mb-2">🪞</span>
                  <span className="text-sm font-bold text-white">Truth</span>
                  <span className="text-[10px] text-white/40 mt-1">0 🪙</span>
                </motion.button>

                {/* Dare card */}
                <motion.button
                  className="aspect-[3/4] rounded-[24px] border-2 border-[#F4A8B8]/30 bg-gradient-to-br from-[#F4A8B8]/15 to-[#F4A8B8]/5 flex flex-col items-center justify-center"
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ borderColor: "rgba(244,168,184,0.5)" }}
                  onClick={handleChooseDare}
                >
                  <span className="text-4xl mb-2">⚡</span>
                  <span className="text-sm font-bold text-white">Dare</span>
                  <span className="text-[10px] text-[#F4A8B8] mt-1">+🪙 / -🪙</span>
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* TRUTH REVEAL */}
          {phase === "truth_reveal" && (
            <motion.div
              key={`truth-${currentRoundIndex}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <TruthCard
                question={question}
                customContent={custom}
                isPartnerAuthored={isPartnerAuthored}
                authorName={authorName}
                onNext={handleNext}
                onSaveResponse={handleTruthResponse}
              />
            </motion.div>
          )}

          {/* QUESTION REVEAL (non-truth-or-dare) */}
          {phase === "question_reveal" && (
            <motion.div
              key={`question-${currentRoundIndex}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-xs mx-auto space-y-4"
            >
              <GameCard
                question={question}
                customContent={custom}
                isPartnerAuthored={isPartnerAuthored}
                authorName={authorName}
                isRevealed={true}
                onFlip={() => {}}
              />
              <div className="flex justify-center pt-2">
                <motion.button
                  className="px-10 py-3.5 rounded-full bg-[#F4A8B8] text-white font-semibold text-sm shadow-[0_4px_16px_rgba(244,168,184,0.30)]"
                  whileTap={{ scale: 0.97 }}
                  onClick={handleNext}
                >
                  Next →
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* DARE REVEAL */}
          {phase === "dare_reveal" && (
            <motion.div
              key={`dare-${currentRoundIndex}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-xs mx-auto space-y-4"
            >
              <DareCard
                dare={dare}
                customContent={custom}
                isPartnerAuthored={isPartnerAuthored}
                authorName={authorName}
                isRevealed={true}
                onFlip={() => {}}
                onComplete={handleDareComplete}
                onSkip={handleDareSkip}
                isCompleted={round.dare_completed === true}
                isSkipped={round.dare_completed === false && round.is_skipped}
              />
              {(round.dare_completed !== null || round.is_skipped) && (
                <div className="flex justify-center pt-2">
                  <motion.button
                    className="px-10 py-3.5 rounded-full bg-[#F4A8B8] text-white font-semibold text-sm shadow-[0_4px_16px_rgba(244,168,184,0.30)]"
                    whileTap={{ scale: 0.97 }}
                    onClick={handleNext}
                  >
                    Next →
                  </motion.button>
                </div>
              )}
            </motion.div>
          )}

          {/* DONE — after dare complete/skip, auto-moves to next */}
          {phase === "done" && (
            <motion.div
              key={`done-${currentRoundIndex}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center py-8"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <span className="text-5xl">
                  {round.dare_completed ? "🎉" : "👋"}
                </span>
              </motion.div>
              <p className="text-sm text-white/60 mt-3">
                {round.dare_completed ? "Nice work!" : "On to the next one!"}
              </p>
              <motion.button
                className="mt-6 px-10 py-3.5 rounded-full bg-[#F4A8B8] text-white font-semibold text-sm"
                whileTap={{ scale: 0.97 }}
                onClick={handleNext}
              >
                {isLastRound ? "Finish Game 🎲" : "Next Card →"}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Pause Menu */}
      <AnimatePresence>
        {showPauseMenu && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
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
              <h3 className="text-lg font-bold text-[#2C2825] text-center" style={{ fontFamily: "'Playfair Display', serif" }}>
                Pause Game?
              </h3>
              <div className="text-center text-sm text-[#8C8279] space-y-1">
                <p>Your scores are saved.</p>
                <p className="text-xs">You: {myScore} 🪙 • {partnerName}: {partnerScore} 🪙</p>
              </div>
              <div className="space-y-2">
                <button className="w-full py-3 rounded-full bg-[#F4A8B8] text-white font-semibold text-sm" onClick={handlePause}>
                  Pause & Save
                </button>
                <button className="w-full py-3 rounded-full bg-white border border-[#E5D9CB] text-[#8C8279] font-medium text-sm" onClick={() => setShowPauseMenu(false)}>
                  Keep Playing
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

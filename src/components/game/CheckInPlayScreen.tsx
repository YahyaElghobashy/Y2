"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Pause, X, ChevronRight, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/providers/AuthProvider"
import { useGameEngine } from "@/lib/hooks/use-game-engine"
import { AlignmentReveal } from "./AlignmentReveal"
import { CATEGORY_META } from "@/lib/types/game.types"
import type { AnswerValue, QuestionBankRow, AnswerHistoryRow } from "@/lib/types/game.types"

// ─── Claymorphism helpers ───
const clay = {
  card: "rounded-[20px] border border-white/60 bg-white/80 backdrop-blur-sm",
  shadow: "shadow-[0_4px_16px_rgba(44,40,37,0.08),0_1px_4px_rgba(44,40,37,0.04)]",
  shadowLg: "shadow-[0_8px_32px_rgba(44,40,37,0.10),0_2px_8px_rgba(44,40,37,0.05)]",
  pressed: "active:shadow-[0_1px_4px_rgba(44,40,37,0.06)] active:translate-y-[1px]",
}

type PlayPhase = "answering" | "waiting" | "reveal" | "summary"

export function CheckInPlayScreen() {
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
    nextRound,
    pauseSession,
    completeSession,
    isWaitingForPartner,
    partnerHasAnswered,
    getAnswerHistory,
  } = useGameEngine(sessionId)

  const [phase, setPhase] = useState<PlayPhase>("answering")
  const [scaleValue, setScaleValue] = useState(5)
  const [textValue, setTextValue] = useState("")
  const [choiceValue, setChoiceValue] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [answerHistory, setAnswerHistory] = useState<AnswerHistoryRow[]>([])
  const [showPauseMenu, setShowPauseMenu] = useState(false)

  const isPlayer1 = session?.created_by === user?.id
  const myName = user?.user_metadata?.display_name ?? "You"
  const partnerName = partner?.display_name ?? "Partner"

  const question = currentRound?.question ?? null
  const round = currentRound?.round ?? null
  const answerType = question?.answer_type ?? "open"

  // Total progress
  const totalRounds = rounds.length
  const progress = totalRounds > 0 ? ((currentRoundIndex + 1) / totalRounds) * 100 : 0
  const isLastRound = currentRoundIndex >= totalRounds - 1

  // Load answer history when question changes
  useEffect(() => {
    if (question?.id) {
      getAnswerHistory(question.id).then(setAnswerHistory)
    }
  }, [question?.id, getAnswerHistory])

  // Reset input values when moving to a new round
  useEffect(() => {
    setScaleValue(5)
    setTextValue("")
    setChoiceValue(null)
    setPhase("answering")
  }, [currentRoundIndex])

  // Detect when both answered → move to reveal
  useEffect(() => {
    if (round?.both_answered && phase === "waiting") {
      setPhase("reveal")
    }
  }, [round?.both_answered, phase])

  // Detect when partner has answered while we're waiting
  useEffect(() => {
    if (partnerHasAnswered && phase === "waiting") {
      setPhase("reveal")
    }
  }, [partnerHasAnswered, phase])

  // Submit current answer
  const handleSubmit = useCallback(async () => {
    if (!round || isSubmitting) return
    setIsSubmitting(true)

    let answer: AnswerValue
    switch (answerType) {
      case "scale_1_10":
        answer = { value: scaleValue }
        break
      case "open":
        if (!textValue.trim()) { setIsSubmitting(false); return }
        answer = { text: textValue.trim() }
        break
      case "yes_no":
      case "multiple_choice":
        if (!choiceValue) { setIsSubmitting(false); return }
        answer = { choice: choiceValue }
        break
      default:
        answer = { text: textValue.trim() || "—" }
    }

    await submitAnswer(answer)
    setIsSubmitting(false)

    // Check if partner already answered
    const partnerField = isPlayer1 ? round.player2_answer : round.player1_answer
    if (partnerField) {
      setPhase("reveal")
    } else {
      setPhase("waiting")
    }
  }, [round, answerType, scaleValue, textValue, choiceValue, isSubmitting, isPlayer1, submitAnswer])

  // Handle next round or complete
  const handleNext = useCallback(async () => {
    if (isLastRound) {
      await completeSession()
      router.push(`/game/check-in/complete?session=${sessionId}`)
    } else {
      nextRound()
    }
  }, [isLastRound, completeSession, router, sessionId, nextRound])

  // Handle pause
  const handlePause = async () => {
    await pauseSession()
    router.push("/game")
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(180deg, #FBF8F4 0%, #F0EBE3 100%)" }}>
        <motion.div
          className="flex flex-col items-center gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Loader2 className="w-8 h-8 text-[#A8B5A0] animate-spin" />
          <p className="text-sm text-[#8C8279]">Loading check-in...</p>
        </motion.div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-5" style={{ background: "linear-gradient(180deg, #FBF8F4 0%, #F0EBE3 100%)" }}>
        <div className={cn(clay.card, clay.shadow, "p-6 text-center")}>
          <p className="text-sm text-[#C75050] mb-3">{error}</p>
          <button
            className="text-sm font-medium text-[#5C6B56]"
            onClick={() => router.push("/game")}
          >
            Back to Games
          </button>
        </div>
      </div>
    )
  }

  // No rounds loaded
  if (!round || !question) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(180deg, #FBF8F4 0%, #F0EBE3 100%)" }}>
        <p className="text-sm text-[#8C8279]">No questions found for this session.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-8" style={{ background: "linear-gradient(180deg, #FBF8F4 0%, #F0EBE3 100%)" }}>
      {/* Top Bar: Progress + Pause */}
      <div className="px-5 pt-4 pb-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-[#8C8279]">
            Question {currentRoundIndex + 1} of {totalRounds}
          </span>
          <div className="flex items-center gap-2">
            <motion.button
              className="w-8 h-8 rounded-full bg-white/70 border border-white/80 flex items-center justify-center shadow-sm"
              whileTap={{ scale: 0.92 }}
              onClick={() => setShowPauseMenu(true)}
            >
              <Pause size={14} className="text-[#8C8279]" />
            </motion.button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 rounded-full bg-[#E5D9CB] overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-[#A8B5A0]"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="px-5 mt-4">
        <AnimatePresence mode="wait">
          {/* ANSWERING PHASE */}
          {phase === "answering" && (
            <motion.div
              key={`answer-${currentRoundIndex}`}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Category badge */}
              {question.category && (
                <div className="flex justify-center">
                  <span className="text-xs font-medium px-3 py-1 rounded-full bg-[#A8B5A0]/15 text-[#5C6B56]">
                    {CATEGORY_META[question.category]?.emoji} {CATEGORY_META[question.category]?.label}
                  </span>
                </div>
              )}

              {/* Question */}
              <h2
                className="text-xl font-bold text-[#2C2825] text-center leading-relaxed px-2"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {question.text}
              </h2>

              {/* Answer input */}
              <div className={cn(clay.card, clay.shadow, "p-5")}>
                {answerType === "scale_1_10" && (
                  <ScaleInput value={scaleValue} onChange={setScaleValue} />
                )}
                {answerType === "open" && (
                  <TextInput value={textValue} onChange={setTextValue} />
                )}
                {answerType === "yes_no" && (
                  <YesNoInput value={choiceValue} onChange={setChoiceValue} />
                )}
                {answerType === "multiple_choice" && (
                  <ChoiceInput
                    value={choiceValue}
                    onChange={setChoiceValue}
                    options={question.answer_options ?? []}
                  />
                )}
              </div>

              {/* Lock In button */}
              <motion.button
                className={cn(
                  "w-full py-4 rounded-full text-base font-bold transition-all duration-200",
                  "bg-[#5C6B56] text-white shadow-[0_4px_20px_rgba(92,107,86,0.25)]",
                )}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Lock In ✓"}
              </motion.button>
            </motion.div>
          )}

          {/* WAITING PHASE */}
          {phase === "waiting" && (
            <motion.div
              key="waiting"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center justify-center py-16 space-y-6"
            >
              {/* Confirmed answer */}
              <motion.div
                className={cn(clay.card, clay.shadow, "px-5 py-3")}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <p className="text-sm text-[#5C6B56] font-medium">
                  ✓ Your answer locked in
                </p>
              </motion.div>

              {/* Partner waiting */}
              <div className="flex flex-col items-center gap-3">
                <motion.div
                  className="w-16 h-16 rounded-full bg-[#7EC8E3]/20 flex items-center justify-center"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <span className="text-2xl">
                    {partner?.avatar_url ? "👤" : "💙"}
                  </span>
                </motion.div>
                <p className="text-sm text-[#8C8279]">
                  Waiting for {partnerName}...
                </p>
              </div>
            </motion.div>
          )}

          {/* REVEAL PHASE */}
          {phase === "reveal" && (
            <motion.div
              key={`reveal-${currentRoundIndex}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="py-4"
            >
              <AlignmentReveal
                round={round}
                question={question}
                myName={myName}
                partnerName={partnerName}
                isPlayer1={isPlayer1}
                answerHistory={answerHistory}
                onNext={handleNext}
              />
            </motion.div>
          )}
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
                Pause Check-In?
              </h3>
              <p className="text-sm text-[#8C8279] text-center">
                You can resume where you left off anytime.
              </p>
              <div className="space-y-2">
                <button
                  className="w-full py-3 rounded-full bg-[#D4A040] text-white font-semibold text-sm"
                  onClick={handlePause}
                >
                  Pause & Save
                </button>
                <button
                  className="w-full py-3 rounded-full bg-white border border-[#E5D9CB] text-[#8C8279] font-medium text-sm"
                  onClick={() => setShowPauseMenu(false)}
                >
                  Continue Playing
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Scale Input (1-10 slider) ───

function ScaleInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  // Gradient track: red(1) → yellow(5) → green(10)
  const percentage = ((value - 1) / 9) * 100

  return (
    <div className="space-y-4">
      <div className="text-center">
        <motion.span
          key={value}
          className="text-4xl font-bold text-[#5C6B56]"
          initial={{ scale: 0.8, opacity: 0.5 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
        >
          {value}
        </motion.span>
      </div>

      <div className="relative py-2">
        <input
          type="range"
          min={1}
          max={10}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="w-full h-3 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #C75050 0%, #D4A040 50%, #6B9B6B 100%)`,
          }}
        />
        <div className="flex justify-between mt-2 px-1">
          <span className="text-[10px] text-[#B5ADA4]">Disagree</span>
          <span className="text-[10px] text-[#B5ADA4]">Neutral</span>
          <span className="text-[10px] text-[#B5ADA4]">Agree</span>
        </div>
      </div>
    </div>
  )
}

// ─── Text Input ───

function TextInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <textarea
        className="w-full h-28 resize-none rounded-xl bg-[#FBF8F4] border border-[#E5D9CB] px-4 py-3 text-sm text-[#2C2825] placeholder:text-[#B5ADA4] focus:outline-none focus:border-[#A8B5A0] transition-colors"
        placeholder="Share your thoughts..."
        value={value}
        onChange={e => onChange(e.target.value)}
      />
      <p className="text-[10px] text-[#B5ADA4] mt-1 text-end">{value.length}/500</p>
    </div>
  )
}

// ─── Yes/No Input ───

function YesNoInput({ value, onChange }: { value: string | null; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-3">
      {["Yes", "No"].map(option => (
        <motion.button
          key={option}
          className={cn(
            "flex-1 py-4 rounded-2xl text-base font-bold transition-all duration-200 border",
            value === option
              ? "bg-[#A8B5A0]/20 border-[#5C6B56]/40 text-[#5C6B56]"
              : "bg-white/50 border-white/60 text-[#8C8279]",
          )}
          whileTap={{ scale: 0.97 }}
          onClick={() => onChange(option)}
        >
          {option === "Yes" ? "👍" : "👎"} {option}
        </motion.button>
      ))}
    </div>
  )
}

// ─── Multiple Choice Input ───

function ChoiceInput({
  value,
  onChange,
  options,
}: {
  value: string | null
  onChange: (v: string) => void
  options: string[]
}) {
  return (
    <div className="space-y-2">
      {options.map(option => (
        <motion.button
          key={option}
          className={cn(
            "w-full py-3 px-4 rounded-xl text-sm font-medium text-start transition-all duration-200 border",
            value === option
              ? "bg-[#A8B5A0]/20 border-[#5C6B56]/40 text-[#5C6B56]"
              : "bg-white/50 border-white/60 text-[#2C2825]",
          )}
          whileTap={{ scale: 0.98 }}
          onClick={() => onChange(option)}
        >
          {option}
        </motion.button>
      ))}
    </div>
  )
}

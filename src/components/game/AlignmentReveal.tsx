"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { AlignmentBar } from "./AlignmentBar"
import type {
  GameRoundRow,
  QuestionBankRow,
  AnswerValue,
  AnswerHistoryRow,
} from "@/lib/types/game.types"
import { CATEGORY_META } from "@/lib/types/game.types"

const clay = {
  card: "rounded-[20px] border border-white/60 bg-white/80 backdrop-blur-sm",
  shadow: "shadow-[0_4px_16px_rgba(44,40,37,0.08),0_1px_4px_rgba(44,40,37,0.04)]",
}

type AlignmentRevealProps = {
  round: GameRoundRow
  question: QuestionBankRow | null
  myName: string
  partnerName: string
  isPlayer1: boolean
  /** Previous answers for trajectory context */
  answerHistory?: AnswerHistoryRow[]
  onNext: () => void
}

/** Extract numeric value from AnswerValue (for scale questions) */
function getScaleValue(answer: AnswerValue | null): number | null {
  if (!answer) return null
  if ("value" in answer) return answer.value
  return null
}

/** Extract text value from AnswerValue (for open questions) */
function getTextValue(answer: AnswerValue | null): string | null {
  if (!answer) return null
  if ("text" in answer) return answer.text
  return null
}

/** Extract choice value from AnswerValue */
function getChoiceValue(answer: AnswerValue | null): string | null {
  if (!answer) return null
  if ("choice" in answer) return answer.choice
  return null
}

export function AlignmentReveal({
  round,
  question,
  myName,
  partnerName,
  isPlayer1,
  answerHistory = [],
  onNext,
}: AlignmentRevealProps) {
  const myAnswer = isPlayer1 ? round.player1_answer : round.player2_answer
  const partnerAnswer = isPlayer1 ? round.player2_answer : round.player1_answer
  const answerType = question?.answer_type ?? "open"
  const category = question?.category
  const categoryMeta = category ? CATEGORY_META[category] : null

  return (
    <motion.div
      className="w-full space-y-4"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Category badge */}
      {categoryMeta && (
        <motion.div
          className="flex justify-center"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <span className="text-xs font-medium px-3 py-1 rounded-full bg-[#A8B5A0]/15 text-[#5C6B56]">
            {categoryMeta.emoji} {categoryMeta.label}
          </span>
        </motion.div>
      )}

      {/* Question text */}
      <motion.p
        className="text-center text-base font-semibold text-[#2C2825] px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
      >
        {question?.text ?? "Question"}
      </motion.p>

      {/* Reveal content based on answer type */}
      <div className={cn(clay.card, clay.shadow, "p-5")}>
        {answerType === "scale_1_10" && (
          <ScaleReveal
            myAnswer={getScaleValue(myAnswer)}
            partnerAnswer={getScaleValue(partnerAnswer)}
            myName={myName}
            partnerName={partnerName}
          />
        )}

        {answerType === "open" && (
          <OpenReveal
            myAnswer={getTextValue(myAnswer)}
            partnerAnswer={getTextValue(partnerAnswer)}
            myName={myName}
            partnerName={partnerName}
          />
        )}

        {(answerType === "yes_no" || answerType === "multiple_choice") && (
          <ChoiceReveal
            myAnswer={getChoiceValue(myAnswer)}
            partnerAnswer={getChoiceValue(partnerAnswer)}
            myName={myName}
            partnerName={partnerName}
          />
        )}
      </div>

      {/* History note */}
      {answerHistory.length > 0 && answerType === "scale_1_10" && (
        <HistoryNote history={answerHistory} isPlayer1={isPlayer1} partnerName={partnerName} />
      )}

      {/* Discuss prompt */}
      <motion.div
        className="text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <p className="text-sm text-[#8C8279] mb-3">Discuss 💬</p>
        <motion.button
          className="px-8 py-3 rounded-full bg-[#5C6B56] text-white font-semibold text-sm shadow-[0_4px_16px_rgba(92,107,86,0.25)]"
          whileTap={{ scale: 0.97 }}
          onClick={onNext}
        >
          Next →
        </motion.button>
      </motion.div>
    </motion.div>
  )
}

// ─── Scale Reveal (Alignment Bar) ───

function ScaleReveal({
  myAnswer,
  partnerAnswer,
  myName,
  partnerName,
}: {
  myAnswer: number | null
  partnerAnswer: number | null
  myName: string
  partnerName: string
}) {
  if (myAnswer === null || partnerAnswer === null) {
    return <p className="text-center text-sm text-[#8C8279]">Answers not available</p>
  }

  return (
    <AlignmentBar
      myAnswer={myAnswer}
      partnerAnswer={partnerAnswer}
      myLabel={myName}
      partnerLabel={partnerName}
    />
  )
}

// ─── Open-Ended Reveal (Side-by-Side Cards) ───

function OpenReveal({
  myAnswer,
  partnerAnswer,
  myName,
  partnerName,
}: {
  myAnswer: string | null
  partnerAnswer: string | null
  myName: string
  partnerName: string
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <motion.div
        className="p-3 rounded-2xl border border-[#B87333]/20 bg-[#B87333]/5"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <p className="text-[10px] font-bold text-[#B87333] uppercase tracking-wider mb-1.5">{myName}</p>
        <p className="text-sm text-[#2C2825] leading-relaxed">{myAnswer ?? "—"}</p>
      </motion.div>

      <motion.div
        className="p-3 rounded-2xl border border-[#7EC8E3]/20 bg-[#7EC8E3]/5"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
      >
        <p className="text-[10px] font-bold text-[#3A7B94] uppercase tracking-wider mb-1.5">{partnerName}</p>
        <p className="text-sm text-[#2C2825] leading-relaxed">{partnerAnswer ?? "—"}</p>
      </motion.div>
    </div>
  )
}

// ─── Choice Reveal (Yes/No, Multiple Choice) ───

function ChoiceReveal({
  myAnswer,
  partnerAnswer,
  myName,
  partnerName,
}: {
  myAnswer: string | null
  partnerAnswer: string | null
  myName: string
  partnerName: string
}) {
  const isMatch = myAnswer === partnerAnswer

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-center gap-6">
        <motion.div
          className="flex flex-col items-center"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 300, damping: 20 }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-sm font-bold text-white border-2 border-white shadow-md"
            style={{ backgroundColor: "#B87333" }}
          >
            {myAnswer ?? "—"}
          </div>
          <span className="text-[10px] text-[#8C8279] mt-1.5 font-medium">{myName}</span>
        </motion.div>

        <motion.div
          className="flex flex-col items-center"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: "spring", stiffness: 300, damping: 20 }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-sm font-bold text-white border-2 border-white shadow-md"
            style={{ backgroundColor: "#7EC8E3" }}
          >
            {partnerAnswer ?? "—"}
          </div>
          <span className="text-[10px] text-[#8C8279] mt-1.5 font-medium">{partnerName}</span>
        </motion.div>
      </div>

      <motion.p
        className="text-center text-sm font-semibold"
        style={{ color: isMatch ? "#6B9B6B" : "#D4A040" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        {isMatch ? "✨ Match!" : "🤝 Different perspectives"}
      </motion.p>
    </div>
  )
}

// ─── History Note ───

function HistoryNote({
  history,
  isPlayer1,
  partnerName,
}: {
  history: AnswerHistoryRow[]
  isPlayer1: boolean
  partnerName: string
}) {
  // Find the most recent non-current entries
  const previous = history.slice(0, -1)
  if (previous.length === 0) return null

  const last = previous[previous.length - 1]
  const lastValue = "value" in last.answer_value ? last.answer_value.value : null
  if (lastValue === null) return null

  const lastDate = new Date(last.created_at).toLocaleDateString("en-US", { month: "short" })

  return (
    <motion.div
      className="px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.0 }}
    >
      <p className="text-xs text-[#B5ADA4] text-center italic">
        Last time ({lastDate}): You said {lastValue}
      </p>
    </motion.div>
  )
}

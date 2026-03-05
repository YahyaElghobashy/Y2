"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { MessageSquare, Send, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { PromptAnswerReveal } from "./PromptAnswerReveal"
import type { CouplePrompt, PromptAnswer } from "@/lib/types/prompts.types"

const EASE_OUT: [number, number, number, number] = [0.25, 0.1, 0.25, 1]

type DailyPromptCardProps = {
  prompt: CouplePrompt
  myAnswer: PromptAnswer | null
  partnerAnswer: PromptAnswer | null
  onSubmit: (text: string) => void
  className?: string
}

export function DailyPromptCard({
  prompt,
  myAnswer,
  partnerAnswer,
  onSubmit,
  className,
}: DailyPromptCardProps) {
  const [answer, setAnswer] = useState("")

  const handleSubmit = () => {
    if (!answer.trim()) return
    onSubmit(answer.trim())
    setAnswer("")
  }

  // Both answered → show reveal
  if (prompt.both_answered && myAnswer && partnerAnswer) {
    return (
      <div
        data-testid="daily-prompt-card"
        data-state="both-answered"
        className={cn(
          "rounded-2xl bg-[var(--bg-elevated,#FFFFFF)] p-5 shadow-sm",
          className
        )}
      >
        <div className="mb-3 flex items-center gap-2">
          <MessageSquare size={16} className="text-[var(--accent-primary,#C4956A)]" />
          <span className="text-[12px] font-medium text-[var(--accent-primary,#C4956A)]">
            Today&apos;s Prompt
          </span>
        </div>
        <p className="mb-4 font-display text-[15px] font-semibold text-[var(--text-primary)]">
          {prompt.prompt_text}
        </p>
        <PromptAnswerReveal myAnswer={myAnswer} partnerAnswer={partnerAnswer} />
      </div>
    )
  }

  // I answered, waiting for partner
  if (myAnswer) {
    return (
      <div
        data-testid="daily-prompt-card"
        data-state="i-answered"
        className={cn(
          "rounded-2xl bg-[var(--bg-elevated,#FFFFFF)] p-5 shadow-sm",
          className
        )}
      >
        <div className="mb-3 flex items-center gap-2">
          <MessageSquare size={16} className="text-[var(--accent-primary,#C4956A)]" />
          <span className="text-[12px] font-medium text-[var(--accent-primary,#C4956A)]">
            Today&apos;s Prompt
          </span>
        </div>
        <p className="mb-3 font-display text-[15px] font-semibold text-[var(--text-primary)]">
          {prompt.prompt_text}
        </p>
        <div className="rounded-xl bg-[var(--bg-secondary)] p-3">
          <p className="text-[13px] text-[var(--text-secondary)]">
            {myAnswer.answer_text}
          </p>
        </div>
        <div className="mt-3 flex items-center gap-2 text-[12px] text-[var(--text-muted)]">
          <Clock size={12} />
          <span>Waiting for partner&apos;s answer...</span>
        </div>
      </div>
    )
  }

  // Neither answered (or partner answered but I haven't) → show input
  return (
    <div
      data-testid="daily-prompt-card"
      data-state="unanswered"
      className={cn(
        "rounded-2xl bg-[var(--bg-elevated,#FFFFFF)] p-5 shadow-sm",
        className
      )}
    >
      <div className="mb-3 flex items-center gap-2">
        <MessageSquare size={16} className="text-[var(--accent-primary,#C4956A)]" />
        <span className="text-[12px] font-medium text-[var(--accent-primary,#C4956A)]">
          Today&apos;s Prompt
        </span>
      </div>
      <p className="mb-4 font-display text-[15px] font-semibold text-[var(--text-primary)]">
        {prompt.prompt_text}
      </p>
      <div className="flex gap-2">
        <textarea
          data-testid="prompt-answer-input"
          value={answer}
          onChange={(e) => setAnswer(e.target.value.slice(0, 2000))}
          placeholder="Your answer..."
          maxLength={2000}
          rows={3}
          className="flex-1 resize-none rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-3 py-2.5 text-[14px] outline-none focus:border-[var(--accent-primary)]"
        />
      </div>
      <motion.button
        data-testid="submit-answer-btn"
        whileTap={{ scale: 0.97 }}
        transition={{ duration: 0.15, ease: EASE_OUT }}
        onClick={handleSubmit}
        disabled={!answer.trim()}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent-primary,#C4956A)] py-2.5 text-[14px] font-medium text-white disabled:opacity-50"
      >
        <Send size={14} />
        Submit
      </motion.button>
    </div>
  )
}

"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import type { PromptAnswer } from "@/lib/types/prompts.types"

const EASE_OUT: [number, number, number, number] = [0.25, 0.1, 0.25, 1]

type PromptAnswerRevealProps = {
  myAnswer: PromptAnswer
  partnerAnswer: PromptAnswer
  className?: string
}

export function PromptAnswerReveal({
  myAnswer,
  partnerAnswer,
  className,
}: PromptAnswerRevealProps) {
  return (
    <div
      data-testid="prompt-answer-reveal"
      className={cn("flex flex-col gap-3", className)}
    >
      {/* My answer */}
      <motion.div
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: EASE_OUT }}
        data-testid="my-answer"
        className="rounded-xl bg-[var(--accent-soft,#E8D5C0)] p-3"
      >
        <span className="mb-1 block text-[11px] font-medium text-[var(--accent-primary,#C4956A)]">
          You
        </span>
        <p className="text-[13px] text-[var(--text-primary)]">
          {myAnswer.answer_text}
        </p>
      </motion.div>

      {/* Partner answer */}
      <motion.div
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: EASE_OUT, delay: 0.15 }}
        data-testid="partner-answer"
        className="rounded-xl bg-[var(--bg-secondary)] p-3"
      >
        <span className="mb-1 block text-[11px] font-medium text-[var(--text-muted)]">
          Partner
        </span>
        <p className="text-[13px] text-[var(--text-primary)]">
          {partnerAnswer.answer_text}
        </p>
      </motion.div>
    </div>
  )
}

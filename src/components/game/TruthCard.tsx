"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { CATEGORY_META } from "@/lib/types/game.types"
import type { QuestionBankRow, SessionCustomContentRow } from "@/lib/types/game.types"

const clay = {
  card: "rounded-[24px] border border-white/60 bg-white/90 backdrop-blur-sm",
  shadow: "shadow-[0_8px_32px_rgba(44,40,37,0.12),0_2px_8px_rgba(44,40,37,0.06)]",
}

const difficultyMeta = {
  light: { emoji: "☀️", label: "Light" },
  medium: { emoji: "🌤️", label: "Medium" },
  deep: { emoji: "🌊", label: "Deep" },
} as const

type TruthCardProps = {
  question: QuestionBankRow | null
  customContent: SessionCustomContentRow | null
  isPartnerAuthored: boolean
  authorName: string | null
  onNext: () => void
  onSaveResponse?: (text: string) => void
}

export function TruthCard({
  question,
  customContent,
  isPartnerAuthored,
  authorName,
  onNext,
  onSaveResponse,
}: TruthCardProps) {
  const [showResponse, setShowResponse] = useState(false)
  const [responseText, setResponseText] = useState("")

  const text = customContent?.text ?? question?.text ?? ""
  const category = question?.category
  const categoryMeta = category ? CATEGORY_META[category] : null
  const difficulty = question?.difficulty ?? "light"
  const diffMeta = difficultyMeta[difficulty]

  const handleNext = () => {
    if (responseText.trim() && onSaveResponse) {
      onSaveResponse(responseText.trim())
    }
    onNext()
  }

  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0, rotateY: -90 }}
      animate={{ opacity: 1, rotateY: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {/* Truth card */}
      <div className={cn(clay.card, clay.shadow, "p-5 space-y-4")}>
        {/* Header badges */}
        <div className="flex items-start justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            {categoryMeta && (
              <span
                className="text-xs font-medium px-2.5 py-1 rounded-full"
                style={{ backgroundColor: `${categoryMeta.color}15`, color: categoryMeta.color }}
              >
                {categoryMeta.emoji} {categoryMeta.label}
              </span>
            )}
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-[#E5D9CB]/50 text-[#8C8279]">
              {diffMeta.emoji} {diffMeta.label}
            </span>
          </div>

          {isPartnerAuthored && authorName && (
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-[#F4A8B8]/15 text-[#B85A6C]">
              💕 Written by {authorName}
            </span>
          )}
        </div>

        {/* Question text */}
        <div className="py-4">
          <p
            className="text-lg font-bold text-[#2C2825] text-center leading-relaxed"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {text}
          </p>
        </div>

        {/* No CoYYns for truth — subtle note */}
        <p className="text-xs text-[#B5ADA4] text-center italic">
          Truth is free — no CoYYns at stake
        </p>
      </div>

      {/* Optional response section */}
      <div className={cn(clay.card, clay.shadow, "overflow-hidden")}>
        <button
          className="w-full px-5 py-3.5 flex items-center justify-between"
          onClick={() => setShowResponse(!showResponse)}
        >
          <span className="text-sm font-medium text-[#8C8279]">
            Want to share your answer? ✍️
          </span>
          <motion.span
            animate={{ rotate: showResponse ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-[#8C8279]"
          >
            ▾
          </motion.span>
        </button>

        <AnimatePresence>
          {showResponse && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="px-5 pb-4">
                <textarea
                  className="w-full h-24 resize-none rounded-xl bg-[#1C1A18] border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#F4A8B8]/30 transition-colors"
                  placeholder="Type your honest answer..."
                  value={responseText}
                  onChange={e => setResponseText(e.target.value)}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Next button */}
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
  )
}

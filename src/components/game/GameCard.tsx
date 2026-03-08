"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { CATEGORY_META } from "@/lib/types/game.types"
import type { QuestionBankRow, SessionCustomContentRow } from "@/lib/types/game.types"

const clay = {
  card: "rounded-[24px] border border-white/60 bg-white/90 backdrop-blur-sm",
  shadow: "shadow-[0_8px_32px_rgba(44,40,37,0.12),0_2px_8px_rgba(44,40,37,0.06)]",
}

type GameCardProps = {
  question: QuestionBankRow | null
  customContent: SessionCustomContentRow | null
  isPartnerAuthored: boolean
  authorName: string | null
  isRevealed: boolean
  onFlip: () => void
}

export function GameCard({
  question,
  customContent,
  isPartnerAuthored,
  authorName,
  isRevealed,
  onFlip,
}: GameCardProps) {
  const text = customContent?.text ?? question?.text ?? ""
  const category = question?.category
  const categoryMeta = category ? CATEGORY_META[category] : null

  // Face-down tint: rose for partner-authored, cream for bank
  const faceDownBg = isPartnerAuthored
    ? "bg-gradient-to-br from-[#F4A8B8]/30 to-[#FADCE3]/40"
    : "bg-gradient-to-br from-[#EDE0D0] to-[#F5EDE3]"

  return (
    <div className="perspective-[1000px]">
      <motion.div
        className="relative w-full"
        style={{ transformStyle: "preserve-3d" }}
        animate={{ rotateY: isRevealed ? 180 : 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        {/* FACE DOWN */}
        <motion.div
          className={cn(
            "w-full aspect-[3/4] rounded-[24px] border-2 border-white/70 flex flex-col items-center justify-center cursor-pointer",
            faceDownBg,
            clay.shadow,
          )}
          style={{ backfaceVisibility: "hidden" }}
          whileTap={!isRevealed ? { scale: 0.97 } : {}}
          onClick={!isRevealed ? onFlip : undefined}
        >
          <motion.span
            className="text-5xl"
            animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            {isPartnerAuthored ? "💕" : "🎲"}
          </motion.span>
          <p className="text-sm text-[#8C8279] mt-3 font-medium">
            {isPartnerAuthored ? "From your partner" : "Tap to reveal"}
          </p>
        </motion.div>

        {/* FACE UP */}
        <div
          className={cn(
            "absolute inset-0 w-full aspect-[3/4] rounded-[24px] border-2 border-white/70",
            "bg-white flex flex-col",
            clay.shadow,
          )}
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          {/* Header */}
          <div className="px-5 pt-5 flex items-start justify-between">
            {categoryMeta && (
              <span
                className="text-xs font-medium px-2.5 py-1 rounded-full"
                style={{ backgroundColor: `${categoryMeta.color}15`, color: categoryMeta.color }}
              >
                {categoryMeta.emoji} {categoryMeta.label}
              </span>
            )}
            {isPartnerAuthored && authorName && (
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-[#F4A8B8]/15 text-[#B85A6C]">
                💕 Written by {authorName}
              </span>
            )}
          </div>

          {/* Question text */}
          <div className="flex-1 flex items-center justify-center px-6 py-4">
            <p
              className="text-lg font-bold text-[#2C2825] text-center leading-relaxed"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {text}
            </p>
          </div>

          {/* Difficulty */}
          {question?.difficulty && (
            <div className="px-5 pb-5 flex justify-center">
              <span className="text-xs text-[#B5ADA4]">
                {question.difficulty === "light" ? "☀️" : question.difficulty === "medium" ? "🌤️" : "🌊"}{" "}
                {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
              </span>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { CATEGORY_META } from "@/lib/types/game.types"
import type { GameDareRow, SessionCustomContentRow } from "@/lib/types/game.types"

const clay = {
  card: "rounded-[24px] border border-white/60 bg-white/90 backdrop-blur-sm",
  shadow: "shadow-[0_8px_32px_rgba(44,40,37,0.12),0_2px_8px_rgba(44,40,37,0.06)]",
}

const heatColors = {
  1: { bg: "from-[#D4A040]/20 to-[#DAA520]/10", border: "border-[#D4A040]/30", text: "text-[#D4A040]", label: "Mild 🔥" },
  2: { bg: "from-[#E88D4F]/20 to-[#D4A040]/10", border: "border-[#E88D4F]/30", text: "text-[#E88D4F]", label: "Medium 🔥🔥" },
  3: { bg: "from-[#C75050]/20 to-[#E88D4F]/10", border: "border-[#C75050]/30", text: "text-[#C75050]", label: "Intense 🔥🔥🔥" },
} as const

type DareCardProps = {
  dare: GameDareRow | null
  customContent: SessionCustomContentRow | null
  isPartnerAuthored: boolean
  authorName: string | null
  isRevealed: boolean
  onFlip: () => void
  onComplete: () => void
  onSkip: () => void
  isCompleted?: boolean
  isSkipped?: boolean
}

export function DareCard({
  dare,
  customContent,
  isPartnerAuthored,
  authorName,
  isRevealed,
  onFlip,
  onComplete,
  onSkip,
  isCompleted = false,
  isSkipped = false,
}: DareCardProps) {
  const text = customContent?.text ?? dare?.text ?? ""
  const heatLevel = (customContent?.heat_level ?? dare?.heat_level ?? 1) as 1 | 2 | 3
  const reward = customContent?.coyyns_reward ?? dare?.coyyns_reward ?? 15
  const penalty = customContent?.coyyns_penalty ?? dare?.coyyns_penalty ?? 10
  const heat = heatColors[heatLevel]
  const category = dare?.category
  const categoryMeta = category ? CATEGORY_META[category] : null

  const faceDownBg = isPartnerAuthored
    ? "bg-gradient-to-br from-[#F4A8B8]/30 to-[#FADCE3]/40"
    : "bg-gradient-to-br from-[#DAA520]/15 to-[#EDE0D0]"

  const isDone = isCompleted || isSkipped

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
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            {isPartnerAuthored ? "💕" : "⚡"}
          </motion.span>
          <p className="text-sm text-[#8C8279] mt-3 font-medium">
            {isPartnerAuthored ? "Dare from your partner" : "Dare — Tap to reveal"}
          </p>
        </motion.div>

        {/* FACE UP */}
        <div
          className={cn(
            "absolute inset-0 w-full aspect-[3/4] rounded-[24px] border-2",
            "bg-white flex flex-col overflow-hidden",
            heat.border,
            clay.shadow,
          )}
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          {/* Heat gradient strip at top */}
          <div className={cn("h-2 w-full bg-gradient-to-r", heat.bg)} />

          {/* Header */}
          <div className="px-5 pt-4 flex items-start justify-between">
            <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full", heat.text, `bg-current/10`)}
              style={{ backgroundColor: `currentColor`, opacity: 0.1 }}
            >
              <span style={{ opacity: 10 }}>{heat.label}</span>
            </span>
            {isPartnerAuthored && authorName && (
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-[#F4A8B8]/15 text-[#B85A6C]">
                💕 {authorName}
              </span>
            )}
          </div>

          {/* Dare text */}
          <div className="flex-1 flex items-center justify-center px-6 py-4">
            <p
              className="text-lg font-bold text-[#2C2825] text-center leading-relaxed"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {text}
            </p>
          </div>

          {/* CoYYns stakes */}
          <div className="px-5 pb-3 flex items-center justify-center gap-4">
            <span className="text-xs font-medium text-[#6B9B6B]">
              ✅ Complete: +{reward} 🪙
            </span>
            <span className="text-xs font-medium text-[#C75050]">
              ❌ Skip: -{penalty} 🪙
            </span>
          </div>

          {/* Action buttons */}
          {!isDone && (
            <div className="px-5 pb-5 flex gap-3">
              <motion.button
                className="flex-1 py-3 rounded-full bg-[#6B9B6B] text-white font-semibold text-sm shadow-md"
                whileTap={{ scale: 0.97 }}
                onClick={onComplete}
              >
                Complete ✅
              </motion.button>
              <motion.button
                className="flex-1 py-3 rounded-full bg-white border border-[#E5D9CB] text-[#8C8279] font-medium text-sm"
                whileTap={{ scale: 0.97 }}
                onClick={onSkip}
              >
                Skip ❌
              </motion.button>
            </div>
          )}

          {/* Completed/Skipped state */}
          {isDone && (
            <div className="px-5 pb-5 flex justify-center">
              <span className={cn(
                "text-sm font-bold px-4 py-2 rounded-full",
                isCompleted ? "bg-[#6B9B6B]/15 text-[#6B9B6B]" : "bg-[#C75050]/10 text-[#C75050]",
              )}>
                {isCompleted ? `✅ Completed! +${reward} 🪙` : `❌ Skipped — ${penalty} 🪙`}
              </span>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

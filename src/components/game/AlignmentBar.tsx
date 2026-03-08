"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import type { AlignmentLabel } from "@/lib/types/game.types"

// ─── Claymorphism helpers ───
const clay = {
  card: "rounded-[20px] border border-white/60 bg-white/80 backdrop-blur-sm",
  shadow: "shadow-[0_4px_16px_rgba(44,40,37,0.08),0_1px_4px_rgba(44,40,37,0.04)]",
}

type AlignmentBarProps = {
  myAnswer: number
  partnerAnswer: number
  /** Shown below the bar */
  myLabel?: string
  partnerLabel?: string
  /** 1-10 scale  */
  min?: number
  max?: number
  showLabels?: boolean
}

/** Compute alignment from gap */
export function getAlignmentLabel(gap: number): AlignmentLabel {
  if (gap <= 1) return "aligned"
  if (gap <= 3) return "close"
  return "talk_about_it"
}

const alignmentMeta: Record<AlignmentLabel, { text: string; emoji: string; color: string; glow: string }> = {
  aligned: { text: "Aligned!", emoji: "✨", color: "#6B9B6B", glow: "rgba(107,155,107,0.25)" },
  close: { text: "Close but different", emoji: "🤝", color: "#D4A040", glow: "rgba(212,160,64,0.20)" },
  talk_about_it: { text: "Let\u2019s talk about this", emoji: "💬", color: "#C75050", glow: "rgba(199,80,80,0.20)" },
}

export function AlignmentBar({
  myAnswer,
  partnerAnswer,
  myLabel = "You",
  partnerLabel = "Partner",
  min = 1,
  max = 10,
  showLabels = true,
}: AlignmentBarProps) {
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 100)
    return () => clearTimeout(t)
  }, [])

  const gap = Math.abs(myAnswer - partnerAnswer)
  const alignment = getAlignmentLabel(gap)
  const meta = alignmentMeta[alignment]

  // Percentage positions along the bar
  const range = max - min
  const myPos = ((myAnswer - min) / range) * 100
  const partnerPos = ((partnerAnswer - min) / range) * 100
  const leftPos = Math.min(myPos, partnerPos)
  const rightPos = Math.max(myPos, partnerPos)

  return (
    <div className="w-full">
      {/* Alignment badge */}
      <motion.div
        className="flex items-center justify-center gap-1.5 mb-3"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.6 }}
      >
        <span
          className="text-sm font-bold px-3 py-1 rounded-full"
          style={{ color: meta.color, backgroundColor: meta.glow }}
        >
          {meta.emoji} {meta.text}
        </span>
      </motion.div>

      {/* Bar track */}
      <div className="relative h-8 mx-4">
        {/* Background track */}
        <div className="absolute top-3 inset-x-0 h-2 rounded-full bg-[#E5D9CB] overflow-hidden">
          {/* Fill zone between answers */}
          {animated && (
            <motion.div
              className="absolute top-0 h-full rounded-full"
              style={{ backgroundColor: meta.glow }}
              initial={{ left: `${leftPos}%`, width: "0%" }}
              animate={{ left: `${leftPos}%`, width: `${rightPos - leftPos}%` }}
              transition={{ duration: 0.6, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            />
          )}
        </div>

        {/* My answer marker (copper) */}
        <motion.div
          className="absolute top-0 flex flex-col items-center"
          style={{ left: `${myPos}%` }}
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: animated ? 1 : 0, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <div
            className="w-6 h-6 rounded-full border-2 border-white shadow-md flex items-center justify-center text-[10px] font-bold text-white"
            style={{ backgroundColor: "#B87333", transform: "translateX(-50%)" }}
          >
            {myAnswer}
          </div>
        </motion.div>

        {/* Partner answer marker (dusk blue) */}
        <motion.div
          className="absolute top-0 flex flex-col items-center"
          style={{ left: `${partnerPos}%` }}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: animated ? 1 : 0, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <div
            className="w-6 h-6 rounded-full border-2 border-white shadow-md flex items-center justify-center text-[10px] font-bold text-white"
            style={{ backgroundColor: "#7EC8E3", transform: "translateX(-50%)" }}
          >
            {partnerAnswer}
          </div>
        </motion.div>
      </div>

      {/* Legend */}
      {showLabels && (
        <motion.div
          className="flex items-center justify-center gap-4 mt-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <span className="flex items-center gap-1.5 text-xs text-[#8C8279]">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#B87333" }} />
            {myLabel}
          </span>
          <span className="flex items-center gap-1.5 text-xs text-[#8C8279]">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#7EC8E3" }} />
            {partnerLabel}
          </span>
        </motion.div>
      )}

      {/* Scale ticks */}
      <div className="flex justify-between px-4 mt-1">
        {Array.from({ length: max - min + 1 }, (_, i) => i + min).map(n => (
          <span key={n} className="text-[9px] text-[#B5ADA4] font-medium">{n}</span>
        ))}
      </div>
    </div>
  )
}

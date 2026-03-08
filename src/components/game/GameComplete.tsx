"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/providers/AuthProvider"
import { useGameEngine } from "@/lib/hooks/use-game-engine"
import { CATEGORY_META } from "@/lib/types/game.types"
import type { GameMode } from "@/lib/types/game.types"

const clay = {
  card: "rounded-[20px] border border-white/60 bg-white/80 backdrop-blur-sm",
  shadow: "shadow-[0_4px_16px_rgba(44,40,37,0.08),0_1px_4px_rgba(44,40,37,0.04)]",
  shadowLg: "shadow-[0_8px_32px_rgba(44,40,37,0.10),0_2px_8px_rgba(44,40,37,0.05)]",
}

type GameCompleteProps = {
  mode: GameMode
}

export function GameComplete({ mode }: GameCompleteProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session") ?? undefined
  const { user, partner } = useAuth()

  const { session, rounds } = useGameEngine(sessionId)

  const isPlayer1 = session?.created_by === user?.id
  const partnerName = partner?.display_name ?? "Partner"

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(180deg, #FBF8F4 0%, #F0EBE3 100%)" }}>
        <p className="text-sm text-[#8C8279]">Loading results...</p>
      </div>
    )
  }

  if (mode === "check_in") {
    return <CheckInComplete session={session} rounds={rounds} partnerName={partnerName} isPlayer1={isPlayer1} router={router} />
  }

  if (mode === "date_night") {
    return <DateNightComplete session={session} rounds={rounds} partnerName={partnerName} isPlayer1={isPlayer1} router={router} />
  }

  // deep_dive handled by DeepDiveComplete component
  return null
}

// ─── MODE 1: Check-In Complete ───

function CheckInComplete({
  session,
  rounds,
  partnerName,
  isPlayer1,
  router,
}: {
  session: NonNullable<ReturnType<typeof useGameEngine>["session"]>
  rounds: ReturnType<typeof useGameEngine>["rounds"]
  partnerName: string
  isPlayer1: boolean
  router: ReturnType<typeof useRouter>
}) {
  const alignmentScore = session.alignment_score ?? 0
  const categoryScores = session.category_scores ?? {}

  // Find biggest gap category
  const sortedCats = Object.entries(categoryScores).sort(([, a], [, b]) => a - b)
  const biggestGap = sortedCats[0]
  const mostAligned = sortedCats[sortedCats.length - 1]

  const scoreColor = alignmentScore > 70 ? "#B87333" : alignmentScore > 50 ? "#D4A040" : "#C75050"

  return (
    <div className="min-h-screen pb-8" style={{ background: "linear-gradient(180deg, #FBF8F4 0%, #F0EBE3 100%)" }}>
      {/* Header */}
      <motion.div
        className="px-5 pt-8 pb-4 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1
          className="text-[28px] font-bold text-[#2C2825]"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Check-In Complete ⚖️
        </h1>
        <p className="text-sm text-[#8C8279] mt-1" style={{ fontFamily: "'Amiri', serif" }}>
          الميزان
        </p>
      </motion.div>

      {/* Overall alignment score */}
      <motion.div
        className="flex justify-center mb-6"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
      >
        <div className="relative w-32 h-32 flex items-center justify-center">
          {/* Background circle */}
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 128 128">
            <circle cx="64" cy="64" r="56" fill="none" stroke="#E5D9CB" strokeWidth="8" />
            <motion.circle
              cx="64" cy="64" r="56" fill="none"
              stroke={scoreColor}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${(alignmentScore / 100) * 352} 352`}
              initial={{ strokeDasharray: "0 352" }}
              animate={{ strokeDasharray: `${(alignmentScore / 100) * 352} 352` }}
              transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
            />
          </svg>
          <div className="text-center">
            <span className="text-3xl font-bold" style={{ color: scoreColor }}>{alignmentScore}</span>
            <span className="text-sm" style={{ color: scoreColor }}>%</span>
          </div>
        </div>
      </motion.div>

      {/* Per-category breakdown */}
      <motion.div
        className="px-5 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className={cn(clay.card, clay.shadow, "p-5 space-y-3")}>
          <h3 className="text-sm font-bold text-[#2C2825] mb-2">Category Alignment</h3>
          {Object.entries(categoryScores).map(([cat, score]) => {
            const meta = CATEGORY_META[cat as keyof typeof CATEGORY_META]
            if (!meta) return null
            return (
              <div key={cat} className="flex items-center gap-3">
                <span className="text-sm w-24 truncate">{meta.emoji} {meta.label}</span>
                <div className="flex-1 h-2 rounded-full bg-[#E5D9CB] overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: score > 70 ? "#6B9B6B" : score > 50 ? "#D4A040" : "#C75050" }}
                    initial={{ width: 0 }}
                    animate={{ width: `${score}%` }}
                    transition={{ duration: 0.6, delay: 0.7 }}
                  />
                </div>
                <span className="text-xs font-medium text-[#8C8279] w-10 text-end">{score}%</span>
              </div>
            )
          })}
        </div>
      </motion.div>

      {/* Highlights */}
      <motion.div
        className="px-5 mb-6 space-y-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        {mostAligned && (
          <div className={cn(clay.card, clay.shadow, "p-4 border-s-4 border-s-[#6B9B6B]")}>
            <p className="text-xs text-[#6B9B6B] font-bold uppercase tracking-wider mb-1">Most Aligned</p>
            <p className="text-sm text-[#2C2825]">
              {CATEGORY_META[mostAligned[0] as keyof typeof CATEGORY_META]?.emoji}{" "}
              {CATEGORY_META[mostAligned[0] as keyof typeof CATEGORY_META]?.label}: {mostAligned[1]}%
            </p>
          </div>
        )}

        {biggestGap && biggestGap[0] !== mostAligned?.[0] && (
          <div className={cn(clay.card, clay.shadow, "p-4 border-s-4 border-s-[#C75050]")}>
            <p className="text-xs text-[#C75050] font-bold uppercase tracking-wider mb-1">Biggest Gap</p>
            <p className="text-sm text-[#2C2825]">
              {CATEGORY_META[biggestGap[0] as keyof typeof CATEGORY_META]?.emoji}{" "}
              {CATEGORY_META[biggestGap[0] as keyof typeof CATEGORY_META]?.label}: {biggestGap[1]}%
            </p>
          </div>
        )}
      </motion.div>

      {/* CTAs */}
      <motion.div
        className="px-5 space-y-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.0 }}
      >
        <motion.button
          className="w-full py-4 rounded-full bg-[#5C6B56] text-white font-bold text-sm shadow-[0_4px_20px_rgba(92,107,86,0.25)]"
          whileTap={{ scale: 0.98 }}
          onClick={() => router.push("/game")}
        >
          Schedule Next Check-In 📅
        </motion.button>
        <button
          className="w-full py-3 text-sm font-medium text-[#8C8279]"
          onClick={() => router.push("/game")}
        >
          Back to Games
        </button>
      </motion.div>
    </div>
  )
}

// ─── MODE 3: Date Night Complete ───

function DateNightComplete({
  session,
  rounds,
  partnerName,
  isPlayer1,
  router,
}: {
  session: NonNullable<ReturnType<typeof useGameEngine>["session"]>
  rounds: ReturnType<typeof useGameEngine>["rounds"]
  partnerName: string
  isPlayer1: boolean
  router: ReturnType<typeof useRouter>
}) {
  const myScore = isPlayer1 ? session.player1_score : session.player2_score
  const pScore = isPlayer1 ? session.player2_score : session.player1_score
  const totalCoyyns = session.total_coyyns_earned
  const iWon = myScore > pScore
  const isTie = myScore === pScore

  const daresCompleted = rounds.filter(r => r.dare_completed === true).length
  const daresSkipped = rounds.filter(r => r.dare_completed === false && r.is_skipped).length
  const partnerAuthored = rounds.filter(r => r.custom_content_id).length

  return (
    <div className="min-h-screen pb-8 bg-[#1C1A18]">
      {/* Header */}
      <motion.div
        className="px-5 pt-8 pb-4 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <motion.span
          className="text-6xl block mb-3"
          initial={{ scale: 0 }}
          animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
          transition={{ delay: 0.2, type: "spring" }}
        >
          {isTie ? "🤝" : iWon ? "👑" : "🎉"}
        </motion.span>
        <h1
          className="text-[28px] font-bold text-white"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Game Over!
        </h1>
      </motion.div>

      {/* Scores */}
      <motion.div
        className="px-5 mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className={cn(clay.card, clay.shadow, "p-5")}>
          <div className="flex items-center justify-between">
            <div className="text-center flex-1">
              <p className="text-xs text-[#8C8279] font-medium uppercase tracking-wider mb-1">You</p>
              <p className="text-3xl font-bold text-[#B87333]">{myScore}</p>
              <p className="text-xs text-[#8C8279]">🪙</p>
              {iWon && !isTie && <span className="text-lg">👑</span>}
            </div>
            <div className="text-2xl text-[#E5D9CB] font-light">vs</div>
            <div className="text-center flex-1">
              <p className="text-xs text-[#8C8279] font-medium uppercase tracking-wider mb-1">{partnerName}</p>
              <p className="text-3xl font-bold text-[#7EC8E3]">{pScore}</p>
              <p className="text-xs text-[#8C8279]">🪙</p>
              {!iWon && !isTie && <span className="text-lg">👑</span>}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        className="px-5 mb-6 grid grid-cols-3 gap-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className={cn(clay.card, clay.shadow, "p-3 text-center")}>
          <p className="text-lg font-bold text-[#2C2825]">{totalCoyyns}</p>
          <p className="text-[10px] text-[#8C8279] font-medium">Total 🪙</p>
        </div>
        <div className={cn(clay.card, clay.shadow, "p-3 text-center")}>
          <p className="text-lg font-bold text-[#6B9B6B]">{daresCompleted}</p>
          <p className="text-[10px] text-[#8C8279] font-medium">Dares Done</p>
        </div>
        <div className={cn(clay.card, clay.shadow, "p-3 text-center")}>
          <p className="text-lg font-bold text-[#C75050]">{daresSkipped}</p>
          <p className="text-[10px] text-[#8C8279] font-medium">Dares Skipped</p>
        </div>
      </motion.div>

      {/* Partner-authored highlight */}
      {partnerAuthored > 0 && (
        <motion.div
          className="px-5 mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <div className={cn(clay.card, clay.shadow, "p-4 border-s-4 border-s-[#F4A8B8]")}>
            <p className="text-xs text-[#B85A6C] font-bold uppercase tracking-wider mb-1">Partner Cards 💕</p>
            <p className="text-sm text-[#2C2825]">
              {partnerAuthored} question{partnerAuthored > 1 ? "s" : ""} written by {partnerName} just for you
            </p>
          </div>
        </motion.div>
      )}

      {/* CTAs */}
      <motion.div
        className="px-5 space-y-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
      >
        <motion.button
          className="w-full py-4 rounded-full bg-[#F4A8B8] text-white font-bold text-sm shadow-[0_4px_20px_rgba(244,168,184,0.30)]"
          whileTap={{ scale: 0.98 }}
          onClick={() => router.push("/game/date-night/setup")}
        >
          Play Again 🎲
        </motion.button>
        <button
          className="w-full py-3 text-sm font-medium text-white/50"
          onClick={() => router.push("/game")}
        >
          Back to Games
        </button>
      </motion.div>
    </div>
  )
}

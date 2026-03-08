"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/providers/AuthProvider"
import { useGameEngine } from "@/lib/hooks/use-game-engine"
import { CATEGORY_META } from "@/lib/types/game.types"

const clay = {
  card: "rounded-[20px] border border-white/60 bg-white/80 backdrop-blur-sm",
  shadow: "shadow-[0_4px_16px_rgba(44,40,37,0.08),0_1px_4px_rgba(44,40,37,0.04)]",
  shadowLg: "shadow-[0_8px_32px_rgba(44,40,37,0.10),0_2px_8px_rgba(44,40,37,0.05)]",
}

export function DeepDiveComplete() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session") ?? undefined
  const { user, partner } = useAuth()

  const { session, rounds } = useGameEngine(sessionId)

  const isPlayer1 = session?.created_by === user?.id
  const partnerName = partner?.display_name ?? "Partner"

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(180deg, #FBF8F4 0%, #EEF5F2 100%)" }}>
        <p className="text-sm text-[#8C8279]">Loading...</p>
      </div>
    )
  }

  // Get primary category from config
  const config = session.config as unknown as { primaryCategory?: string }
  const primaryCategory = config?.primaryCategory
  const categoryMeta = primaryCategory ? CATEGORY_META[primaryCategory as keyof typeof CATEGORY_META] : null

  // Duration in minutes
  const durationMins = session.duration_seconds
    ? Math.round(session.duration_seconds / 60)
    : null

  // Journal excerpts: rounds where either partner journaled
  const journaledRounds = rounds.filter(r =>
    (isPlayer1 ? r.player1_journal : r.player2_journal) ||
    (isPlayer1 ? r.player2_journal : r.player1_journal)
  )

  const myJournals = journaledRounds
    .map(r => ({
      roundId: r.id,
      questionId: r.question_id,
      myEntry: isPlayer1 ? r.player1_journal : r.player2_journal,
      partnerEntry: isPlayer1 ? r.player2_journal : r.player1_journal,
    }))
    .filter(j => j.myEntry || j.partnerEntry)
    .slice(0, 3)

  return (
    <div
      className="min-h-screen pb-8"
      style={{ background: "linear-gradient(180deg, #FBF8F4 0%, #EEF5F2 50%, #F0EBE3 100%)" }}
    >
      {/* Header */}
      <motion.div
        className="px-5 pt-8 pb-4 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.span
          className="text-5xl block mb-3"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 12 }}
        >
          🌊
        </motion.span>
        <h1
          className="text-[28px] font-bold text-[#2C2825]"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Deep Dive Complete
        </h1>
        <p className="text-sm text-[#8C8279] mt-1" style={{ fontFamily: "'Amiri', serif" }}>
          غوص
        </p>
      </motion.div>

      {/* Exploration summary */}
      <motion.div
        className="px-5 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className={cn(clay.card, clay.shadow, "p-5 text-center")}>
          {categoryMeta && (
            <span className="text-4xl block mb-3">{categoryMeta.emoji}</span>
          )}
          <p className="text-base text-[#2C2825] leading-relaxed">
            You explored <span className="font-bold">{rounds.length} questions</span>
            {categoryMeta && (
              <> about <span className="font-bold">{categoryMeta.label}</span></>
            )}
          </p>
          {durationMins && (
            <p
              className="text-sm text-[#8C8279] mt-2 italic"
              style={{ fontFamily: "'Caveat', cursive", fontSize: "16px" }}
            >
              You spent {durationMins} minutes together
            </p>
          )}
        </div>
      </motion.div>

      {/* Journal excerpts */}
      {myJournals.length > 0 ? (
        <motion.div
          className="px-5 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h3 className="text-sm font-bold text-[#2C2825] mb-3">
            Your reflections ✍️
          </h3>
          <div className="space-y-3">
            {myJournals.map((j, i) => (
              <motion.div
                key={j.roundId}
                className={cn(clay.card, clay.shadow, "p-4 border-s-4 border-s-[#7EC8E3]/40")}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.1 }}
              >
                {j.myEntry && (
                  <div className="mb-2">
                    <p className="text-xs text-[#3A7B94] font-medium mb-1">You wrote:</p>
                    <p className="text-sm text-[#2C2825] leading-relaxed line-clamp-2">
                      {j.myEntry}
                    </p>
                  </div>
                )}
                {j.partnerEntry && (
                  <div className="mt-2 pt-2 border-t border-[#E5D9CB]">
                    <p className="text-xs text-[#8C8279] font-medium mb-1">{partnerName} wrote:</p>
                    <p className="text-sm text-[#8C8279] leading-relaxed line-clamp-2">
                      {j.partnerEntry}
                    </p>
                  </div>
                )}
              </motion.div>
            ))}

            {journaledRounds.length > 3 && (
              <button className="text-xs text-[#3A7B94] font-medium">
                See all {journaledRounds.length} entries →
              </button>
            )}
          </div>
        </motion.div>
      ) : (
        <motion.div
          className="px-5 mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className={cn(clay.card, clay.shadow, "p-5 text-center")}>
            <p
              className="text-base text-[#8C8279] italic"
              style={{ fontFamily: "'Caveat', cursive", fontSize: "17px" }}
            >
              You chose to keep this conversation between you. Beautiful.
            </p>
          </div>
        </motion.div>
      )}

      {/* Saved confirmation */}
      <motion.div
        className="px-5 mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <p className="text-center text-xs text-[#B5ADA4]">
          📝 This session is saved in your history. Return to it anytime.
        </p>
      </motion.div>

      {/* CTAs */}
      <motion.div
        className="px-5 space-y-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.0 }}
      >
        <motion.button
          className="w-full py-4 rounded-full bg-[#3A7B94] text-white font-bold text-sm shadow-[0_4px_20px_rgba(58,123,148,0.25)]"
          whileTap={{ scale: 0.98 }}
          onClick={() => router.push("/game/deep-dive/setup")}
        >
          Explore Another Topic 🌊
        </motion.button>
        <button
          className="w-full py-3 text-sm font-medium text-[#8C8279]"
          onClick={() => router.push("/game")}
        >
          Back to Home
        </button>
      </motion.div>
    </div>
  )
}

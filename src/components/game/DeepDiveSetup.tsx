"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { useGameEngine } from "@/lib/hooks/use-game-engine"
import { CATEGORY_META } from "@/lib/types/game.types"
import type { QuestionCategory, DeepDiveConfig, DifficultyLevel } from "@/lib/types/game.types"

const clay = {
  card: "rounded-[20px] border border-white/60 bg-white/80 backdrop-blur-sm",
  shadow: "shadow-[0_4px_16px_rgba(44,40,37,0.08),0_1px_4px_rgba(44,40,37,0.04)]",
  pressed: "active:shadow-[0_1px_4px_rgba(44,40,37,0.06)] active:translate-y-[1px]",
}

const DEEP_DIVE_CATEGORIES: { cat: QuestionCategory; desc: string }[] = [
  { cat: "faith", desc: "Explore your shared spiritual vision and daily practice" },
  { cat: "finances", desc: "Align on money, saving, spending, and building together" },
  { cat: "family", desc: "Talk about in-laws, kids, and building your family" },
  { cat: "intimacy", desc: "Discuss emotional closeness, boundaries, and love" },
  { cat: "communication", desc: "Understand how you each process and express feelings" },
  { cat: "vulnerability", desc: "Share fears, insecurities, and hidden truths" },
  { cat: "dreams", desc: "Envision your shared future and personal goals" },
  { cat: "conflict", desc: "Learn how to disagree well and repair together" },
]

const DIFFICULTY_OPTIONS: { level: DifficultyLevel; label: string; emoji: string }[] = [
  { level: "light", label: "Light", emoji: "☀️" },
  { level: "medium", label: "Medium", emoji: "🌤️" },
  { level: "deep", label: "Deep", emoji: "🌊" },
]

export function DeepDiveSetup() {
  const router = useRouter()
  const { createSession, startSession } = useGameEngine()

  const [primaryCategory, setPrimaryCategory] = useState<QuestionCategory | null>(null)
  const [questionCount, setQuestionCount] = useState(8)
  const [difficultyPreference, setDifficultyPreference] = useState<DifficultyLevel[]>(["medium"])
  const [isCreating, setIsCreating] = useState(false)

  const timeEstimate = useMemo(() => `~${questionCount * 3} minutes`, [questionCount])

  const toggleDifficulty = (level: DifficultyLevel) => {
    setDifficultyPreference(prev =>
      prev.includes(level) ? prev.filter(d => d !== level) : [...prev, level]
    )
  }

  const handleBegin = async () => {
    if (!primaryCategory || isCreating) return
    setIsCreating(true)

    const config: DeepDiveConfig = {
      primaryCategory,
      secondaryCategories: [],
      questionCount,
      difficultyPreference,
    }

    const sessionId = await createSession("deep_dive", config)
    if (sessionId) {
      await startSession(sessionId)
      router.push(`/game/deep-dive/play?session=${sessionId}`)
    }
    setIsCreating(false)
  }

  return (
    <div className="min-h-screen pb-8" style={{ background: "linear-gradient(180deg, #FBF8F4 0%, #EDF4F7 100%)" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-6 pb-4">
        <motion.button
          className="w-9 h-9 rounded-full bg-white/70 border border-white/80 flex items-center justify-center shadow-sm"
          whileTap={{ scale: 0.92 }}
          onClick={() => router.back()}
        >
          <ArrowLeft size={18} className="text-[#2C2825]" />
        </motion.button>
        <div>
          <h1
            className="text-[24px] font-bold text-[#2C2825]"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Deep Dive
          </h1>
          <p className="text-xs text-[#8C8279]" style={{ fontFamily: "'Amiri', serif" }}>
            غوص — No scoring. Just honesty.
          </p>
        </div>
      </div>

      {/* No-Pressure Messaging */}
      <motion.div
        className="px-5 mb-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className={cn(
          clay.card, clay.shadow,
          "p-4 bg-gradient-to-br from-[#7EC8E3]/10 to-[#B8E0EF]/15",
          "border-[#7EC8E3]/20"
        )}>
          <p
            className="text-sm text-[#3A7B94] italic leading-relaxed"
            style={{ fontFamily: "'Caveat', cursive", fontSize: "16px" }}
          >
            Take your time. There&apos;s no rush, no score, no judgment. Just two hearts getting closer.
          </p>
        </div>
      </motion.div>

      {/* Category Selection */}
      <div className="px-5 mb-6">
        <h2 className="text-base font-bold text-[#2C2825] mb-3">
          Pick a focus area
        </h2>
        <div className="space-y-3">
          {DEEP_DIVE_CATEGORIES.map(({ cat, desc }) => {
            const meta = CATEGORY_META[cat]
            const isSelected = primaryCategory === cat

            return (
              <motion.button
                key={cat}
                className={cn(
                  clay.card, "w-full text-start p-4 transition-all duration-200",
                  isSelected
                    ? "border-[#3A7B94]/30 bg-[#7EC8E3]/10 shadow-[0_4px_16px_rgba(58,123,148,0.12)]"
                    : cn(clay.shadow, "hover:shadow-[0_6px_20px_rgba(44,40,37,0.10)]"),
                )}
                whileTap={{ scale: 0.98 }}
                onClick={() => setPrimaryCategory(cat)}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl mt-0.5">{meta.emoji}</span>
                  <div>
                    <h3 className={cn(
                      "text-sm font-bold",
                      isSelected ? "text-[#3A7B94]" : "text-[#2C2825]"
                    )}>
                      {meta.label}
                    </h3>
                    <p className="text-xs text-[#8C8279] mt-0.5 leading-relaxed">{desc}</p>
                  </div>
                </div>
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Question Count */}
      <div className="px-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-[#2C2825]">How deep?</h2>
          <span className={cn(clay.card, clay.shadow, "px-3 py-1.5 text-sm font-bold text-[#2C2825]")}>
            {questionCount}
          </span>
        </div>
        <input
          type="range"
          min={5}
          max={15}
          value={questionCount}
          onChange={e => setQuestionCount(Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #7EC8E3 0%, #7EC8E3 ${((questionCount - 5) / 10) * 100}%, #E5D9CB ${((questionCount - 5) / 10) * 100}%, #E5D9CB 100%)`,
          }}
        />
        <p className="text-center text-xs text-[#8C8279] mt-2">{timeEstimate} estimate</p>
      </div>

      {/* Difficulty Preference */}
      <div className="px-5 mb-8">
        <h2 className="text-base font-bold text-[#2C2825] mb-3">Difficulty</h2>
        <div className="flex gap-3">
          {DIFFICULTY_OPTIONS.map(({ level, label, emoji }) => {
            const isSelected = difficultyPreference.includes(level)
            return (
              <motion.button
                key={level}
                className={cn(
                  "flex-1 py-3 rounded-full text-sm font-medium text-center transition-all duration-200",
                  isSelected
                    ? "bg-[#7EC8E3]/20 text-[#3A7B94] border border-[#7EC8E3]/40"
                    : cn(clay.card, clay.shadow),
                  clay.pressed,
                )}
                whileTap={{ scale: 0.96 }}
                onClick={() => toggleDifficulty(level)}
              >
                {emoji} {label}
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Begin Button */}
      <div className="px-5">
        <motion.button
          className={cn(
            "w-full py-4 rounded-full text-base font-bold transition-all duration-200",
            primaryCategory
              ? "bg-[#3A7B94] text-white shadow-[0_4px_20px_rgba(58,123,148,0.25)]"
              : "bg-[#E5D9CB] text-[#B5ADA4] cursor-not-allowed",
          )}
          whileTap={primaryCategory ? { scale: 0.98 } : {}}
          onClick={handleBegin}
          disabled={!primaryCategory || isCreating}
        >
          {isCreating ? "Preparing..." : "Begin Deep Dive 🌊"}
        </motion.button>
      </div>
    </div>
  )
}

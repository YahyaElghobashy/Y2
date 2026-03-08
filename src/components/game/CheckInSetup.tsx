"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { useGameEngine } from "@/lib/hooks/use-game-engine"
import {
  QUESTION_CATEGORIES,
  CATEGORY_META,
} from "@/lib/types/game.types"
import type { QuestionCategory, CheckInConfig } from "@/lib/types/game.types"

// ─── Claymorphism helpers ───
const clay = {
  card: "rounded-[20px] border border-white/60 bg-white/80 backdrop-blur-sm",
  shadow: "shadow-[0_4px_16px_rgba(44,40,37,0.08),0_1px_4px_rgba(44,40,37,0.04)]",
  shadowLg: "shadow-[0_8px_32px_rgba(44,40,37,0.10),0_2px_8px_rgba(44,40,37,0.05)]",
  inner: "shadow-[inset_0_2px_4px_rgba(44,40,37,0.04)]",
  pressed: "active:shadow-[0_1px_4px_rgba(44,40,37,0.06)] active:translate-y-[1px]",
}

// Categories available for check-in
const CHECK_IN_CATEGORIES: QuestionCategory[] = [
  "communication", "intimacy", "finances", "faith",
  "family", "lifestyle", "dreams", "conflict",
]

export function CheckInSetup() {
  const router = useRouter()
  const { createSession, startSession } = useGameEngine()

  const [selectedCategories, setSelectedCategories] = useState<QuestionCategory[]>([])
  const [questionCount, setQuestionCount] = useState(10)
  const [includeOpenDiscussion, setIncludeOpenDiscussion] = useState(false)
  const [relationshipPulse, setRelationshipPulse] = useState(7)
  const [isCreating, setIsCreating] = useState(false)

  // Time estimate: ~2 min per question
  const timeEstimate = useMemo(() => {
    const mins = questionCount * 2
    return `~${mins} minutes`
  }, [questionCount])

  const toggleCategory = (cat: QuestionCategory) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    )
  }

  const handleBegin = async () => {
    if (selectedCategories.length === 0 || isCreating) return
    setIsCreating(true)

    const config: CheckInConfig = {
      categories: selectedCategories,
      questionCount,
      intensity: questionCount <= 7 ? "light" : questionCount <= 12 ? "moderate" : "deep",
      includeOpenDiscussion,
      shareResultsInstantly: false,
      relationshipPulse,
    }

    const sessionId = await createSession("check_in", config)
    if (sessionId) {
      await startSession(sessionId)
      router.push(`/game/check-in/play?session=${sessionId}`)
    }
    setIsCreating(false)
  }

  return (
    <div className="min-h-screen pb-8" style={{ background: "linear-gradient(180deg, #FBF8F4 0%, #F0EBE3 100%)" }}>
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
            Monthly Check-In
          </h1>
          <p className="text-xs text-[#8C8279]" style={{ fontFamily: "'Amiri', serif" }}>
            الميزان — {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </p>
        </div>
      </div>

      {/* Category Selection */}
      <div className="px-5 mb-6">
        <h2 className="text-base font-bold text-[#2C2825] mb-3">
          What areas to check in on?
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {CHECK_IN_CATEGORIES.map(cat => {
            const meta = CATEGORY_META[cat]
            const isSelected = selectedCategories.includes(cat)

            return (
              <motion.button
                key={cat}
                className={cn(
                  clay.card,
                  "flex flex-col items-center justify-center py-4 px-2 text-center transition-all duration-200",
                  isSelected
                    ? "border-[#5C6B56]/40 bg-[#A8B5A0]/15 shadow-[0_4px_16px_rgba(92,107,86,0.12)]"
                    : cn(clay.shadow, "hover:shadow-[0_6px_20px_rgba(44,40,37,0.10)]"),
                )}
                whileTap={{ scale: 0.95 }}
                onClick={() => toggleCategory(cat)}
              >
                <span className="text-2xl mb-1">{meta.emoji}</span>
                <span className={cn(
                  "text-xs font-semibold uppercase tracking-wide",
                  isSelected ? "text-[#5C6B56]" : "text-[#8C8279]"
                )}>
                  {meta.label}
                </span>
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Question Count Slider */}
      <div className="px-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-[#2C2825]">
            How many questions?
          </h2>
          <span className={cn(
            clay.card, clay.shadow,
            "px-3 py-1.5 text-sm font-bold text-[#2C2825]"
          )}>
            {questionCount}
          </span>
        </div>

        <div className={cn("relative py-3 px-1")}>
          <input
            type="range"
            min={5}
            max={15}
            value={questionCount}
            onChange={e => setQuestionCount(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #A8B5A0 0%, #A8B5A0 ${((questionCount - 5) / 10) * 100}%, #E5D9CB ${((questionCount - 5) / 10) * 100}%, #E5D9CB 100%)`,
            }}
          />
          <div className="flex justify-between mt-2">
            <span className="text-[10px] uppercase tracking-wider text-[#B5ADA4] font-medium">5 Questions</span>
            <span className="text-[10px] uppercase tracking-wider text-[#B5ADA4] font-medium">15 Questions</span>
          </div>
        </div>

        <p className="text-center text-xs text-[#8C8279] mt-1">{timeEstimate} estimate</p>
      </div>

      {/* Relationship Pulse */}
      <div className="px-5 mb-6">
        <h2 className="text-base font-bold text-[#2C2825] mb-1">
          Relationship Pulse
        </h2>
        <p className="text-xs text-[#8C8279] mb-3">
          How connected do you feel right now? (1-10)
        </p>

        <div className={cn(clay.card, clay.shadow, "p-4")}>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={1}
              max={10}
              value={relationshipPulse}
              onChange={e => setRelationshipPulse(Number(e.target.value))}
              className="flex-1 h-2 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #A8B5A0 0%, #A8B5A0 ${((relationshipPulse - 1) / 9) * 100}%, #E5D9CB ${((relationshipPulse - 1) / 9) * 100}%, #E5D9CB 100%)`,
              }}
            />
            <span className="text-lg font-bold text-[#5C6B56] w-8 text-center">{relationshipPulse}</span>
          </div>
        </div>
      </div>

      {/* Open Discussion Toggle */}
      <div className="px-5 mb-8">
        <div className={cn(clay.card, clay.shadow, "p-4 flex items-center justify-between")}>
          <span className="text-sm font-medium text-[#2C2825]">
            Include open discussion?
          </span>
          <button
            onClick={() => setIncludeOpenDiscussion(!includeOpenDiscussion)}
            className={cn(
              "w-12 h-7 rounded-full transition-all duration-200 relative",
              includeOpenDiscussion
                ? "bg-[#A8B5A0]"
                : "bg-[#E5D9CB]",
            )}
          >
            <motion.div
              className="w-5 h-5 rounded-full bg-white shadow-sm absolute top-1"
              animate={{ x: includeOpenDiscussion ? 24 : 4 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          </button>
        </div>
      </div>

      {/* Begin Button */}
      <div className="px-5">
        <motion.button
          className={cn(
            "w-full py-4 rounded-full text-base font-bold transition-all duration-200",
            selectedCategories.length > 0
              ? "bg-[#5C6B56] text-white shadow-[0_4px_20px_rgba(92,107,86,0.25)]"
              : "bg-[#E5D9CB] text-[#B5ADA4] cursor-not-allowed",
          )}
          whileTap={selectedCategories.length > 0 ? { scale: 0.98 } : {}}
          onClick={handleBegin}
          disabled={selectedCategories.length === 0 || isCreating}
        >
          {isCreating ? "Setting up..." : "Begin Check-In ⚖️"}
        </motion.button>
      </div>
    </div>
  )
}

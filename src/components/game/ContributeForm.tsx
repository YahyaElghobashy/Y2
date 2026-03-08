"use client"

import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/providers/AuthProvider"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import {
  QUESTION_CATEGORIES,
  CATEGORY_META,
  GAME_MODES,
  GAME_MODE_LABELS,
  ANSWER_TYPES,
  DIFFICULTY_LEVELS,
} from "@/lib/types/game.types"
import type { QuestionCategory, GameMode, AnswerType, DifficultyLevel } from "@/lib/types/game.types"

const clay = {
  card: "rounded-[20px] border border-white/60 bg-white/80 backdrop-blur-sm",
  shadow: "shadow-[0_4px_16px_rgba(44,40,37,0.08),0_1px_4px_rgba(44,40,37,0.04)]",
  shadowLg: "shadow-[0_8px_32px_rgba(44,40,37,0.10),0_2px_8px_rgba(44,40,37,0.05)]",
}

const answerTypeLabels: Record<AnswerType, { label: string; emoji: string }> = {
  open: { label: "Open-ended", emoji: "💬" },
  scale_1_10: { label: "Scale (1-10)", emoji: "📊" },
  yes_no: { label: "Yes / No", emoji: "✅" },
  multiple_choice: { label: "Multiple Choice", emoji: "📝" },
  ranking: { label: "Ranking", emoji: "🏆" },
}

const CONTRIBUTE_COST = 5

type ContributeFormProps = {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function ContributeForm({ isOpen, onClose, onSuccess }: ContributeFormProps) {
  const { user } = useAuth()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseBrowserClient() as any

  const [text, setText] = useState("")
  const [category, setCategory] = useState<QuestionCategory>("communication")
  const [difficulty, setDifficulty] = useState<DifficultyLevel>("light")
  const [answerType, setAnswerType] = useState<AnswerType>("open")
  const [targetModes, setTargetModes] = useState<GameMode[]>(["check_in", "deep_dive"])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggleMode = (mode: GameMode) => {
    setTargetModes(prev =>
      prev.includes(mode) ? prev.filter(m => m !== mode) : [...prev, mode]
    )
  }

  const handleSubmit = useCallback(async () => {
    if (!user || !text.trim() || targetModes.length === 0 || isSubmitting) return
    setIsSubmitting(true)
    setError(null)

    // Insert contribution
    const { error: insertError } = await supabase
      .from("game_contributions")
      .insert({
        user_id: user.id,
        text: text.trim(),
        category,
        difficulty,
        answer_type: answerType,
        target_mode: targetModes[0], // primary mode
        coyyns_spent: CONTRIBUTE_COST,
        status: "pending",
      })

    if (insertError) {
      setError(insertError.message)
      setIsSubmitting(false)
      return
    }

    setIsSubmitting(false)
    setSubmitted(true)
    setTimeout(() => {
      onSuccess?.()
      onClose()
      // Reset
      setText("")
      setSubmitted(false)
    }, 1500)
  }, [user, text, category, difficulty, answerType, targetModes, isSubmitting, supabase, onClose, onSuccess])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className={cn(clay.card, clay.shadowLg, "w-full max-w-lg rounded-t-[24px] rounded-b-none p-5 space-y-4 max-h-[85vh] overflow-y-auto")}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#2C2825]" style={{ fontFamily: "'Playfair Display', serif" }}>
                Contribute a Question
              </h2>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#E5D9CB]/50 flex items-center justify-center">
                <X size={16} className="text-[#8C8279]" />
              </button>
            </div>

            <p className="text-xs text-[#8C8279]">
              Cost: {CONTRIBUTE_COST} 🪙 • Daily limit: 100 🪙
            </p>

            {/* Question text */}
            <div>
              <label className="text-xs font-bold text-[#2C2825] uppercase tracking-wider mb-1.5 block">
                Question
              </label>
              <textarea
                className="w-full h-20 resize-none rounded-xl bg-[#FBF8F4] border border-[#E5D9CB] px-4 py-3 text-sm text-[#2C2825] placeholder:text-[#B5ADA4] focus:outline-none focus:border-[#C4956A]/50"
                placeholder="Write a thoughtful question for couples..."
                value={text}
                onChange={e => setText(e.target.value)}
                maxLength={300}
              />
              <p className="text-[10px] text-[#B5ADA4] text-end">{text.length}/300</p>
            </div>

            {/* Category */}
            <div>
              <label className="text-xs font-bold text-[#2C2825] uppercase tracking-wider mb-1.5 block">
                Category
              </label>
              <div className="flex flex-wrap gap-2">
                {QUESTION_CATEGORIES.slice(0, 8).map(cat => {
                  const meta = CATEGORY_META[cat]
                  return (
                    <button
                      key={cat}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-[10px] font-medium transition-all border",
                        category === cat
                          ? "bg-[#C4956A]/15 text-[#B87333] border-[#C4956A]/30"
                          : "bg-white/60 text-[#8C8279] border-white/80",
                      )}
                      onClick={() => setCategory(cat)}
                    >
                      {meta.emoji} {meta.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Answer Type */}
            <div>
              <label className="text-xs font-bold text-[#2C2825] uppercase tracking-wider mb-1.5 block">
                Answer Type
              </label>
              <div className="flex flex-wrap gap-2">
                {ANSWER_TYPES.slice(0, 4).map(at => {
                  const meta = answerTypeLabels[at]
                  return (
                    <button
                      key={at}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-[10px] font-medium transition-all border",
                        answerType === at
                          ? "bg-[#C4956A]/15 text-[#B87333] border-[#C4956A]/30"
                          : "bg-white/60 text-[#8C8279] border-white/80",
                      )}
                      onClick={() => setAnswerType(at)}
                    >
                      {meta.emoji} {meta.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Suitable Modes */}
            <div>
              <label className="text-xs font-bold text-[#2C2825] uppercase tracking-wider mb-1.5 block">
                Suitable for
              </label>
              <div className="flex gap-2">
                {GAME_MODES.map(m => {
                  const label = GAME_MODE_LABELS[m]
                  const isSelected = targetModes.includes(m)
                  return (
                    <button
                      key={m}
                      className={cn(
                        "flex-1 py-2 rounded-full text-[10px] font-medium transition-all border text-center",
                        isSelected
                          ? "bg-[#C4956A]/15 text-[#B87333] border-[#C4956A]/30"
                          : "bg-white/60 text-[#8C8279] border-white/80",
                      )}
                      onClick={() => toggleMode(m)}
                    >
                      {label.emoji} {label.en.split(" ")[0]}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Difficulty */}
            <div>
              <label className="text-xs font-bold text-[#2C2825] uppercase tracking-wider mb-1.5 block">
                Difficulty
              </label>
              <div className="flex gap-2">
                {DIFFICULTY_LEVELS.map(d => (
                  <button
                    key={d}
                    className={cn(
                      "flex-1 py-2 rounded-full text-xs font-medium transition-all border",
                      difficulty === d
                        ? "bg-[#C4956A]/15 text-[#B87333] border-[#C4956A]/30"
                        : "bg-white/60 text-[#8C8279] border-white/80",
                    )}
                    onClick={() => setDifficulty(d)}
                  >
                    {d === "light" ? "☀️" : d === "medium" ? "🌤️" : "🌊"} {d.charAt(0).toUpperCase() + d.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Error */}
            {error && (
              <p className="text-xs text-[#C75050]">{error}</p>
            )}

            {/* Submit */}
            <motion.button
              className={cn(
                "w-full py-4 rounded-full font-bold text-sm transition-all",
                submitted
                  ? "bg-[#6B9B6B] text-white"
                  : text.trim() && targetModes.length > 0
                    ? "bg-[#C4956A] text-white shadow-[0_4px_20px_rgba(196,149,106,0.25)]"
                    : "bg-[#E5D9CB] text-[#B5ADA4] cursor-not-allowed",
              )}
              whileTap={text.trim() ? { scale: 0.98 } : {}}
              onClick={handleSubmit}
              disabled={!text.trim() || targetModes.length === 0 || isSubmitting || submitted}
            >
              {submitted ? "✓ Submitted for review!" : isSubmitting ? "Submitting..." : `Submit (${CONTRIBUTE_COST} 🪙)`}
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

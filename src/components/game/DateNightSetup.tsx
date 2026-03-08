"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { useGameEngine } from "@/lib/hooks/use-game-engine"
import { CATEGORY_META } from "@/lib/types/game.types"
import type { QuestionCategory, DateNightConfig, HeatLevel } from "@/lib/types/game.types"

const clay = {
  card: "rounded-[20px] border border-white/60 bg-white/80 backdrop-blur-sm",
  shadow: "shadow-[0_4px_16px_rgba(44,40,37,0.08),0_1px_4px_rgba(44,40,37,0.04)]",
  shadowLg: "shadow-[0_8px_32px_rgba(44,40,37,0.10),0_2px_8px_rgba(44,40,37,0.05)]",
  pressed: "active:shadow-[0_1px_4px_rgba(44,40,37,0.06)] active:translate-y-[1px]",
}

const DATE_NIGHT_CATEGORIES: QuestionCategory[] = [
  "love", "communication", "faith", "family",
  "lifestyle", "dreams", "vulnerability", "travel",
]

const HEAT_OPTIONS: { level: HeatLevel; label: string; emoji: string; desc: string }[] = [
  { level: 1, label: "Mild", emoji: "🌶️", desc: "Sweet & playful" },
  { level: 2, label: "Medium", emoji: "🌶️🌶️", desc: "Bold & revealing" },
  { level: 3, label: "Intense", emoji: "🌶️🌶️🌶️", desc: "Deep & vulnerable" },
]

export function DateNightSetup() {
  const router = useRouter()
  const { createSession } = useGameEngine()

  // Wizard state
  const [step, setStep] = useState(1)
  const totalSteps = 3

  // Step 1: Categories
  const [selectedCategories, setSelectedCategories] = useState<QuestionCategory[]>([])
  const [questionsPerCategory, setQuestionsPerCategory] = useState(3)

  // Step 2: Dares
  const [daresEnabled, setDaresEnabled] = useState(true)
  const [maxHeatLevel, setMaxHeatLevel] = useState<HeatLevel>(2)
  const [wildcardCount, setWildcardCount] = useState(3)
  const [truthOrDareEnabled, setTruthOrDareEnabled] = useState(true)

  // Step 3: Custom content
  const [customQuestionsEnabled, setCustomQuestionsEnabled] = useState(true)

  const [isCreating, setIsCreating] = useState(false)

  // Computed
  const totalRounds = useMemo(() => {
    const questionRounds = selectedCategories.length * questionsPerCategory
    const dareRounds = daresEnabled ? wildcardCount : 0
    return questionRounds + dareRounds
  }, [selectedCategories.length, questionsPerCategory, daresEnabled, wildcardCount])

  const timeEstimate = useMemo(() => {
    const mins = Math.round(totalRounds * 1.5)
    return `~${mins} minutes`
  }, [totalRounds])

  const toggleCategory = (cat: QuestionCategory) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    )
  }

  const handleNext = () => {
    if (step < totalSteps) setStep(step + 1)
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
    else router.back()
  }

  const handleStart = async () => {
    if (selectedCategories.length === 0 || isCreating) return
    setIsCreating(true)

    const config: DateNightConfig = {
      categories: selectedCategories,
      questionsPerCategory,
      daresEnabled,
      maxHeatLevel,
      wildcardCount,
      truthOrDareEnabled,
      customQuestionsEnabled,
    }

    const sessionId = await createSession("date_night", config)
    if (!sessionId) {
      setIsCreating(false)
      return
    }

    // If custom questions enabled, go to partner authoring first
    if (customQuestionsEnabled) {
      router.push(`/game/date-night/author?session=${sessionId}`)
    } else {
      router.push(`/game/date-night/play?session=${sessionId}`)
    }
    setIsCreating(false)
  }

  return (
    <div className="min-h-screen pb-8" style={{ background: "linear-gradient(180deg, #FBF8F4 0%, #FDF0F0 100%)" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-6 pb-2">
        <motion.button
          className="w-9 h-9 rounded-full bg-white/70 border border-white/80 flex items-center justify-center shadow-sm"
          whileTap={{ scale: 0.92 }}
          onClick={handleBack}
        >
          <ArrowLeft size={18} className="text-[#2C2825]" />
        </motion.button>
        <div className="flex-1">
          <h1
            className="text-[22px] font-bold text-[#2C2825]"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Date Night Game
          </h1>
          <p className="text-xs text-[#8C8279]" style={{ fontFamily: "'Amiri', serif" }}>
            لعبة — Set up your game
          </p>
        </div>
      </div>

      {/* Progress Dots */}
      <div className="flex items-center justify-center gap-2 py-3">
        {[1, 2, 3].map(s => (
          <motion.div
            key={s}
            className={cn(
              "h-2 rounded-full transition-all duration-300",
              s === step ? "w-8 bg-[#F4A8B8]" : s < step ? "w-2 bg-[#F4A8B8]/60" : "w-2 bg-[#E5D9CB]"
            )}
            layout
          />
        ))}
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="px-5"
          >
            <h2 className="text-base font-bold text-[#2C2825] mb-3">Choose categories</h2>
            <div className="grid grid-cols-3 gap-3 mb-6">
              {DATE_NIGHT_CATEGORIES.map(cat => {
                const meta = CATEGORY_META[cat]
                const isSelected = selectedCategories.includes(cat)
                return (
                  <motion.button
                    key={cat}
                    className={cn(
                      clay.card,
                      "flex flex-col items-center justify-center py-4 px-2 text-center transition-all duration-200",
                      isSelected
                        ? "border-[#B85A6C]/30 bg-[#F4A8B8]/15 shadow-[0_4px_16px_rgba(184,90,108,0.12)]"
                        : cn(clay.shadow),
                    )}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggleCategory(cat)}
                  >
                    <span className="text-2xl mb-1">{meta.emoji}</span>
                    <span className={cn(
                      "text-xs font-semibold",
                      isSelected ? "text-[#B85A6C]" : "text-[#8C8279]"
                    )}>
                      {meta.label}
                    </span>
                  </motion.button>
                )
              })}
            </div>

            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-[#2C2825]">Questions per category</h2>
              <span className={cn(clay.card, clay.shadow, "px-3 py-1.5 text-sm font-bold text-[#2C2825]")}>
                {questionsPerCategory}
              </span>
            </div>
            <input
              type="range"
              min={2}
              max={5}
              value={questionsPerCategory}
              onChange={e => setQuestionsPerCategory(Number(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #F4A8B8 0%, #F4A8B8 ${((questionsPerCategory - 2) / 3) * 100}%, #E5D9CB ${((questionsPerCategory - 2) / 3) * 100}%, #E5D9CB 100%)`,
              }}
            />
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="px-5"
          >
            {/* Dares Toggle */}
            <div className={cn(clay.card, clay.shadow, "p-4 flex items-center justify-between mb-6")}>
              <div>
                <h3 className="text-sm font-bold text-[#2C2825]">Enable Dares 🌶️</h3>
                <p className="text-xs text-[#8C8279]">Add spice with dare cards + CoYYns stakes</p>
              </div>
              <button
                onClick={() => setDaresEnabled(!daresEnabled)}
                className={cn(
                  "w-12 h-7 rounded-full transition-all duration-200 relative",
                  daresEnabled ? "bg-[#F4A8B8]" : "bg-[#E5D9CB]",
                )}
              >
                <motion.div
                  className="w-5 h-5 rounded-full bg-white shadow-sm absolute top-1"
                  animate={{ x: daresEnabled ? 24 : 4 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </button>
            </div>

            {daresEnabled && (
              <>
                {/* Heat Level */}
                <h2 className="text-base font-bold text-[#2C2825] mb-3">Max heat level</h2>
                <div className="space-y-3 mb-6">
                  {HEAT_OPTIONS.map(({ level, label, emoji, desc }) => {
                    const isSelected = maxHeatLevel >= level
                    return (
                      <motion.button
                        key={level}
                        className={cn(
                          clay.card, "w-full text-start p-4 transition-all duration-200",
                          maxHeatLevel === level
                            ? "border-[#B85A6C]/30 bg-[#F4A8B8]/10 shadow-[0_4px_16px_rgba(184,90,108,0.12)]"
                            : cn(clay.shadow),
                        )}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setMaxHeatLevel(level)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{emoji}</span>
                            <div>
                              <h3 className="text-sm font-bold text-[#2C2825]">{label}</h3>
                              <p className="text-xs text-[#8C8279]">{desc}</p>
                            </div>
                          </div>
                          {maxHeatLevel === level && (
                            <div className="w-5 h-5 rounded-full bg-[#F4A8B8] flex items-center justify-center">
                              <span className="text-white text-xs">✓</span>
                            </div>
                          )}
                        </div>
                      </motion.button>
                    )
                  })}
                </div>

                {/* Wildcard Count */}
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-base font-bold text-[#2C2825]">Dare rounds</h2>
                  <span className={cn(clay.card, clay.shadow, "px-3 py-1.5 text-sm font-bold text-[#2C2825]")}>
                    {wildcardCount}
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={8}
                  value={wildcardCount}
                  onChange={e => setWildcardCount(Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer mb-6"
                  style={{
                    background: `linear-gradient(to right, #F4A8B8 0%, #F4A8B8 ${((wildcardCount - 1) / 7) * 100}%, #E5D9CB ${((wildcardCount - 1) / 7) * 100}%, #E5D9CB 100%)`,
                  }}
                />

                {/* Truth or Dare Toggle */}
                <div className={cn(clay.card, clay.shadow, "p-4 flex items-center justify-between")}>
                  <div>
                    <h3 className="text-sm font-bold text-[#2C2825]">Truth or Dare rounds</h3>
                    <p className="text-xs text-[#8C8279]">Choose between truth & dare each round</p>
                  </div>
                  <button
                    onClick={() => setTruthOrDareEnabled(!truthOrDareEnabled)}
                    className={cn(
                      "w-12 h-7 rounded-full transition-all duration-200 relative",
                      truthOrDareEnabled ? "bg-[#F4A8B8]" : "bg-[#E5D9CB]",
                    )}
                  >
                    <motion.div
                      className="w-5 h-5 rounded-full bg-white shadow-sm absolute top-1"
                      animate={{ x: truthOrDareEnabled ? 24 : 4 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="px-5"
          >
            {/* Custom Questions Toggle */}
            <div className={cn(clay.card, clay.shadow, "p-4 flex items-center justify-between mb-6")}>
              <div>
                <h3 className="text-sm font-bold text-[#2C2825]">Write for each other 💌</h3>
                <p className="text-xs text-[#8C8279]">Each partner secretly writes questions & dares</p>
              </div>
              <button
                onClick={() => setCustomQuestionsEnabled(!customQuestionsEnabled)}
                className={cn(
                  "w-12 h-7 rounded-full transition-all duration-200 relative",
                  customQuestionsEnabled ? "bg-[#F4A8B8]" : "bg-[#E5D9CB]",
                )}
              >
                <motion.div
                  className="w-5 h-5 rounded-full bg-white shadow-sm absolute top-1"
                  animate={{ x: customQuestionsEnabled ? 24 : 4 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </button>
            </div>

            {/* Summary Card */}
            <div className={cn(clay.card, clay.shadowLg, "p-5 mb-6 bg-gradient-to-br from-[#F4A8B8]/10 to-[#FADCE3]/20")}>
              <h3 className="text-base font-bold text-[#2C2825] mb-3">Game Preview</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center">
                  <p className="text-2xl font-bold text-[#B85A6C]">{totalRounds}</p>
                  <p className="text-xs text-[#8C8279]">Total Rounds</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-[#B85A6C]">{selectedCategories.length}</p>
                  <p className="text-xs text-[#8C8279]">Categories</p>
                </div>
                {daresEnabled && (
                  <div className="text-center">
                    <p className="text-2xl font-bold text-[#B85A6C]">{wildcardCount}</p>
                    <p className="text-xs text-[#8C8279]">Dares</p>
                  </div>
                )}
                <div className="text-center">
                  <p className="text-sm font-bold text-[#B85A6C]">{timeEstimate}</p>
                  <p className="text-xs text-[#8C8279]">Estimated</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Actions */}
      <div className="px-5 mt-6">
        {step < totalSteps ? (
          <motion.button
            className={cn(
              "w-full py-4 rounded-full text-base font-bold transition-all duration-200",
              (step === 1 && selectedCategories.length > 0) || step > 1
                ? "bg-[#B85A6C] text-white shadow-[0_4px_20px_rgba(184,90,108,0.25)]"
                : "bg-[#E5D9CB] text-[#B5ADA4] cursor-not-allowed",
            )}
            whileTap={(step === 1 && selectedCategories.length > 0) || step > 1 ? { scale: 0.98 } : {}}
            onClick={handleNext}
            disabled={step === 1 && selectedCategories.length === 0}
          >
            Next <ChevronRight size={16} className="inline ms-1" />
          </motion.button>
        ) : (
          <motion.button
            className={cn(
              "w-full py-4 rounded-full text-base font-bold transition-all duration-200",
              selectedCategories.length > 0
                ? "bg-[#B85A6C] text-white shadow-[0_4px_20px_rgba(184,90,108,0.25)]"
                : "bg-[#E5D9CB] text-[#B5ADA4] cursor-not-allowed",
            )}
            whileTap={selectedCategories.length > 0 ? { scale: 0.98 } : {}}
            onClick={handleStart}
            disabled={selectedCategories.length === 0 || isCreating}
          >
            {isCreating
              ? "Preparing..."
              : customQuestionsEnabled
                ? "Write Cards for Partner 💌"
                : "Start Game 🎲"
            }
          </motion.button>
        )}
      </div>
    </div>
  )
}

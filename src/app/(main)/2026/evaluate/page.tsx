"use client"

import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { PageTransition } from "@/components/animations"
import { PageHeader } from "@/components/shared/PageHeader"
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton"
import { EvaluationSlider } from "@/components/vision-board/EvaluationSlider"
import { useVisionBoard } from "@/lib/hooks/use-vision-board"

const EASE_OUT: [number, number, number, number] = [0.25, 0.1, 0.25, 1]
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

export default function EvaluatePage() {
  const router = useRouter()
  const {
    categories,
    isLoading,
    hasEvaluatedThisMonth,
    submitEvaluation,
    myBoard,
  } = useVisionBoard()

  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()
  const monthName = MONTHS[now.getMonth()]

  // Category scores: { [categoryId]: { score, note } }
  const [categoryScores, setCategoryScores] = useState<
    Record<string, { score: number; note: string }>
  >({})
  const [overallScore, setOverallScore] = useState(5)
  const [reflection, setReflection] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialize scores for categories not yet set
  const getScore = (categoryId: string) =>
    categoryScores[categoryId]?.score ?? 5

  const getNote = (categoryId: string) =>
    categoryScores[categoryId]?.note ?? ""

  const updateCategoryScore = (categoryId: string, score: number) => {
    setCategoryScores((prev) => ({
      ...prev,
      [categoryId]: { ...prev[categoryId], score, note: prev[categoryId]?.note ?? "" },
    }))
  }

  const updateCategoryNote = (categoryId: string, note: string) => {
    setCategoryScores((prev) => ({
      ...prev,
      [categoryId]: { ...prev[categoryId], note, score: prev[categoryId]?.score ?? 5 },
    }))
  }

  const categoryAverage = useMemo(() => {
    if (categories.length === 0) return 0
    const total = categories.reduce((sum, cat) => sum + getScore(cat.id), 0)
    return Math.round((total / categories.length) * 10) / 10
  }, [categories, categoryScores])

  const handleSubmit = async () => {
    if (isSubmitting || !myBoard) return
    setIsSubmitting(true)

    const scores = categories.map((cat) => ({
      category_id: cat.id,
      score: getScore(cat.id),
      note: getNote(cat.id) || null,
    }))

    await submitEvaluation({
      boardId: myBoard.id,
      month: currentMonth,
      overallScore,
      reflection: reflection.trim() || undefined,
      categoryScores: scores.map((s) => ({
        categoryId: s.category_id,
        score: s.score,
        note: s.note ?? undefined,
      })),
    })

    setIsSubmitting(false)
    router.push("/2026")
  }

  if (isLoading) {
    return (
      <PageTransition>
        <PageHeader title="Evaluate" backHref="/2026" />
        <LoadingSkeleton variant="full-page" />
      </PageTransition>
    )
  }

  if (hasEvaluatedThisMonth) {
    return (
      <PageTransition>
        <PageHeader title="Evaluate" backHref="/2026" />
        <div className="flex flex-col items-center justify-center py-16 px-5 text-center">
          <span className="text-[40px] mb-3">✅</span>
          <h2 className="text-[20px] font-bold font-[family-name:var(--font-display)] text-[var(--color-text-primary,#2C2825)] mb-2">
            Already evaluated
          </h2>
          <p className="text-[14px] text-[var(--color-text-secondary,#8C8279)]">
            You've already reflected on {monthName}. Come back next month!
          </p>
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <PageHeader title="Evaluate" backHref="/2026" />

      <div className="px-5 pb-8">
        {/* Month header */}
        <div className="mb-6" data-testid="eval-month-header">
          <h2 className="text-[22px] font-bold font-[family-name:var(--font-display)] text-[var(--color-text-primary,#2C2825)]">
            {monthName} {currentYear}
          </h2>
          <p className="text-[13px] text-[var(--color-text-secondary,#8C8279)] mt-1">
            Rate each area of your vision from 1 to 10.
          </p>
        </div>

        {/* Per-category sliders */}
        <div className="flex flex-col gap-6 mb-8">
          {categories.map((cat) => (
            <EvaluationSlider
              key={cat.id}
              label={cat.name}
              icon={cat.icon}
              value={getScore(cat.id)}
              onChange={(score) => updateCategoryScore(cat.id, score)}
              note={getNote(cat.id)}
              onNoteChange={(note) => updateCategoryNote(cat.id, note)}
            />
          ))}
        </div>

        {/* Category average */}
        {categories.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-[var(--color-bg-secondary,#F5F0E8)] mb-6" data-testid="category-average">
            <span className="text-[13px] font-medium text-[var(--color-text-secondary,#8C8279)]">
              Category Average
            </span>
            <span className="text-[18px] font-bold text-[var(--accent-primary,#C4956A)]">
              {categoryAverage}
            </span>
          </div>
        )}

        {/* Overall score */}
        <div className="mb-8">
          <EvaluationSlider
            label="Overall Score"
            icon="⭐"
            value={overallScore}
            onChange={setOverallScore}
          />
        </div>

        {/* Reflection */}
        <div className="mb-8">
          <label className="text-[12px] font-medium text-[var(--color-text-secondary,#8C8279)] mb-1 flex justify-between">
            <span>Reflection</span>
            <span className="text-[var(--color-text-muted,#B5ADA4)]">{reflection.length}/1000</span>
          </label>
          <textarea
            value={reflection}
            onChange={(e) => setReflection(e.target.value.slice(0, 1000))}
            placeholder="How did this month go for your vision?"
            maxLength={1000}
            rows={4}
            className={cn(
              "w-full px-4 py-3 rounded-[10px] text-[14px] resize-none",
              "bg-[var(--color-bg-secondary,#F5F0E8)]",
              "text-[var(--color-text-primary,#2C2825)]",
              "placeholder:text-[var(--color-text-muted,#B5ADA4)]",
              "outline-none focus:ring-2 focus:ring-[var(--accent-primary,#C4956A)]/30"
            )}
            data-testid="reflection-input"
          />
        </div>

        {/* Submit */}
        <motion.button
          className={cn(
            "w-full py-3.5 rounded-xl text-[15px] font-semibold",
            "bg-[var(--accent-primary,#C4956A)] text-white"
          )}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.2, ease: EASE_OUT }}
          onClick={handleSubmit}
          disabled={isSubmitting}
          data-testid="submit-evaluation"
        >
          {isSubmitting ? "Submitting..." : "Submit Reflection"}
        </motion.button>
      </div>
    </PageTransition>
  )
}

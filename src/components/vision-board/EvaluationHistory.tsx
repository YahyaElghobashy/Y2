"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { ScoreChart } from "@/components/vision-board/ScoreChart"
import type { EvaluationWithScores } from "@/lib/types/vision-board.types"

const EASE_OUT: [number, number, number, number] = [0.25, 0.1, 0.25, 1]
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

type EvaluationHistoryProps = {
  evaluations: EvaluationWithScores[]
  partnerEvaluations?: EvaluationWithScores[]
  categoryNames?: Record<string, { name: string; icon: string }>
  className?: string
}

export function EvaluationHistory({
  evaluations,
  partnerEvaluations = [],
  categoryNames = {},
  className,
}: EvaluationHistoryProps) {
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null)

  // Build chart data
  const chartData = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const month = i + 1
      const selfEval = evaluations.find((e) => e.month === month)
      const partnerEval = partnerEvaluations.find((e) => e.month === month)
      return {
        month,
        selfScore: selfEval?.overall_score ?? null,
        partnerScore: partnerEval?.overall_score ?? null,
      }
    })
  }, [evaluations, partnerEvaluations])

  // Selected evaluation detail
  const selectedEval = useMemo(() => {
    if (!selectedMonth) return null
    return evaluations.find((e) => e.month === selectedMonth) ?? null
  }, [selectedMonth, evaluations])

  return (
    <div className={cn("", className)} data-testid="evaluation-history">
      <h3 className="text-[16px] font-semibold font-[family-name:var(--font-display)] text-[var(--color-text-primary,#2C2825)] px-5 mb-3">
        Progress Over Time
      </h3>

      <div className="px-5">
        <ScoreChart
          data={chartData}
          onSelectMonth={setSelectedMonth}
          selectedMonth={selectedMonth}
        />
      </div>

      {/* Month detail breakdown */}
      <AnimatePresence mode="wait">
        {selectedEval && (
          <motion.div
            key={`detail-${selectedMonth}`}
            className="mx-5 mt-4 p-4 rounded-2xl bg-[var(--color-bg-secondary,#F5F0E8)]"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: EASE_OUT }}
            data-testid="month-detail"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-[14px] font-semibold text-[var(--color-text-primary,#2C2825)]">
                {MONTHS[selectedMonth! - 1]}
              </h4>
              <span className="text-[18px] font-bold text-[var(--accent-primary,#C4956A)]">
                {selectedEval.overall_score}/10
              </span>
            </div>

            {/* Category score bars */}
            <div className="flex flex-col gap-2">
              {selectedEval.category_scores.map((cs) => {
                const cat = categoryNames[cs.category_id]
                return (
                  <div key={cs.category_id} className="flex items-center gap-2" data-testid={`cat-score-${cs.category_id}`}>
                    {cat && <span className="text-[14px]">{cat.icon}</span>}
                    <span className="text-[12px] text-[var(--color-text-secondary,#8C8279)] w-16 truncate">
                      {cat?.name ?? "Category"}
                    </span>
                    <div className="flex-1 h-2 rounded-full bg-[var(--color-bg-elevated,#FFFFFF)] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[var(--accent-primary,#C4956A)]"
                        style={{ width: `${(cs.score / 10) * 100}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-medium text-[var(--color-text-secondary,#8C8279)] w-5 text-end">
                      {cs.score}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Reflection excerpt */}
            {selectedEval.reflection && (
              <p className="mt-3 text-[12px] italic text-[var(--color-text-secondary,#8C8279)] line-clamp-3">
                &ldquo;{selectedEval.reflection}&rdquo;
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

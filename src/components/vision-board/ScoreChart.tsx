"use client"

import { useMemo } from "react"
import { cn } from "@/lib/utils"

type MonthScore = {
  month: number // 1-12
  selfScore: number | null
  partnerScore: number | null
}

type ScoreChartProps = {
  data: MonthScore[]
  onSelectMonth?: (month: number) => void
  selectedMonth?: number | null
  className?: string
}

const MONTH_LABELS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"]
const CHART_WIDTH = 320
const CHART_HEIGHT = 160
const PADDING = { top: 16, right: 16, bottom: 24, left: 28 }
const PLOT_W = CHART_WIDTH - PADDING.left - PADDING.right
const PLOT_H = CHART_HEIGHT - PADDING.top - PADDING.bottom

export function ScoreChart({
  data,
  onSelectMonth,
  selectedMonth,
  className,
}: ScoreChartProps) {
  const currentMonth = new Date().getMonth() + 1

  const toX = (month: number) =>
    PADDING.left + ((month - 1) / 11) * PLOT_W

  const toY = (score: number) =>
    PADDING.top + PLOT_H - ((score - 1) / 9) * PLOT_H

  const selfPath = useMemo(() => {
    const points = data.filter((d) => d.selfScore !== null)
    if (points.length < 2) return null
    return points
      .map((d, i) => `${i === 0 ? "M" : "L"} ${toX(d.month)} ${toY(d.selfScore!)}`)
      .join(" ")
  }, [data])

  const partnerPath = useMemo(() => {
    const points = data.filter((d) => d.partnerScore !== null)
    if (points.length < 2) return null
    return points
      .map((d, i) => `${i === 0 ? "M" : "L"} ${toX(d.month)} ${toY(d.partnerScore!)}`)
      .join(" ")
  }, [data])

  return (
    <div className={cn("", className)} data-testid="score-chart">
      <svg
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        className="w-full"
        role="img"
        aria-label="Monthly evaluation scores chart"
      >
        {/* Y-axis grid lines */}
        {[1, 3, 5, 7, 10].map((score) => (
          <g key={`grid-${score}`}>
            <line
              x1={PADDING.left}
              y1={toY(score)}
              x2={CHART_WIDTH - PADDING.right}
              y2={toY(score)}
              stroke="var(--color-border-subtle, #E8E2DA)"
              strokeWidth={0.5}
              strokeDasharray={score === 1 || score === 10 ? "0" : "4 3"}
            />
            <text
              x={PADDING.left - 6}
              y={toY(score) + 3}
              textAnchor="end"
              fontSize={9}
              fill="var(--color-text-muted, #B5ADA4)"
            >
              {score}
            </text>
          </g>
        ))}

        {/* X-axis month labels */}
        {MONTH_LABELS.map((label, i) => {
          const month = i + 1
          const isFuture = month > currentMonth
          return (
            <text
              key={`month-${month}`}
              x={toX(month)}
              y={CHART_HEIGHT - 4}
              textAnchor="middle"
              fontSize={9}
              fill={isFuture ? "var(--color-text-muted, #B5ADA4)" : "var(--color-text-secondary, #8C8279)"}
              opacity={isFuture ? 0.5 : 1}
            >
              {label}
            </text>
          )
        })}

        {/* Self score line */}
        {selfPath && (
          <path
            d={selfPath}
            fill="none"
            stroke="var(--accent-primary, #C4956A)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            data-testid="self-score-line"
          />
        )}

        {/* Partner score line */}
        {partnerPath && (
          <path
            d={partnerPath}
            fill="none"
            stroke="var(--color-text-muted, #B5ADA4)"
            strokeWidth={1.5}
            strokeDasharray="4 3"
            strokeLinecap="round"
            strokeLinejoin="round"
            data-testid="partner-score-line"
          />
        )}

        {/* Data points (self) */}
        {data.map((d) => {
          if (d.selfScore === null) return null
          const isSelected = selectedMonth === d.month
          return (
            <circle
              key={`self-dot-${d.month}`}
              cx={toX(d.month)}
              cy={toY(d.selfScore)}
              r={isSelected ? 5 : 3.5}
              fill="var(--accent-primary, #C4956A)"
              stroke="white"
              strokeWidth={isSelected ? 2 : 1}
              className="cursor-pointer"
              onClick={() => onSelectMonth?.(d.month)}
              data-testid={`self-dot-${d.month}`}
            />
          )
        })}

        {/* Data points (partner) */}
        {data.map((d) => {
          if (d.partnerScore === null) return null
          return (
            <circle
              key={`partner-dot-${d.month}`}
              cx={toX(d.month)}
              cy={toY(d.partnerScore)}
              r={3}
              fill="var(--color-text-muted, #B5ADA4)"
              stroke="white"
              strokeWidth={1}
              data-testid={`partner-dot-${d.month}`}
            />
          )
        })}
      </svg>

      {/* Legend */}
      <div className="flex items-center gap-4 justify-center mt-1">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-[2px] rounded bg-[var(--accent-primary,#C4956A)]" />
          <span className="text-[10px] text-[var(--color-text-secondary,#8C8279)]">You</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-[2px] rounded bg-[var(--color-text-muted,#B5ADA4)] border-dashed" style={{ borderBottom: "1px dashed var(--color-text-muted, #B5ADA4)", height: 0 }} />
          <span className="text-[10px] text-[var(--color-text-secondary,#8C8279)]">Partner</span>
        </div>
      </div>
    </div>
  )
}

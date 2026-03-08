"use client"

import { useEffect, useState, useCallback } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/providers/AuthProvider"
import { useGameEngine } from "@/lib/hooks/use-game-engine"
import type { AnswerHistoryRow } from "@/lib/types/game.types"

const clay = {
  card: "rounded-[20px] border border-white/60 bg-white/80 backdrop-blur-sm",
  shadow: "shadow-[0_4px_16px_rgba(44,40,37,0.08),0_1px_4px_rgba(44,40,37,0.04)]",
}

type AnswerTrajectoryProps = {
  questionId: string
  currentMyAnswer?: number
  currentPartnerAnswer?: number
}

type ChartPoint = {
  date: string
  label: string
  myValue: number | null
  partnerValue: number | null
}

/** Extract scale value from AnswerValue */
function extractScaleValue(answerValue: unknown): number | null {
  if (answerValue && typeof answerValue === "object" && "value" in answerValue) {
    return (answerValue as { value: number }).value
  }
  return null
}

/** Extract text value from AnswerValue */
function extractTextValue(answerValue: unknown): string | null {
  if (answerValue && typeof answerValue === "object" && "text" in answerValue) {
    return (answerValue as { text: string }).text
  }
  return null
}

export function AnswerTrajectory({
  questionId,
  currentMyAnswer,
  currentPartnerAnswer,
}: AnswerTrajectoryProps) {
  const { user, partner } = useAuth()
  const { getAnswerHistory } = useGameEngine()
  const [history, setHistory] = useState<AnswerHistoryRow[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const myName = user?.user_metadata?.display_name ?? "You"
  const partnerName = partner?.display_name ?? "Partner"

  useEffect(() => {
    async function load() {
      const data = await getAnswerHistory(questionId)
      setHistory(data)
      setIsLoading(false)
    }
    load()
  }, [questionId, getAnswerHistory])

  if (isLoading) return null

  // First time answering
  if (history.length === 0) {
    return (
      <motion.div
        className="text-center py-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <p className="text-xs text-[#B5ADA4] italic">
          First time answering this! Your answer will be saved for future comparison.
        </p>
      </motion.div>
    )
  }

  // Group by session to get data points
  const sessionMap = new Map<string, { date: string; myValue: number | null; partnerValue: number | null }>()

  for (const entry of history) {
    const sessionId = entry.session_id
    const existing = sessionMap.get(sessionId) ?? {
      date: entry.created_at,
      myValue: null,
      partnerValue: null,
    }

    const val = extractScaleValue(entry.answer_value)
    if (entry.user_id === user?.id) {
      existing.myValue = val
    } else {
      existing.partnerValue = val
    }

    sessionMap.set(sessionId, existing)
  }

  const points: ChartPoint[] = Array.from(sessionMap.values())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(p => ({
      ...p,
      label: new Date(p.date).toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
    }))

  // Check if we have scale data
  const hasScaleData = points.some(p => p.myValue !== null || p.partnerValue !== null)

  if (!hasScaleData) {
    // Show text timeline for open-ended questions
    const textEntries = history
      .map(h => ({
        date: new Date(h.created_at).toLocaleDateString("en-US", { month: "short" }),
        text: extractTextValue(h.answer_value),
        isMine: h.user_id === user?.id,
      }))
      .filter(e => e.text)

    return (
      <motion.div
        className="space-y-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <p
          className="text-xs text-[#B5ADA4] mb-2"
          style={{ fontFamily: "'Caveat', cursive", fontSize: "14px" }}
        >
          Your history with this question
        </p>
        {textEntries.slice(-4).map((entry, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="text-[10px] text-[#B5ADA4] w-12 shrink-0 mt-0.5">{entry.date}</span>
            <div
              className={cn(
                "text-xs px-3 py-1.5 rounded-xl max-w-[200px]",
                entry.isMine
                  ? "bg-[#B87333]/10 text-[#B87333]"
                  : "bg-[#7EC8E3]/10 text-[#3A7B94]",
              )}
            >
              {entry.text}
            </div>
          </div>
        ))}
      </motion.div>
    )
  }

  // Render SVG line chart for scale data
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <p
        className="text-xs text-[#B5ADA4] mb-2"
        style={{ fontFamily: "'Caveat', cursive", fontSize: "14px" }}
      >
        Your history with this question
      </p>
      <ScaleChart points={points} myName={myName} partnerName={partnerName} />
    </motion.div>
  )
}

// ─── SVG Line Chart ───

function ScaleChart({
  points,
  myName,
  partnerName,
}: {
  points: ChartPoint[]
  myName: string
  partnerName: string
}) {
  const width = 280
  const height = 140
  const padding = { top: 10, right: 15, bottom: 25, left: 25 }
  const chartW = width - padding.left - padding.right
  const chartH = height - padding.top - padding.bottom

  const minY = 1
  const maxY = 10

  const xStep = points.length > 1 ? chartW / (points.length - 1) : chartW

  function toX(i: number) {
    return padding.left + (points.length > 1 ? i * xStep : chartW / 2)
  }
  function toY(val: number) {
    return padding.top + chartH - ((val - minY) / (maxY - minY)) * chartH
  }

  // Build path strings
  const myPoints = points
    .map((p, i) => p.myValue !== null ? `${toX(i)},${toY(p.myValue)}` : null)
    .filter(Boolean)

  const partnerPoints = points
    .map((p, i) => p.partnerValue !== null ? `${toX(i)},${toY(p.partnerValue)}` : null)
    .filter(Boolean)

  const myPath = myPoints.length > 1 ? `M${myPoints.join(" L")}` : ""
  const partnerPath = partnerPoints.length > 1 ? `M${partnerPoints.join(" L")}` : ""

  return (
    <div className={cn(clay.card, clay.shadow, "p-3")}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        {/* Grid lines */}
        {[1, 3, 5, 7, 10].map(v => (
          <g key={v}>
            <line
              x1={padding.left} y1={toY(v)}
              x2={width - padding.right} y2={toY(v)}
              stroke="#E5D9CB" strokeWidth={0.5}
            />
            <text
              x={padding.left - 5} y={toY(v) + 3}
              textAnchor="end" fontSize={8} fill="#B5ADA4"
            >
              {v}
            </text>
          </g>
        ))}

        {/* My line (copper) */}
        {myPath && (
          <motion.path
            d={myPath}
            fill="none"
            stroke="#B87333"
            strokeWidth={2}
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        )}

        {/* Partner line (dusk blue) */}
        {partnerPath && (
          <motion.path
            d={partnerPath}
            fill="none"
            stroke="#7EC8E3"
            strokeWidth={2}
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          />
        )}

        {/* Data points */}
        {points.map((p, i) => (
          <g key={i}>
            {p.myValue !== null && (
              <motion.circle
                cx={toX(i)} cy={toY(p.myValue)} r={3.5}
                fill="#B87333" stroke="white" strokeWidth={1.5}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3 + i * 0.1 }}
              />
            )}
            {p.partnerValue !== null && (
              <motion.circle
                cx={toX(i)} cy={toY(p.partnerValue)} r={3.5}
                fill="#7EC8E3" stroke="white" strokeWidth={1.5}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5 + i * 0.1 }}
              />
            )}
            {/* X-axis label */}
            <text
              x={toX(i)} y={height - 3}
              textAnchor="middle" fontSize={7} fill="#B5ADA4"
            >
              {p.label}
            </text>
          </g>
        ))}
      </svg>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-1">
        <span className="flex items-center gap-1 text-[10px] text-[#8C8279]">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#B87333" }} />
          {myName}
        </span>
        <span className="flex items-center gap-1 text-[10px] text-[#8C8279]">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#7EC8E3" }} />
          {partnerName}
        </span>
      </div>
    </div>
  )
}

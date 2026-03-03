"use client"

import { Sparkles, Heart, Shield } from "lucide-react"
import { cn } from "@/lib/utils"
import { useCycle } from "@/lib/hooks/use-cycle"

type InsightState = "active" | "pms" | "break"

function getInsightState(
  phase: "active" | "break" | null,
  isPMSWindow: boolean,
  isPeriodLikely: boolean
): InsightState | null {
  if (!phase) return null
  if (isPMSWindow) return "pms"
  if (isPeriodLikely || phase === "break") return "break"
  return "active"
}

const INSIGHT_CONFIG: Record<
  InsightState,
  {
    bg: string
    border: string
    icon: typeof Sparkles
    title: string
    message: string
  }
> = {
  active: {
    bg: "bg-[var(--info)]/8",
    border: "border-[var(--info)]/20",
    icon: Sparkles,
    title: "Smooth Sailing",
    message:
      "She's in a great phase right now. Keep the good vibes going with small gestures and quality time together.",
  },
  pms: {
    bg: "bg-[var(--warning)]/8",
    border: "border-[var(--warning)]/20",
    icon: Heart,
    title: "Be Extra Gentle",
    message:
      "PMS window is open. She might feel more sensitive than usual. Extra patience, comfort food, and genuine compliments go a long way.",
  },
  break: {
    bg: "bg-[var(--error)]/8",
    border: "border-[var(--error)]/20",
    icon: Shield,
    title: "Take Care of Her",
    message:
      "Break phase is here. Keep a hot water bottle ready, offer to handle chores, and check in on how she's feeling. Your support means everything.",
  },
}

export function CycleInsightCard({ className }: { className?: string }) {
  const { phase, isPMSWindow, isPeriodLikely, config, isLoading } = useCycle()

  // Yahya-only guard
  if (!config && !isLoading) return null
  if (isLoading) return null
  if (!config || !phase) return null

  const state = getInsightState(phase, isPMSWindow, isPeriodLikely)
  if (!state) return null

  const insight = INSIGHT_CONFIG[state]
  const Icon = insight.icon

  return (
    <div
      className={cn(
        "rounded-[var(--radius-card)] border p-4",
        insight.bg,
        insight.border,
        className
      )}
      data-testid="cycle-insight-card"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          <Icon size={20} strokeWidth={1.5} className="text-text-primary" />
        </div>
        <div className="flex flex-col gap-1">
          <h4
            className="text-[15px] font-semibold font-[var(--font-body)] text-text-primary"
            data-testid="insight-title"
          >
            {insight.title}
          </h4>
          <p
            className="text-[13px] font-[var(--font-body)] text-text-secondary leading-relaxed"
            data-testid="insight-message"
          >
            {insight.message}
          </p>
        </div>
      </div>
    </div>
  )
}

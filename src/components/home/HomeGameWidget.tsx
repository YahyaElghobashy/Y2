"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/providers/AuthProvider"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { GAME_MODE_LABELS, CATEGORY_META } from "@/lib/types/game.types"
import type { GameMode, GameScheduleRow, GameSessionRow } from "@/lib/types/game.types"

const clay = {
  card: "rounded-[20px] border border-white/60 bg-white/80 backdrop-blur-sm",
  shadow: "shadow-[0_4px_16px_rgba(44,40,37,0.08),0_1px_4px_rgba(44,40,37,0.04)]",
  pressed: "active:shadow-[0_1px_4px_rgba(44,40,37,0.06)] active:translate-y-[1px]",
}

const modeAccents: Record<GameMode, string> = {
  check_in: "#5C6B56",
  deep_dive: "#3A7B94",
  date_night: "#B85A6C",
}

type WidgetState = {
  schedule: GameScheduleRow | null
  activeSession: GameSessionRow | null
  isLoading: boolean
}

export function HomeGameWidget() {
  const router = useRouter()
  const { user } = useAuth()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseBrowserClient() as any

  const [state, setState] = useState<WidgetState>({
    schedule: null,
    activeSession: null,
    isLoading: true,
  })

  useEffect(() => {
    if (!user) return

    async function load() {
      // Fetch next due schedule
      const { data: schedules } = await supabase
        .from("game_schedules")
        .select("*")
        .eq("created_by", user!.id)
        .eq("is_active", true)
        .order("next_due_at", { ascending: true })
        .limit(1)

      // Fetch active session
      const { data: sessions } = await supabase
        .from("game_sessions")
        .select("*")
        .or(`created_by.eq.${user!.id},partner_id.eq.${user!.id}`)
        .in("status", ["playing", "paused"])
        .order("updated_at", { ascending: false })
        .limit(1)

      setState({
        schedule: schedules?.[0] ?? null,
        activeSession: sessions?.[0] ?? null,
        isLoading: false,
      })
    }

    load()
  }, [user, supabase])

  if (state.isLoading) return null
  if (!state.schedule && !state.activeSession) return null

  const { schedule, activeSession } = state

  // Active session takes priority
  if (activeSession) {
    const label = GAME_MODE_LABELS[activeSession.mode]
    const isPaused = activeSession.status === "paused"

    return (
      <motion.button
        className={cn(clay.card, clay.shadow, clay.pressed, "w-full p-4 text-start")}
        whileTap={{ scale: 0.98 }}
        onClick={() => router.push(`/game/${activeSession.mode.replace("_", "-")}/play?session=${activeSession.id}`)}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{label.emoji}</span>
          <div className="flex-1">
            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: modeAccents[activeSession.mode] }}>
              {isPaused ? "Paused" : "In Progress"}
            </p>
            <p className="text-sm font-bold text-[#2C2825]">
              {label.en}
            </p>
            <p className="text-xs text-[#8C8279]">
              Round {activeSession.completed_rounds}/{activeSession.total_rounds}
            </p>
          </div>
          <span className="text-sm text-[#C4956A] font-medium">Resume →</span>
        </div>
      </motion.button>
    )
  }

  // Show scheduled game
  if (schedule) {
    const label = GAME_MODE_LABELS[schedule.mode]
    const dueDate = schedule.next_due_at ? new Date(schedule.next_due_at) : null
    const now = new Date()
    const isPastDue = dueDate && dueDate < now

    // Compute relative time
    let timeText = ""
    if (dueDate) {
      const diffMs = dueDate.getTime() - now.getTime()
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
      if (diffDays === 0) timeText = "tonight"
      else if (diffDays === 1) timeText = "tomorrow"
      else if (diffDays > 1) timeText = `in ${diffDays} days`
    }

    // Category for deep dive
    const scheduleConfig = schedule.config as Record<string, unknown> | null
    const categoryRotation = scheduleConfig?.categoryRotation as string[] | undefined
    const deepDiveCategory = schedule.mode === "deep_dive" && categoryRotation?.length
      ? categoryRotation[0]
      : null
    const catMeta = deepDiveCategory ? CATEGORY_META[deepDiveCategory as keyof typeof CATEGORY_META] : null

    return (
      <motion.button
        className={cn(clay.card, clay.shadow, clay.pressed, "w-full p-4 text-start")}
        whileTap={{ scale: 0.98 }}
        onClick={() => router.push("/game")}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{label.emoji}</span>
          <div className="flex-1">
            {isPastDue ? (
              <>
                <p className="text-xs text-[#8C8279] italic leading-relaxed">
                  Your {schedule.mode === "check_in" ? "check-in" : schedule.mode === "deep_dive" ? "deep dive" : "game night"} is overdue.
                  No pressure, whenever you&apos;re ready.
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-[#2C2825]">
                  {schedule.mode === "check_in" && `Monthly Check-In due ${timeText}`}
                  {schedule.mode === "deep_dive" && `Deep Dive ${timeText}${catMeta ? `: ${catMeta.label} ${catMeta.emoji}` : ""}`}
                  {schedule.mode === "date_night" && `Game Night ${timeText}! 🎲`}
                </p>
              </>
            )}
          </div>
        </div>
      </motion.button>
    )
  }

  return null
}

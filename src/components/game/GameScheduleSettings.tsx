"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowLeft, Bell, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/providers/AuthProvider"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { GAME_MODE_LABELS, QUESTION_CATEGORIES, CATEGORY_META } from "@/lib/types/game.types"
import type { GameMode, QuestionCategory, GameScheduleRow } from "@/lib/types/game.types"

const clay = {
  card: "rounded-[20px] border border-white/60 bg-white/80 backdrop-blur-sm",
  shadow: "shadow-[0_4px_16px_rgba(44,40,37,0.08),0_1px_4px_rgba(44,40,37,0.04)]",
  shadowLg: "shadow-[0_8px_32px_rgba(44,40,37,0.10),0_2px_8px_rgba(44,40,37,0.05)]",
  pressed: "active:shadow-[0_1px_4px_rgba(44,40,37,0.06)] active:translate-y-[1px]",
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const RECURRENCES = [
  { value: "weekly" as const, label: "Every week" },
  { value: "biweekly" as const, label: "Every 2 weeks" },
  { value: "monthly" as const, label: "Monthly" },
]

const modeColors: Record<GameMode, string> = {
  check_in: "#5C6B56",
  deep_dive: "#3A7B94",
  date_night: "#B85A6C",
}

export function GameScheduleSettings() {
  const router = useRouter()
  const { user } = useAuth()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseBrowserClient() as any

  const [mode, setMode] = useState<GameMode>("check_in")
  const [recurrence, setRecurrence] = useState<"weekly" | "biweekly" | "monthly">("monthly")
  const [dayOfWeek, setDayOfWeek] = useState(5) // Friday
  const [preferredTime, setPreferredTime] = useState("20:00")
  const [deepDiveCategory, setDeepDiveCategory] = useState<QuestionCategory>("communication")
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = useCallback(async () => {
    if (!user || isSaving) return
    setIsSaving(true)

    const config: Record<string, unknown> = {}
    if (mode === "deep_dive") {
      config.categoryRotation = [deepDiveCategory]
    }

    const { error } = await supabase
      .from("game_schedules")
      .insert({
        created_by: user.id,
        mode,
        recurrence,
        day_of_week: dayOfWeek,
        preferred_time: preferredTime,
        config,
        is_active: true,
        next_due_at: computeNextDue(dayOfWeek, preferredTime),
      })

    setIsSaving(false)
    if (!error) {
      setSaved(true)
      setTimeout(() => router.push("/game"), 1500)
    }
  }, [user, mode, recurrence, dayOfWeek, preferredTime, deepDiveCategory, supabase, isSaving, router])

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
            className="text-[22px] font-bold text-[#2C2825]"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Schedule Game
          </h1>
          <p className="text-xs text-[#8C8279]">Both partners get notified</p>
        </div>
      </div>

      {/* Mode Selection */}
      <div className="px-5 mb-5">
        <h2 className="text-sm font-bold text-[#2C2825] mb-3">What type?</h2>
        <div className="grid grid-cols-3 gap-2">
          {(["check_in", "deep_dive", "date_night"] as GameMode[]).map(m => {
            const label = GAME_MODE_LABELS[m]
            const isSelected = mode === m
            return (
              <motion.button
                key={m}
                className={cn(
                  clay.card,
                  "py-3 px-2 text-center transition-all duration-200",
                  isSelected
                    ? `border-2 shadow-md`
                    : clay.shadow,
                )}
                style={isSelected ? { borderColor: `${modeColors[m]}40` } : {}}
                whileTap={{ scale: 0.97 }}
                onClick={() => setMode(m)}
              >
                <span className="text-xl block mb-1">{label.emoji}</span>
                <span className={cn("text-[10px] font-semibold uppercase tracking-wide",
                  isSelected ? `text-[${modeColors[m]}]` : "text-[#8C8279]"
                )}>
                  {label.en.split(" ")[0]}
                </span>
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Deep dive category selection */}
      {mode === "deep_dive" && (
        <motion.div
          className="px-5 mb-5"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
        >
          <h2 className="text-sm font-bold text-[#2C2825] mb-3">Category to explore</h2>
          <div className="flex flex-wrap gap-2">
            {QUESTION_CATEGORIES.slice(0, 8).map(cat => {
              const meta = CATEGORY_META[cat]
              const isSelected = deepDiveCategory === cat
              return (
                <button
                  key={cat}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                    isSelected
                      ? "bg-[#7EC8E3]/20 text-[#3A7B94] border border-[#7EC8E3]/40"
                      : "bg-white/60 text-[#8C8279] border border-white/80",
                  )}
                  onClick={() => setDeepDiveCategory(cat)}
                >
                  {meta.emoji} {meta.label}
                </button>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* Recurrence */}
      <div className="px-5 mb-5">
        <h2 className="text-sm font-bold text-[#2C2825] mb-3">How often?</h2>
        <div className="flex gap-2">
          {RECURRENCES.map(r => (
            <button
              key={r.value}
              className={cn(
                "flex-1 py-2.5 rounded-full text-xs font-medium transition-all border",
                recurrence === r.value
                  ? "bg-[#C4956A]/15 text-[#B87333] border-[#C4956A]/30"
                  : "bg-white/60 text-[#8C8279] border-white/80",
              )}
              onClick={() => setRecurrence(r.value)}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Day of week */}
      <div className="px-5 mb-5">
        <h2 className="text-sm font-bold text-[#2C2825] mb-3">Preferred day</h2>
        <div className={cn(clay.card, clay.shadow, "p-1 flex gap-0.5 overflow-x-auto")}>
          {DAYS.map((d, i) => (
            <button
              key={d}
              className={cn(
                "flex-1 py-2 rounded-2xl text-[10px] font-medium transition-all min-w-[38px]",
                dayOfWeek === i
                  ? "bg-[#C4956A] text-white shadow-sm"
                  : "text-[#8C8279]",
              )}
              onClick={() => setDayOfWeek(i)}
            >
              {d.slice(0, 3)}
            </button>
          ))}
        </div>
      </div>

      {/* Time */}
      <div className="px-5 mb-8">
        <h2 className="text-sm font-bold text-[#2C2825] mb-3">Preferred time</h2>
        <div className={cn(clay.card, clay.shadow, "p-4")}>
          <input
            type="time"
            value={preferredTime}
            onChange={e => setPreferredTime(e.target.value)}
            className="w-full text-center text-lg font-medium text-[#2C2825] bg-transparent focus:outline-none"
          />
        </div>
      </div>

      {/* Notification preview */}
      <div className="px-5 mb-8">
        <div className={cn(clay.card, clay.shadow, "p-4 flex items-center gap-3")}>
          <Bell size={16} className="text-[#C4956A] shrink-0" />
          <p className="text-xs text-[#8C8279] leading-relaxed">
            {mode === "check_in" && "🪞 Monthly check-in time! How aligned are you?"}
            {mode === "deep_dive" && `🌊 Deep dive tonight: ${CATEGORY_META[deepDiveCategory].label}`}
            {mode === "date_night" && "🎲 Game night! Write your cards for your partner"}
          </p>
        </div>
      </div>

      {/* Save Button */}
      <div className="px-5">
        <motion.button
          className={cn(
            "w-full py-4 rounded-full font-bold text-sm transition-all duration-200",
            saved
              ? "bg-[#6B9B6B] text-white"
              : "bg-[#C4956A] text-white shadow-[0_4px_20px_rgba(196,149,106,0.25)]",
          )}
          whileTap={!saved ? { scale: 0.98 } : {}}
          onClick={handleSave}
          disabled={isSaving || saved}
        >
          {saved ? "✓ Scheduled!" : isSaving ? "Saving..." : "Schedule 📅"}
        </motion.button>
      </div>
    </div>
  )
}

// ─── Utility ───

function computeNextDue(dayOfWeek: number, time: string): string {
  const now = new Date()
  const [hours, mins] = time.split(":").map(Number)

  const target = new Date(now)
  target.setHours(hours, mins, 0, 0)

  // Find next occurrence of the target day
  const currentDay = now.getDay()
  let daysUntil = dayOfWeek - currentDay
  if (daysUntil < 0) daysUntil += 7
  if (daysUntil === 0 && target <= now) daysUntil = 7

  target.setDate(target.getDate() + daysUntil)
  return target.toISOString()
}

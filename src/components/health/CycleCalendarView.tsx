"use client"

import { useState, useMemo } from "react"
import {
  startOfMonth,
  endOfMonth,
  getDay,
  eachDayOfInterval,
  addMonths,
  subMonths,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  differenceInDays,
} from "date-fns"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { useCycle } from "@/lib/hooks/use-cycle"
import type { CyclePhase } from "@/lib/types/health.types"

const EASE_OUT: [number, number, number, number] = [0.25, 0.1, 0.25, 1]
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

function getPhaseForDate(
  date: Date,
  pillStartDate: string,
  activeDays: number,
  breakDays: number,
  pmsWarningDays: number
): { phase: CyclePhase; isPMS: boolean } | null {
  const pillStart = parseISO(pillStartDate)
  const daysSinceStart = differenceInDays(date, pillStart)
  if (daysSinceStart < 0) return null

  const totalCycleDays = activeDays + breakDays
  if (totalCycleDays <= 0) return null

  const currentDay = (daysSinceStart % totalCycleDays) + 1
  const phase: CyclePhase = currentDay <= activeDays ? "active" : "break"
  const daysUntilBreak = phase === "active" ? activeDays - currentDay + 1 : null
  const isPMS = phase === "active" && daysUntilBreak !== null && daysUntilBreak <= pmsWarningDays

  return { phase, isPMS }
}

export function CycleCalendarView({ className }: { className?: string }) {
  const { config, cycleLogs, isLoading } = useCycle()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)

  const days = useMemo(() => {
    const start = startOfMonth(currentMonth)
    const end = endOfMonth(currentMonth)
    return eachDayOfInterval({ start, end })
  }, [currentMonth])

  const startPadding = useMemo(() => getDay(startOfMonth(currentMonth)), [currentMonth])

  // Yahya-only guard
  if (!config && !isLoading) return null
  if (isLoading) return null
  if (!config) return null

  const handlePrev = () => setCurrentMonth((m) => subMonths(m, 1))
  const handleNext = () => setCurrentMonth((m) => addMonths(m, 1))

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: EASE_OUT }}
      className={cn(
        "rounded-[var(--radius-card)] border border-border-subtle bg-bg-elevated p-5",
        className
      )}
      data-testid="cycle-calendar"
    >
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handlePrev}
          className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary"
          aria-label="Previous month"
          data-testid="calendar-prev"
        >
          <ChevronLeft size={18} />
        </button>
        <h3 className="text-[16px] font-semibold font-[var(--font-display)] text-text-primary">
          {format(currentMonth, "MMMM yyyy")}
        </h3>
        <button
          type="button"
          onClick={handleNext}
          className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary"
          aria-label="Next month"
          data-testid="calendar-next"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="mt-4 grid grid-cols-7 gap-1">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="text-center text-[11px] font-medium font-[var(--font-body)] text-text-muted py-1"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="mt-1 grid grid-cols-7 gap-1" data-testid="calendar-grid">
        {/* Padding for start of month */}
        {Array.from({ length: startPadding }, (_, i) => (
          <div key={`pad-${i}`} />
        ))}

        {days.map((day) => {
          const phaseInfo = getPhaseForDate(
            day,
            config.pill_start_date,
            config.active_days,
            config.break_days,
            config.pms_warning_days
          )

          const today = isToday(day)
          const inMonth = isSameMonth(day, currentMonth)
          const isFuture = day > new Date()
          const hasLog = cycleLogs.some((log) => isSameDay(parseISO(log.date), day))
          const isSelected = selectedDay ? isSameDay(day, selectedDay) : false

          let bgClass = ""
          if (phaseInfo) {
            if (phaseInfo.isPMS) bgClass = "bg-[var(--warning)]/10"
            else if (phaseInfo.phase === "break") bgClass = "bg-[var(--error)]/10"
            else bgClass = "bg-accent-soft/40"
          }

          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => setSelectedDay(isSelected ? null : day)}
              className={cn(
                "relative flex h-10 w-full flex-col items-center justify-center rounded-lg text-[13px] font-[var(--font-body)] transition-colors",
                bgClass,
                today && "ring-1 ring-accent-primary",
                !inMonth && "opacity-30",
                isFuture && "opacity-60",
                isSelected && "ring-2 ring-accent-primary"
              )}
              data-testid={`calendar-day-${format(day, "yyyy-MM-dd")}`}
            >
              <span className="text-text-primary">{format(day, "d")}</span>
              {hasLog && (
                <span className="absolute bottom-1 h-1 w-1 rounded-full bg-accent-primary" />
              )}
            </button>
          )
        })}
      </div>

      {/* Selected day detail */}
      <AnimatePresence>
        {selectedDay && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: EASE_OUT }}
            className="mt-3 overflow-hidden"
            data-testid="calendar-detail"
          >
            <div className="rounded-lg border border-border-subtle bg-bg-secondary p-3">
              <p className="text-[13px] font-medium font-[var(--font-body)] text-text-primary">
                {format(selectedDay, "EEEE, MMMM d")}
              </p>
              {(() => {
                const info = getPhaseForDate(
                  selectedDay,
                  config.pill_start_date,
                  config.active_days,
                  config.break_days,
                  config.pms_warning_days
                )
                if (!info) return <p className="text-[12px] text-text-muted font-[var(--font-body)]">Before tracking started</p>
                return (
                  <p className="text-[12px] text-text-secondary font-[var(--font-body)] mt-1">
                    {info.isPMS ? "PMS Window" : info.phase === "active" ? "Active Phase" : "Break Phase"}
                  </p>
                )
              })()}
              {cycleLogs
                .filter((log) => isSameDay(parseISO(log.date), selectedDay))
                .map((log) => (
                  <div key={log.id} className="mt-2 text-[12px] font-[var(--font-body)] text-text-secondary">
                    {log.mood && <p>Mood: {log.mood}</p>}
                    {log.symptoms && log.symptoms.length > 0 && (
                      <p>Symptoms: {log.symptoms.join(", ")}</p>
                    )}
                    {log.notes && <p>{log.notes}</p>}
                  </div>
                ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center gap-3" data-testid="calendar-legend">
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-accent-soft/40" />
          <span className="text-[11px] font-[var(--font-body)] text-text-muted">Active</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-[var(--warning)]/10" />
          <span className="text-[11px] font-[var(--font-body)] text-text-muted">PMS</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-[var(--error)]/10" />
          <span className="text-[11px] font-[var(--font-body)] text-text-muted">Break</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-1 w-1 rounded-full bg-accent-primary" />
          <span className="text-[11px] font-[var(--font-body)] text-text-muted">Logged</span>
        </div>
      </div>
    </motion.div>
  )
}

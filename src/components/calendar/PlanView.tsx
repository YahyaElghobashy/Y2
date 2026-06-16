"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { PosterCard } from "@/components/shared/PosterCard"

/**
 * PlanView — shared calendar (docs/DESIGN_BLUEPRINT.md §4.3). A warm month grid
 * with category event dots + a "Coming up" list. Logistics, but warm. The Lists
 * & Events tabs reuse the same shell. Presentational.
 */
const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"]
const CAT_COLOR: Record<string, string> = {
  date: "var(--color-coral)",
  family: "var(--color-teal)",
  milestone: "var(--color-amber)",
  health: "var(--color-dusty-rose)",
}

/** Optional id so authed callers can route an event tap to its edit route; preview mock omits it. */
export type PlanEvent = { id?: string; day: number; cat: keyof typeof CAT_COLOR; title: string; when: string }
export type PlanData = {
  monthLabel: string
  daysInMonth: number
  leadingBlanks: number
  /** Day-of-month to highlight as "today", or 0/undefined when the displayed month isn't the real month. */
  today: number
  events: PlanEvent[]
  upcoming: PlanEvent[]
}

const TABS = ["Calendar", "Lists", "Events"]

export function PlanView({
  data,
  onAdd,
  onPrevMonth,
  onNextMonth,
  onSelectDay,
  onEditEvent,
}: {
  data: PlanData
  /** Authed page routes this to /us/calendar/create; preview leaves it undefined (FAB is inert there). */
  onAdd?: () => void
  /** Step the displayed month back one. Preview omits it → chevron is inert. */
  onPrevMonth?: () => void
  /** Step the displayed month forward one. Preview omits it → chevron is inert. */
  onNextMonth?: () => void
  /** Tapping a day cell. Preview omits it → cells are non-interactive. */
  onSelectDay?: (day: number) => void
  /** Tapping an event (grid dot row or "Coming up" card). Preview omits it → entries are non-interactive. */
  onEditEvent?: (id: string) => void
}) {
  const [tab, setTab] = useState("Calendar")
  const byDay = new Map<number, PlanEvent[]>()
  data.events.forEach((e) => byDay.set(e.day, [...(byDay.get(e.day) ?? []), e]))

  return (
    <div className="skin-aware min-h-[100dvh] px-5 pb-28 pt-6" style={{ background: "var(--background)" }}>
      <header className="mb-4">
        <p className="text-[19px] leading-none" style={{ fontFamily: "var(--font-arabic)", color: "var(--color-teal-deep)" }}>نخطّط</p>
        <h1 className="mt-1 text-[30px] font-extrabold tracking-tight" style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}>Plan</h1>
      </header>

      <div className="pill-tab-group mb-4">
        {TABS.map((t) => (
          <button key={t} type="button" className={`pill-tab ${tab === t ? "pill-tab-active" : ""}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {tab === "Calendar" && (
        <>
          <PosterCard grain={false} className="!p-4">
            <div className="mb-3 flex items-center justify-between">
              <button
                type="button"
                aria-label="Previous month"
                onClick={onPrevMonth}
                disabled={!onPrevMonth}
                className="grid h-8 w-8 place-items-center rounded-full transition-colors disabled:opacity-40 active:bg-[var(--color-ink-faint)]/15"
                style={{ color: "var(--color-ink-soft)" }}
              >
                <ChevronLeft size={20} />
              </button>
              <span className="text-[16px] font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}>{data.monthLabel}</span>
              <button
                type="button"
                aria-label="Next month"
                onClick={onNextMonth}
                disabled={!onNextMonth}
                className="grid h-8 w-8 place-items-center rounded-full transition-colors disabled:opacity-40 active:bg-[var(--color-ink-faint)]/15"
                style={{ color: "var(--color-ink-soft)" }}
              >
                <ChevronRight size={20} />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-y-1.5">
              {WEEKDAYS.map((d, i) => (
                <span key={i} className="text-center text-[11px] font-bold uppercase" style={{ fontFamily: "var(--font-nav)", color: "var(--color-ink-faint)" }}>{d}</span>
              ))}
              {Array.from({ length: data.leadingBlanks }).map((_, i) => <span key={`b${i}`} />)}
              {Array.from({ length: data.daysInMonth }).map((_, i) => {
                const day = i + 1
                const isToday = day === data.today
                const evs = byDay.get(day) ?? []
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={onSelectDay ? () => onSelectDay(day) : undefined}
                    disabled={!onSelectDay}
                    aria-label={`Day ${day}${evs.length ? `, ${evs.length} event${evs.length > 1 ? "s" : ""}` : ""}`}
                    className="flex flex-col items-center rounded-xl py-0.5 transition-colors disabled:cursor-default enabled:active:bg-[var(--color-ink-faint)]/10"
                  >
                    <span
                      className="grid h-8 w-8 place-items-center rounded-full text-[13px] font-semibold tabular-nums"
                      style={{
                        fontFamily: "var(--font-body)",
                        background: isToday ? "var(--color-terracotta)" : "transparent",
                        color: isToday ? "#FFF7EF" : "var(--foreground)",
                      }}
                    >
                      {day}
                    </span>
                    <span className="mt-0.5 flex h-1.5 items-center gap-0.5">
                      {evs.slice(0, 3).map((e, k) => (
                        <span key={k} className="h-1.5 w-1.5 rounded-full" style={{ background: CAT_COLOR[e.cat] }} />
                      ))}
                    </span>
                  </button>
                )
              })}
            </div>
          </PosterCard>

          <h2 className="mb-2 mt-5 text-[17px] font-bold tracking-tight" style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}>Coming up</h2>
          <div className="grid gap-2.5">
            {data.upcoming.map((e, i) => {
              const editable = !!(onEditEvent && e.id)
              return (
                <PosterCard
                  key={e.id ?? i}
                  grain={false}
                  interactive={editable}
                  onClick={editable ? () => onEditEvent!(e.id!) : undefined}
                  className="flex items-center gap-3 !p-3.5"
                >
                  <span className="h-9 w-1 rounded-full" style={{ background: CAT_COLOR[e.cat] }} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}>{e.title}</span>
                    <span className="block text-[12px]" style={{ color: "var(--color-ink-soft)" }}>{e.when}</span>
                  </span>
                </PosterCard>
              )
            })}
          </div>
        </>
      )}

      {tab !== "Calendar" && (
        <div className="grid gap-2.5">
          {(tab === "Lists" ? ["Groceries", "Bucket list", "Movie nights"] : ["Our engagement party", "Yara's birthday"]).map((t, i) => (
            <PosterCard key={i} grain={false} className="flex items-center justify-between !p-4">
              <span className="text-[15px] font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}>{t}</span>
              <ChevronRight size={18} style={{ color: "var(--color-ink-soft)" }} />
            </PosterCard>
          ))}
        </div>
      )}

      <button type="button" onClick={onAdd} className="fixed bottom-24 right-5 z-30 grid h-14 w-14 place-items-center rounded-full" style={{ background: "var(--color-terracotta)", color: "#FFF7EF", boxShadow: "var(--shadow-glow-copper)" }} aria-label="Add">
        <Plus size={26} strokeWidth={2.5} />
      </button>
    </div>
  )
}

export const PLAN_MOCK: PlanData = {
  monthLabel: "June 2026",
  daysInMonth: 30,
  leadingBlanks: 1,
  today: 16,
  events: [
    { day: 14, cat: "family", title: "Coffee with Mom", when: "Sun 14, 11:00" },
    { day: 18, cat: "date", title: "Rooftop date night", when: "Thu 18, 8:00" },
    { day: 22, cat: "milestone", title: "Anniversary dinner", when: "Mon 22, 9:00" },
    { day: 28, cat: "health", title: "Yara's check-up", when: "Sun 28, 10:30" },
  ],
  upcoming: [
    { day: 18, cat: "date", title: "Rooftop date night", when: "Thu 18 · in 2 days" },
    { day: 22, cat: "milestone", title: "Anniversary dinner", when: "Mon 22 · in 6 days" },
  ],
}

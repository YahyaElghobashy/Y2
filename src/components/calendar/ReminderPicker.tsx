"use client"

import { cn } from "@/lib/utils"
import { Bell } from "lucide-react"
import { REMINDER_PRESETS } from "@/lib/types/calendar.types"

type ReminderPickerProps = {
  selected: string[]          // list of remind_before values currently selected
  onToggle: (value: string) => void
  allDay?: boolean            // hides short-interval options for all-day events
  disabled?: boolean
}

export function ReminderPicker({
  selected,
  onToggle,
  allDay = true,
  disabled = false,
}: ReminderPickerProps) {
  // For all-day events, hide "At time" and "15 min" presets
  const presets = allDay
    ? REMINDER_PRESETS.filter((p) => p.value !== "0 seconds" && p.value !== "15 minutes")
    : REMINDER_PRESETS

  return (
    <div data-testid="reminder-picker">
      <label className="text-[12px] font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
        <Bell size={12} />
        Reminders
      </label>
      <div className="flex flex-wrap gap-2" data-testid="reminder-pills">
        {presets.map((preset) => {
          const isActive = selected.includes(preset.value)
          return (
            <button
              key={preset.value}
              onClick={() => !disabled && onToggle(preset.value)}
              disabled={disabled}
              className={cn(
                "px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors",
                isActive
                  ? "bg-[var(--accent-copper,#B87333)] text-white"
                  : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--accent-soft)]"
              )}
              data-testid={`reminder-${preset.value.replace(/\s/g, "-")}`}
              data-active={isActive}
            >
              {preset.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

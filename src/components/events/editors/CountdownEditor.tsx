"use client"

import { colors } from "@/lib/theme"
import { Switch } from "@/components/ui/switch"
import type { SectionEditorProps } from "./editor-types"
import { fieldStyles } from "./editor-types"

export function CountdownEditor({ content, onContentChange }: SectionEditorProps) {
  const targetDate = (content.target_date as string) ?? ""
  const heading = (content.heading as string) ?? ""
  const showDays = (content.show_days as boolean) ?? true
  const showHours = (content.show_hours as boolean) ?? true
  const showMinutes = (content.show_minutes as boolean) ?? true
  const showSeconds = (content.show_seconds as boolean) ?? true
  const completedText = (content.completed_text as string) ?? ""

  const update = (field: string, value: unknown) => {
    onContentChange({ ...content, [field]: value })
  }

  return (
    <div className="space-y-3" data-testid="countdown-editor">
      <div>
        <label className={fieldStyles.label} style={{ color: colors.text.secondary }}>
          Target Date *
        </label>
        <input
          type="datetime-local"
          value={targetDate}
          onChange={(e) => update("target_date", e.target.value)}
          className={fieldStyles.input}
          style={{ borderColor: colors.bg.parchment, color: colors.text.primary }}
          data-testid="countdown-target-date"
        />
      </div>

      <div>
        <label className={fieldStyles.label} style={{ color: colors.text.secondary }}>
          Heading
        </label>
        <input
          value={heading}
          onChange={(e) => update("heading", e.target.value)}
          className={fieldStyles.input}
          style={{ borderColor: colors.bg.parchment, color: colors.text.primary }}
          placeholder="e.g. Counting down to the big day"
          data-testid="countdown-heading"
        />
      </div>

      <div className="space-y-2">
        <label className={fieldStyles.label} style={{ color: colors.text.secondary }}>
          Display Units
        </label>
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: colors.text.secondary }}>Days</span>
          <Switch checked={showDays} onCheckedChange={(v) => update("show_days", v)} data-testid="countdown-show-days" />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: colors.text.secondary }}>Hours</span>
          <Switch checked={showHours} onCheckedChange={(v) => update("show_hours", v)} data-testid="countdown-show-hours" />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: colors.text.secondary }}>Minutes</span>
          <Switch checked={showMinutes} onCheckedChange={(v) => update("show_minutes", v)} data-testid="countdown-show-minutes" />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: colors.text.secondary }}>Seconds</span>
          <Switch checked={showSeconds} onCheckedChange={(v) => update("show_seconds", v)} data-testid="countdown-show-seconds" />
        </div>
      </div>

      <div>
        <label className={fieldStyles.label} style={{ color: colors.text.secondary }}>
          Completed Text
        </label>
        <input
          value={completedText}
          onChange={(e) => update("completed_text", e.target.value)}
          className={fieldStyles.input}
          style={{ borderColor: colors.bg.parchment, color: colors.text.primary }}
          placeholder="e.g. The day has arrived!"
          data-testid="countdown-completed-text"
        />
      </div>
    </div>
  )
}

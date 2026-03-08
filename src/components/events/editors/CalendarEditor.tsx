"use client"

import { colors } from "@/lib/theme"
import { Switch } from "@/components/ui/switch"
import type { SectionEditorProps } from "./editor-types"
import { fieldStyles } from "./editor-types"

export function CalendarEditor({ content, onContentChange }: SectionEditorProps) {
  const heading = (content.heading as string) ?? ""
  const description = (content.description as string) ?? ""
  const showAddToCalendar = (content.show_add_to_calendar as boolean) ?? true

  const update = (field: string, value: unknown) => {
    onContentChange({ ...content, [field]: value })
  }

  return (
    <div className="space-y-3" data-testid="calendar-editor">
      <div>
        <label className={fieldStyles.label} style={{ color: colors.text.secondary }}>
          Heading
        </label>
        <input
          value={heading}
          onChange={(e) => update("heading", e.target.value)}
          className={fieldStyles.input}
          style={{ borderColor: colors.bg.parchment, color: colors.text.primary }}
          placeholder="e.g. Save the Date"
          data-testid="calendar-heading"
        />
      </div>

      <div>
        <label className={fieldStyles.label} style={{ color: colors.text.secondary }}>
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => update("description", e.target.value)}
          className={fieldStyles.textarea}
          style={{ borderColor: colors.bg.parchment, color: colors.text.primary }}
          placeholder="Additional details about the event date..."
          rows={3}
          data-testid="calendar-description"
        />
      </div>

      <div className="flex items-center justify-between">
        <label className="text-xs font-medium" style={{ color: colors.text.secondary }}>
          Show &quot;Add to Calendar&quot; Button
        </label>
        <Switch
          checked={showAddToCalendar}
          onCheckedChange={(v) => update("show_add_to_calendar", v)}
          data-testid="calendar-show-add"
        />
      </div>

      <p className="text-xs" style={{ color: colors.text.muted }}>
        Events are pulled from your sub-events automatically.
      </p>
    </div>
  )
}

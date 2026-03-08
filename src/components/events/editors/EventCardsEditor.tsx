"use client"

import { colors } from "@/lib/theme"
import { Switch } from "@/components/ui/switch"
import type { SectionEditorProps } from "./editor-types"
import { fieldStyles } from "./editor-types"

export function EventCardsEditor({ content, onContentChange }: SectionEditorProps) {
  const heading = (content.heading as string) ?? ""
  const layout = (content.layout as string) ?? "grid"
  const showMapLink = (content.show_map_link as boolean) ?? false

  const update = (field: string, value: unknown) => {
    onContentChange({ ...content, [field]: value })
  }

  return (
    <div className="space-y-3" data-testid="event-cards-editor">
      <div>
        <label className={fieldStyles.label} style={{ color: colors.text.secondary }}>
          Heading
        </label>
        <input
          value={heading}
          onChange={(e) => update("heading", e.target.value)}
          className={fieldStyles.input}
          style={{ borderColor: colors.bg.parchment, color: colors.text.primary }}
          placeholder="e.g. Our Events"
          data-testid="event-cards-heading"
        />
      </div>

      <div>
        <label className={fieldStyles.label} style={{ color: colors.text.secondary }}>
          Layout
        </label>
        <select
          value={layout}
          onChange={(e) => update("layout", e.target.value)}
          className={fieldStyles.select}
          style={{ borderColor: colors.bg.parchment, color: colors.text.primary }}
          data-testid="event-cards-layout"
        >
          <option value="grid">Grid</option>
          <option value="list">List</option>
          <option value="timeline">Timeline</option>
        </select>
      </div>

      <div className="flex items-center justify-between">
        <label className="text-xs font-medium" style={{ color: colors.text.secondary }}>
          Show Map Link
        </label>
        <Switch
          checked={showMapLink}
          onCheckedChange={(v) => update("show_map_link", v)}
          data-testid="event-cards-show-map"
        />
      </div>

      <p className="text-xs" style={{ color: colors.text.muted }}>
        Event cards are automatically populated from your sub-events.
      </p>
    </div>
  )
}

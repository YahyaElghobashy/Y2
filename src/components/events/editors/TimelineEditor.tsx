"use client"

import { colors } from "@/lib/theme"
import { Plus, Trash2 } from "lucide-react"
import type { SectionEditorProps } from "./editor-types"
import { fieldStyles, removeArrayItem, updateArrayItem } from "./editor-types"

type TimelineItem = {
  time: string
  title: string
  description: string
  icon: string
}

const EMPTY_ITEM: TimelineItem = { time: "", title: "", description: "", icon: "" }

export function TimelineEditor({ content, onContentChange }: SectionEditorProps) {
  const heading = (content.heading as string) ?? ""
  const items = (content.items as TimelineItem[]) ?? []
  const orientation = (content.orientation as string) ?? "vertical"

  const update = (field: string, value: unknown) => {
    onContentChange({ ...content, [field]: value })
  }

  return (
    <div className="space-y-3" data-testid="timeline-editor">
      <div>
        <label className={fieldStyles.label} style={{ color: colors.text.secondary }}>
          Heading
        </label>
        <input
          value={heading}
          onChange={(e) => update("heading", e.target.value)}
          className={fieldStyles.input}
          style={{ borderColor: colors.bg.parchment, color: colors.text.primary }}
          placeholder="e.g. Schedule"
          data-testid="timeline-heading"
        />
      </div>

      <div>
        <label className={fieldStyles.label} style={{ color: colors.text.secondary }}>
          Orientation
        </label>
        <select
          value={orientation}
          onChange={(e) => update("orientation", e.target.value)}
          className={fieldStyles.select}
          style={{ borderColor: colors.bg.parchment, color: colors.text.primary }}
          data-testid="timeline-orientation"
        >
          <option value="vertical">Vertical</option>
          <option value="horizontal">Horizontal</option>
        </select>
      </div>

      <div>
        <label className={fieldStyles.label} style={{ color: colors.text.secondary }}>
          Timeline Items
        </label>
        {items.map((item, i) => (
          <div
            key={i}
            className={fieldStyles.arrayItem}
            style={{ borderColor: colors.bg.parchment }}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium" style={{ color: colors.text.muted }}>
                Item {i + 1}
              </span>
              <button
                onClick={() => update("items", removeArrayItem(items, i))}
                className="p-1 rounded"
                data-testid={`timeline-remove-${i}`}
              >
                <Trash2 className="w-3.5 h-3.5" style={{ color: colors.functional.error }} />
              </button>
            </div>
            <input
              value={item.time ?? ""}
              onChange={(e) => update("items", updateArrayItem(items, i, "time", e.target.value))}
              className={fieldStyles.input}
              style={{ borderColor: colors.bg.parchment, color: colors.text.primary }}
              placeholder="Time (e.g. 2:00 PM)"
              data-testid={`timeline-time-${i}`}
            />
            <input
              value={item.title}
              onChange={(e) => update("items", updateArrayItem(items, i, "title", e.target.value))}
              className={fieldStyles.input}
              style={{ borderColor: colors.bg.parchment, color: colors.text.primary }}
              placeholder="Title *"
              data-testid={`timeline-title-${i}`}
            />
            <textarea
              value={item.description ?? ""}
              onChange={(e) =>
                update("items", updateArrayItem(items, i, "description", e.target.value))
              }
              className={fieldStyles.textarea}
              style={{ borderColor: colors.bg.parchment, color: colors.text.primary }}
              placeholder="Description"
              rows={2}
              data-testid={`timeline-desc-${i}`}
            />
            <input
              value={item.icon ?? ""}
              onChange={(e) => update("items", updateArrayItem(items, i, "icon", e.target.value))}
              className={fieldStyles.input}
              style={{ borderColor: colors.bg.parchment, color: colors.text.primary }}
              placeholder="Icon (emoji)"
              data-testid={`timeline-icon-${i}`}
            />
          </div>
        ))}
        <button
          onClick={() => update("items", [...items, { ...EMPTY_ITEM }])}
          className={fieldStyles.addBtn}
          style={{ borderColor: colors.bg.parchment, color: colors.text.secondary }}
          data-testid="timeline-add-item"
        >
          <Plus className="w-3.5 h-3.5 inline me-1" />
          Add Timeline Item
        </button>
      </div>
    </div>
  )
}

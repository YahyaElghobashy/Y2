"use client"

import { colors } from "@/lib/theme"
import { Plus, Trash2 } from "lucide-react"
import type { SectionEditorProps } from "./editor-types"
import { fieldStyles, removeArrayItem, updateArrayItem } from "./editor-types"

type TransportSection = {
  mode: string
  title: string
  description: string
  tips: string[]
  links: { label: string; url: string }[]
}

const EMPTY_SECTION: TransportSection = {
  mode: "car",
  title: "",
  description: "",
  tips: [],
  links: [],
}

export function TransportEditor({ content, onContentChange }: SectionEditorProps) {
  const heading = (content.heading as string) ?? ""
  const sections = (content.sections as TransportSection[]) ?? []

  const update = (field: string, value: unknown) => {
    onContentChange({ ...content, [field]: value })
  }

  return (
    <div className="space-y-3" data-testid="transport-editor">
      <div>
        <label className={fieldStyles.label} style={{ color: colors.text.secondary }}>
          Heading
        </label>
        <input
          value={heading}
          onChange={(e) => update("heading", e.target.value)}
          className={fieldStyles.input}
          style={{ borderColor: colors.bg.parchment, color: colors.text.primary }}
          placeholder="e.g. Getting There"
          data-testid="transport-heading"
        />
      </div>

      <div>
        <label className={fieldStyles.label} style={{ color: colors.text.secondary }}>
          Transport Options
        </label>
        {sections.map((section, i) => (
          <div
            key={i}
            className={fieldStyles.arrayItem}
            style={{ borderColor: colors.bg.parchment }}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium" style={{ color: colors.text.muted }}>
                Option {i + 1}
              </span>
              <button
                onClick={() => update("sections", removeArrayItem(sections, i))}
                className="p-1 rounded"
                data-testid={`transport-remove-${i}`}
              >
                <Trash2 className="w-3.5 h-3.5" style={{ color: colors.functional.error }} />
              </button>
            </div>
            <select
              value={section.mode}
              onChange={(e) =>
                update("sections", updateArrayItem(sections, i, "mode", e.target.value))
              }
              className={fieldStyles.select}
              style={{ borderColor: colors.bg.parchment, color: colors.text.primary }}
              data-testid={`transport-mode-${i}`}
            >
              <option value="car">Car</option>
              <option value="flight">Flight</option>
              <option value="train">Train</option>
              <option value="bus">Bus</option>
              <option value="taxi">Taxi</option>
              <option value="other">Other</option>
            </select>
            <input
              value={section.title}
              onChange={(e) =>
                update("sections", updateArrayItem(sections, i, "title", e.target.value))
              }
              className={fieldStyles.input}
              style={{ borderColor: colors.bg.parchment, color: colors.text.primary }}
              placeholder="Title *"
              data-testid={`transport-title-${i}`}
            />
            <textarea
              value={section.description}
              onChange={(e) =>
                update("sections", updateArrayItem(sections, i, "description", e.target.value))
              }
              className={fieldStyles.textarea}
              style={{ borderColor: colors.bg.parchment, color: colors.text.primary }}
              placeholder="Description *"
              rows={2}
              data-testid={`transport-desc-${i}`}
            />
          </div>
        ))}
        <button
          onClick={() => update("sections", [...sections, { ...EMPTY_SECTION }])}
          className={fieldStyles.addBtn}
          style={{ borderColor: colors.bg.parchment, color: colors.text.secondary }}
          data-testid="transport-add"
        >
          <Plus className="w-3.5 h-3.5 inline me-1" />
          Add Transport Option
        </button>
      </div>
    </div>
  )
}

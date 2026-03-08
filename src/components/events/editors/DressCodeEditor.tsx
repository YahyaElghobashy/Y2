"use client"

import { colors } from "@/lib/theme"
import { Plus, Trash2 } from "lucide-react"
import type { SectionEditorProps } from "./editor-types"
import { fieldStyles, removeArrayItem, updateArrayItem } from "./editor-types"

type DressCodeItem = {
  event_title: string
  code: string
  description: string
  color_palette: string[]
  image_url: string
}

const EMPTY_ITEM: DressCodeItem = {
  event_title: "",
  code: "",
  description: "",
  color_palette: [],
  image_url: "",
}

export function DressCodeEditor({ content, onContentChange }: SectionEditorProps) {
  const heading = (content.heading as string) ?? ""
  const description = (content.description as string) ?? ""
  const dressCodes = (content.dress_codes as DressCodeItem[]) ?? []

  const update = (field: string, value: unknown) => {
    onContentChange({ ...content, [field]: value })
  }

  return (
    <div className="space-y-3" data-testid="dress-code-editor">
      <div>
        <label className={fieldStyles.label} style={{ color: colors.text.secondary }}>
          Heading
        </label>
        <input
          value={heading}
          onChange={(e) => update("heading", e.target.value)}
          className={fieldStyles.input}
          style={{ borderColor: colors.bg.parchment, color: colors.text.primary }}
          placeholder="e.g. What to Wear"
          data-testid="dress-code-heading"
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
          placeholder="General dress code guidance..."
          rows={2}
          data-testid="dress-code-description"
        />
      </div>

      <div>
        <label className={fieldStyles.label} style={{ color: colors.text.secondary }}>
          Dress Codes
        </label>
        {dressCodes.map((item, i) => (
          <div
            key={i}
            className={fieldStyles.arrayItem}
            style={{ borderColor: colors.bg.parchment }}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium" style={{ color: colors.text.muted }}>
                Dress Code {i + 1}
              </span>
              <button
                onClick={() => update("dress_codes", removeArrayItem(dressCodes, i))}
                className="p-1 rounded"
                data-testid={`dress-code-remove-${i}`}
              >
                <Trash2 className="w-3.5 h-3.5" style={{ color: colors.functional.error }} />
              </button>
            </div>
            <input
              value={item.event_title}
              onChange={(e) =>
                update("dress_codes", updateArrayItem(dressCodes, i, "event_title", e.target.value))
              }
              className={fieldStyles.input}
              style={{ borderColor: colors.bg.parchment, color: colors.text.primary }}
              placeholder="Event Title *"
              data-testid={`dress-code-event-${i}`}
            />
            <input
              value={item.code}
              onChange={(e) =>
                update("dress_codes", updateArrayItem(dressCodes, i, "code", e.target.value))
              }
              className={fieldStyles.input}
              style={{ borderColor: colors.bg.parchment, color: colors.text.primary }}
              placeholder="Dress Code * (e.g. Black Tie)"
              data-testid={`dress-code-code-${i}`}
            />
            <textarea
              value={item.description ?? ""}
              onChange={(e) =>
                update("dress_codes", updateArrayItem(dressCodes, i, "description", e.target.value))
              }
              className={fieldStyles.textarea}
              style={{ borderColor: colors.bg.parchment, color: colors.text.primary }}
              placeholder="Description"
              rows={2}
              data-testid={`dress-code-desc-${i}`}
            />
            <input
              value={item.image_url ?? ""}
              onChange={(e) =>
                update("dress_codes", updateArrayItem(dressCodes, i, "image_url", e.target.value))
              }
              className={fieldStyles.input}
              style={{ borderColor: colors.bg.parchment, color: colors.text.primary }}
              placeholder="Image URL"
              data-testid={`dress-code-image-${i}`}
            />
          </div>
        ))}
        <button
          onClick={() => update("dress_codes", [...dressCodes, { ...EMPTY_ITEM }])}
          className={fieldStyles.addBtn}
          style={{ borderColor: colors.bg.parchment, color: colors.text.secondary }}
          data-testid="dress-code-add"
        >
          <Plus className="w-3.5 h-3.5 inline me-1" />
          Add Dress Code
        </button>
      </div>
    </div>
  )
}

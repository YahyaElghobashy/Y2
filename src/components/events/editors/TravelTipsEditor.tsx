"use client"

import { colors } from "@/lib/theme"
import { Plus, Trash2 } from "lucide-react"
import type { SectionEditorProps } from "./editor-types"
import { fieldStyles, removeArrayItem, updateArrayItem } from "./editor-types"

type TravelTip = {
  title: string
  body: string
  icon: string
  category: string
}

const EMPTY_TIP: TravelTip = { title: "", body: "", icon: "", category: "general" }

export function TravelTipsEditor({ content, onContentChange }: SectionEditorProps) {
  const heading = (content.heading as string) ?? ""
  const tips = (content.tips as TravelTip[]) ?? []

  const update = (field: string, value: unknown) => {
    onContentChange({ ...content, [field]: value })
  }

  return (
    <div className="space-y-3" data-testid="travel-tips-editor">
      <div>
        <label className={fieldStyles.label} style={{ color: colors.text.secondary }}>
          Heading
        </label>
        <input
          value={heading}
          onChange={(e) => update("heading", e.target.value)}
          className={fieldStyles.input}
          style={{ borderColor: colors.bg.parchment, color: colors.text.primary }}
          placeholder="e.g. Travel Tips"
          data-testid="travel-tips-heading"
        />
      </div>

      <div>
        <label className={fieldStyles.label} style={{ color: colors.text.secondary }}>
          Tips
        </label>
        {tips.map((tip, i) => (
          <div
            key={i}
            className={fieldStyles.arrayItem}
            style={{ borderColor: colors.bg.parchment }}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium" style={{ color: colors.text.muted }}>
                Tip {i + 1}
              </span>
              <button
                onClick={() => update("tips", removeArrayItem(tips, i))}
                className="p-1 rounded"
                data-testid={`travel-tips-remove-${i}`}
              >
                <Trash2 className="w-3.5 h-3.5" style={{ color: colors.functional.error }} />
              </button>
            </div>
            <select
              value={tip.category ?? "general"}
              onChange={(e) =>
                update("tips", updateArrayItem(tips, i, "category", e.target.value))
              }
              className={fieldStyles.select}
              style={{ borderColor: colors.bg.parchment, color: colors.text.primary }}
              data-testid={`travel-tips-category-${i}`}
            >
              <option value="visa">Visa</option>
              <option value="weather">Weather</option>
              <option value="currency">Currency</option>
              <option value="safety">Safety</option>
              <option value="culture">Culture</option>
              <option value="general">General</option>
            </select>
            <input
              value={tip.title}
              onChange={(e) =>
                update("tips", updateArrayItem(tips, i, "title", e.target.value))
              }
              className={fieldStyles.input}
              style={{ borderColor: colors.bg.parchment, color: colors.text.primary }}
              placeholder="Tip Title *"
              data-testid={`travel-tips-title-${i}`}
            />
            <textarea
              value={tip.body}
              onChange={(e) =>
                update("tips", updateArrayItem(tips, i, "body", e.target.value))
              }
              className={fieldStyles.textarea}
              style={{ borderColor: colors.bg.parchment, color: colors.text.primary }}
              placeholder="Tip Body *"
              rows={2}
              data-testid={`travel-tips-body-${i}`}
            />
          </div>
        ))}
        <button
          onClick={() => update("tips", [...tips, { ...EMPTY_TIP }])}
          className={fieldStyles.addBtn}
          style={{ borderColor: colors.bg.parchment, color: colors.text.secondary }}
          data-testid="travel-tips-add"
        >
          <Plus className="w-3.5 h-3.5 inline me-1" />
          Add Tip
        </button>
      </div>
    </div>
  )
}

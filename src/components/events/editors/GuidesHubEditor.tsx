"use client"

import { colors } from "@/lib/theme"
import { Plus, Trash2 } from "lucide-react"
import type { SectionEditorProps } from "./editor-types"
import { fieldStyles, removeArrayItem, updateArrayItem } from "./editor-types"

type GuideItem = {
  title: string
  description: string
  image_url: string
  url: string
  category: string
}

const EMPTY_GUIDE: GuideItem = {
  title: "",
  description: "",
  image_url: "",
  url: "",
  category: "",
}

export function GuidesHubEditor({ content, onContentChange }: SectionEditorProps) {
  const heading = (content.heading as string) ?? ""
  const description = (content.description as string) ?? ""
  const guides = (content.guides as GuideItem[]) ?? []

  const update = (field: string, value: unknown) => {
    onContentChange({ ...content, [field]: value })
  }

  return (
    <div className="space-y-3" data-testid="guides-hub-editor">
      <div>
        <label className={fieldStyles.label} style={{ color: colors.text.secondary }}>
          Heading
        </label>
        <input
          value={heading}
          onChange={(e) => update("heading", e.target.value)}
          className={fieldStyles.input}
          style={{ borderColor: colors.bg.parchment, color: colors.text.primary }}
          placeholder="e.g. Helpful Guides"
          data-testid="guides-hub-heading"
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
          placeholder="Introduce your guides..."
          rows={2}
          data-testid="guides-hub-description"
        />
      </div>

      <div>
        <label className={fieldStyles.label} style={{ color: colors.text.secondary }}>
          Guides
        </label>
        {guides.map((guide, i) => (
          <div
            key={i}
            className={fieldStyles.arrayItem}
            style={{ borderColor: colors.bg.parchment }}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium" style={{ color: colors.text.muted }}>
                Guide {i + 1}
              </span>
              <button
                onClick={() => update("guides", removeArrayItem(guides, i))}
                className="p-1 rounded"
                data-testid={`guides-hub-remove-${i}`}
              >
                <Trash2 className="w-3.5 h-3.5" style={{ color: colors.functional.error }} />
              </button>
            </div>
            <input
              value={guide.title}
              onChange={(e) =>
                update("guides", updateArrayItem(guides, i, "title", e.target.value))
              }
              className={fieldStyles.input}
              style={{ borderColor: colors.bg.parchment, color: colors.text.primary }}
              placeholder="Guide Title *"
              data-testid={`guides-hub-title-${i}`}
            />
            <textarea
              value={guide.description ?? ""}
              onChange={(e) =>
                update("guides", updateArrayItem(guides, i, "description", e.target.value))
              }
              className={fieldStyles.textarea}
              style={{ borderColor: colors.bg.parchment, color: colors.text.primary }}
              placeholder="Description"
              rows={2}
              data-testid={`guides-hub-desc-${i}`}
            />
            <input
              value={guide.url ?? ""}
              onChange={(e) =>
                update("guides", updateArrayItem(guides, i, "url", e.target.value))
              }
              className={fieldStyles.input}
              style={{ borderColor: colors.bg.parchment, color: colors.text.primary }}
              placeholder="Link URL"
              data-testid={`guides-hub-url-${i}`}
            />
            <input
              value={guide.image_url ?? ""}
              onChange={(e) =>
                update("guides", updateArrayItem(guides, i, "image_url", e.target.value))
              }
              className={fieldStyles.input}
              style={{ borderColor: colors.bg.parchment, color: colors.text.primary }}
              placeholder="Image URL"
              data-testid={`guides-hub-image-${i}`}
            />
          </div>
        ))}
        <button
          onClick={() => update("guides", [...guides, { ...EMPTY_GUIDE }])}
          className={fieldStyles.addBtn}
          style={{ borderColor: colors.bg.parchment, color: colors.text.secondary }}
          data-testid="guides-hub-add"
        >
          <Plus className="w-3.5 h-3.5 inline me-1" />
          Add Guide
        </button>
      </div>
    </div>
  )
}

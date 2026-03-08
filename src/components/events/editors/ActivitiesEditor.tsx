"use client"

import { colors } from "@/lib/theme"
import { Plus, Trash2 } from "lucide-react"
import type { SectionEditorProps } from "./editor-types"
import { fieldStyles, removeArrayItem, updateArrayItem } from "./editor-types"

type ActivityItem = {
  name: string
  description: string
  image_url: string
  duration: string
  price: string
  url: string
  category: string
}

const EMPTY_ACTIVITY: ActivityItem = {
  name: "",
  description: "",
  image_url: "",
  duration: "",
  price: "",
  url: "",
  category: "",
}

export function ActivitiesEditor({ content, onContentChange }: SectionEditorProps) {
  const heading = (content.heading as string) ?? ""
  const activities = (content.activities as ActivityItem[]) ?? []

  const update = (field: string, value: unknown) => {
    onContentChange({ ...content, [field]: value })
  }

  return (
    <div className="space-y-3" data-testid="activities-editor">
      <div>
        <label className={fieldStyles.label} style={{ color: colors.text.secondary }}>
          Heading
        </label>
        <input
          value={heading}
          onChange={(e) => update("heading", e.target.value)}
          className={fieldStyles.input}
          style={{ borderColor: colors.bg.parchment, color: colors.text.primary }}
          placeholder="e.g. Things to Do"
          data-testid="activities-heading"
        />
      </div>

      <div>
        <label className={fieldStyles.label} style={{ color: colors.text.secondary }}>
          Activities
        </label>
        {activities.map((item, i) => (
          <div
            key={i}
            className={fieldStyles.arrayItem}
            style={{ borderColor: colors.bg.parchment }}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium" style={{ color: colors.text.muted }}>
                Activity {i + 1}
              </span>
              <button
                onClick={() => update("activities", removeArrayItem(activities, i))}
                className="p-1 rounded"
                data-testid={`activities-remove-${i}`}
              >
                <Trash2 className="w-3.5 h-3.5" style={{ color: colors.functional.error }} />
              </button>
            </div>
            <input
              value={item.name}
              onChange={(e) =>
                update("activities", updateArrayItem(activities, i, "name", e.target.value))
              }
              className={fieldStyles.input}
              style={{ borderColor: colors.bg.parchment, color: colors.text.primary }}
              placeholder="Activity Name *"
              data-testid={`activities-name-${i}`}
            />
            <textarea
              value={item.description ?? ""}
              onChange={(e) =>
                update("activities", updateArrayItem(activities, i, "description", e.target.value))
              }
              className={fieldStyles.textarea}
              style={{ borderColor: colors.bg.parchment, color: colors.text.primary }}
              placeholder="Description"
              rows={2}
              data-testid={`activities-desc-${i}`}
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                value={item.duration ?? ""}
                onChange={(e) =>
                  update("activities", updateArrayItem(activities, i, "duration", e.target.value))
                }
                className={fieldStyles.input}
                style={{ borderColor: colors.bg.parchment, color: colors.text.primary }}
                placeholder="Duration"
                data-testid={`activities-duration-${i}`}
              />
              <input
                value={item.price ?? ""}
                onChange={(e) =>
                  update("activities", updateArrayItem(activities, i, "price", e.target.value))
                }
                className={fieldStyles.input}
                style={{ borderColor: colors.bg.parchment, color: colors.text.primary }}
                placeholder="Price"
                data-testid={`activities-price-${i}`}
              />
            </div>
            <input
              value={item.url ?? ""}
              onChange={(e) =>
                update("activities", updateArrayItem(activities, i, "url", e.target.value))
              }
              className={fieldStyles.input}
              style={{ borderColor: colors.bg.parchment, color: colors.text.primary }}
              placeholder="Website URL"
              data-testid={`activities-url-${i}`}
            />
          </div>
        ))}
        <button
          onClick={() => update("activities", [...activities, { ...EMPTY_ACTIVITY }])}
          className={fieldStyles.addBtn}
          style={{ borderColor: colors.bg.parchment, color: colors.text.secondary }}
          data-testid="activities-add"
        >
          <Plus className="w-3.5 h-3.5 inline me-1" />
          Add Activity
        </button>
      </div>
    </div>
  )
}

"use client"

import { colors } from "@/lib/theme"
import { Plus, Trash2 } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import type { SectionEditorProps } from "./editor-types"
import { fieldStyles, removeArrayItem, updateArrayItem } from "./editor-types"

type ExternalRegistry = {
  name: string
  url: string
  image_url: string
}

const EMPTY_REGISTRY: ExternalRegistry = { name: "", url: "", image_url: "" }

export function GiftRegistryEditor({ content, onContentChange }: SectionEditorProps) {
  const heading = (content.heading as string) ?? ""
  const description = (content.description as string) ?? ""
  const showExternalRegistries = (content.show_external_registries as boolean) ?? false
  const externalRegistries = (content.external_registries as ExternalRegistry[]) ?? []

  const update = (field: string, value: unknown) => {
    onContentChange({ ...content, [field]: value })
  }

  return (
    <div className="space-y-3" data-testid="gift-registry-editor">
      <div>
        <label className={fieldStyles.label} style={{ color: colors.text.secondary }}>
          Heading
        </label>
        <input
          value={heading}
          onChange={(e) => update("heading", e.target.value)}
          className={fieldStyles.input}
          style={{ borderColor: colors.bg.parchment, color: colors.text.primary }}
          placeholder="e.g. Gift Registry"
          data-testid="gift-registry-heading"
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
          placeholder="Your presence is the greatest gift..."
          rows={2}
          data-testid="gift-registry-description"
        />
      </div>

      <div className="flex items-center justify-between">
        <label className="text-xs font-medium" style={{ color: colors.text.secondary }}>
          Show External Registries
        </label>
        <Switch
          checked={showExternalRegistries}
          onCheckedChange={(v) => update("show_external_registries", v)}
          data-testid="gift-registry-show-external"
        />
      </div>

      {showExternalRegistries && (
        <div>
          <label className={fieldStyles.label} style={{ color: colors.text.secondary }}>
            External Registries
          </label>
          {externalRegistries.map((reg, i) => (
            <div
              key={i}
              className={fieldStyles.arrayItem}
              style={{ borderColor: colors.bg.parchment }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium" style={{ color: colors.text.muted }}>
                  Registry {i + 1}
                </span>
                <button
                  onClick={() =>
                    update("external_registries", removeArrayItem(externalRegistries, i))
                  }
                  className="p-1 rounded"
                  data-testid={`gift-registry-remove-${i}`}
                >
                  <Trash2 className="w-3.5 h-3.5" style={{ color: colors.functional.error }} />
                </button>
              </div>
              <input
                value={reg.name}
                onChange={(e) =>
                  update(
                    "external_registries",
                    updateArrayItem(externalRegistries, i, "name", e.target.value)
                  )
                }
                className={fieldStyles.input}
                style={{ borderColor: colors.bg.parchment, color: colors.text.primary }}
                placeholder="Registry Name *"
                data-testid={`gift-registry-name-${i}`}
              />
              <input
                value={reg.url}
                onChange={(e) =>
                  update(
                    "external_registries",
                    updateArrayItem(externalRegistries, i, "url", e.target.value)
                  )
                }
                className={fieldStyles.input}
                style={{ borderColor: colors.bg.parchment, color: colors.text.primary }}
                placeholder="Registry URL *"
                data-testid={`gift-registry-url-${i}`}
              />
              <input
                value={reg.image_url ?? ""}
                onChange={(e) =>
                  update(
                    "external_registries",
                    updateArrayItem(externalRegistries, i, "image_url", e.target.value)
                  )
                }
                className={fieldStyles.input}
                style={{ borderColor: colors.bg.parchment, color: colors.text.primary }}
                placeholder="Logo Image URL"
                data-testid={`gift-registry-image-${i}`}
              />
            </div>
          ))}
          <button
            onClick={() =>
              update("external_registries", [...externalRegistries, { ...EMPTY_REGISTRY }])
            }
            className={fieldStyles.addBtn}
            style={{ borderColor: colors.bg.parchment, color: colors.text.secondary }}
            data-testid="gift-registry-add"
          >
            <Plus className="w-3.5 h-3.5 inline me-1" />
            Add Registry
          </button>
        </div>
      )}
    </div>
  )
}

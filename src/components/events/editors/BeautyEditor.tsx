"use client"

import { colors } from "@/lib/theme"
import { Plus, Trash2 } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import type { SectionEditorProps } from "./editor-types"
import { fieldStyles, removeArrayItem, updateArrayItem } from "./editor-types"

type BeautyService = {
  name: string
  type: string
  description: string
  url: string
  phone: string
  address: string
  is_recommended: boolean
}

const EMPTY_SERVICE: BeautyService = {
  name: "",
  type: "salon",
  description: "",
  url: "",
  phone: "",
  address: "",
  is_recommended: false,
}

export function BeautyEditor({ content, onContentChange }: SectionEditorProps) {
  const heading = (content.heading as string) ?? ""
  const services = (content.services as BeautyService[]) ?? []

  const update = (field: string, value: unknown) => {
    onContentChange({ ...content, [field]: value })
  }

  return (
    <div className="space-y-3" data-testid="beauty-editor">
      <div>
        <label className={fieldStyles.label} style={{ color: colors.text.secondary }}>
          Heading
        </label>
        <input
          value={heading}
          onChange={(e) => update("heading", e.target.value)}
          className={fieldStyles.input}
          style={{ borderColor: colors.bg.parchment, color: colors.text.primary }}
          placeholder="e.g. Beauty & Grooming"
          data-testid="beauty-heading"
        />
      </div>

      <div>
        <label className={fieldStyles.label} style={{ color: colors.text.secondary }}>
          Services
        </label>
        {services.map((svc, i) => (
          <div
            key={i}
            className={fieldStyles.arrayItem}
            style={{ borderColor: colors.bg.parchment }}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium" style={{ color: colors.text.muted }}>
                Service {i + 1}
              </span>
              <button
                onClick={() => update("services", removeArrayItem(services, i))}
                className="p-1 rounded"
                data-testid={`beauty-remove-${i}`}
              >
                <Trash2 className="w-3.5 h-3.5" style={{ color: colors.functional.error }} />
              </button>
            </div>
            <input
              value={svc.name}
              onChange={(e) =>
                update("services", updateArrayItem(services, i, "name", e.target.value))
              }
              className={fieldStyles.input}
              style={{ borderColor: colors.bg.parchment, color: colors.text.primary }}
              placeholder="Service Name *"
              data-testid={`beauty-name-${i}`}
            />
            <select
              value={svc.type}
              onChange={(e) =>
                update("services", updateArrayItem(services, i, "type", e.target.value))
              }
              className={fieldStyles.select}
              style={{ borderColor: colors.bg.parchment, color: colors.text.primary }}
              data-testid={`beauty-type-${i}`}
            >
              <option value="salon">Salon</option>
              <option value="spa">Spa</option>
              <option value="barber">Barber</option>
              <option value="makeup">Makeup</option>
              <option value="other">Other</option>
            </select>
            <input
              value={svc.phone ?? ""}
              onChange={(e) =>
                update("services", updateArrayItem(services, i, "phone", e.target.value))
              }
              className={fieldStyles.input}
              style={{ borderColor: colors.bg.parchment, color: colors.text.primary }}
              placeholder="Phone"
              data-testid={`beauty-phone-${i}`}
            />
            <input
              value={svc.address ?? ""}
              onChange={(e) =>
                update("services", updateArrayItem(services, i, "address", e.target.value))
              }
              className={fieldStyles.input}
              style={{ borderColor: colors.bg.parchment, color: colors.text.primary }}
              placeholder="Address"
              data-testid={`beauty-address-${i}`}
            />
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: colors.text.secondary }}>Recommended</span>
              <Switch
                checked={svc.is_recommended ?? false}
                onCheckedChange={(v) =>
                  update("services", updateArrayItem(services, i, "is_recommended", v))
                }
                data-testid={`beauty-recommended-${i}`}
              />
            </div>
          </div>
        ))}
        <button
          onClick={() => update("services", [...services, { ...EMPTY_SERVICE }])}
          className={fieldStyles.addBtn}
          style={{ borderColor: colors.bg.parchment, color: colors.text.secondary }}
          data-testid="beauty-add"
        >
          <Plus className="w-3.5 h-3.5 inline me-1" />
          Add Service
        </button>
      </div>
    </div>
  )
}

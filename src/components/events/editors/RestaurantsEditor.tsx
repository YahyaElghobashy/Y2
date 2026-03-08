"use client"

import { colors } from "@/lib/theme"
import { Plus, Trash2 } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import type { SectionEditorProps } from "./editor-types"
import { fieldStyles, removeArrayItem, updateArrayItem } from "./editor-types"

type RestaurantItem = {
  name: string
  cuisine: string
  description: string
  image_url: string
  price_range: string
  url: string
  address: string
  phone: string
  is_recommended: boolean
}

const EMPTY_RESTAURANT: RestaurantItem = {
  name: "",
  cuisine: "",
  description: "",
  image_url: "",
  price_range: "",
  url: "",
  address: "",
  phone: "",
  is_recommended: false,
}

export function RestaurantsEditor({ content, onContentChange }: SectionEditorProps) {
  const heading = (content.heading as string) ?? ""
  const restaurants = (content.restaurants as RestaurantItem[]) ?? []

  const update = (field: string, value: unknown) => {
    onContentChange({ ...content, [field]: value })
  }

  return (
    <div className="space-y-3" data-testid="restaurants-editor">
      <div>
        <label className={fieldStyles.label} style={{ color: colors.text.secondary }}>
          Heading
        </label>
        <input
          value={heading}
          onChange={(e) => update("heading", e.target.value)}
          className={fieldStyles.input}
          style={{ borderColor: colors.bg.parchment, color: colors.text.primary }}
          placeholder="e.g. Where to Eat"
          data-testid="restaurants-heading"
        />
      </div>

      <div>
        <label className={fieldStyles.label} style={{ color: colors.text.secondary }}>
          Restaurants
        </label>
        {restaurants.map((item, i) => (
          <div
            key={i}
            className={fieldStyles.arrayItem}
            style={{ borderColor: colors.bg.parchment }}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium" style={{ color: colors.text.muted }}>
                Restaurant {i + 1}
              </span>
              <button
                onClick={() => update("restaurants", removeArrayItem(restaurants, i))}
                className="p-1 rounded"
                data-testid={`restaurants-remove-${i}`}
              >
                <Trash2 className="w-3.5 h-3.5" style={{ color: colors.functional.error }} />
              </button>
            </div>
            <input
              value={item.name}
              onChange={(e) =>
                update("restaurants", updateArrayItem(restaurants, i, "name", e.target.value))
              }
              className={fieldStyles.input}
              style={{ borderColor: colors.bg.parchment, color: colors.text.primary }}
              placeholder="Restaurant Name *"
              data-testid={`restaurants-name-${i}`}
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                value={item.cuisine ?? ""}
                onChange={(e) =>
                  update("restaurants", updateArrayItem(restaurants, i, "cuisine", e.target.value))
                }
                className={fieldStyles.input}
                style={{ borderColor: colors.bg.parchment, color: colors.text.primary }}
                placeholder="Cuisine"
                data-testid={`restaurants-cuisine-${i}`}
              />
              <input
                value={item.price_range ?? ""}
                onChange={(e) =>
                  update(
                    "restaurants",
                    updateArrayItem(restaurants, i, "price_range", e.target.value)
                  )
                }
                className={fieldStyles.input}
                style={{ borderColor: colors.bg.parchment, color: colors.text.primary }}
                placeholder="Price Range"
                data-testid={`restaurants-price-${i}`}
              />
            </div>
            <input
              value={item.address ?? ""}
              onChange={(e) =>
                update("restaurants", updateArrayItem(restaurants, i, "address", e.target.value))
              }
              className={fieldStyles.input}
              style={{ borderColor: colors.bg.parchment, color: colors.text.primary }}
              placeholder="Address"
              data-testid={`restaurants-address-${i}`}
            />
            <input
              value={item.url ?? ""}
              onChange={(e) =>
                update("restaurants", updateArrayItem(restaurants, i, "url", e.target.value))
              }
              className={fieldStyles.input}
              style={{ borderColor: colors.bg.parchment, color: colors.text.primary }}
              placeholder="Website URL"
              data-testid={`restaurants-url-${i}`}
            />
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: colors.text.secondary }}>Recommended</span>
              <Switch
                checked={item.is_recommended ?? false}
                onCheckedChange={(v) =>
                  update("restaurants", updateArrayItem(restaurants, i, "is_recommended", v))
                }
                data-testid={`restaurants-recommended-${i}`}
              />
            </div>
          </div>
        ))}
        <button
          onClick={() => update("restaurants", [...restaurants, { ...EMPTY_RESTAURANT }])}
          className={fieldStyles.addBtn}
          style={{ borderColor: colors.bg.parchment, color: colors.text.secondary }}
          data-testid="restaurants-add"
        >
          <Plus className="w-3.5 h-3.5 inline me-1" />
          Add Restaurant
        </button>
      </div>
    </div>
  )
}

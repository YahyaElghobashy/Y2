"use client"

import { colors } from "@/lib/theme"
import { Plus, Trash2 } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import type { SectionEditorProps } from "./editor-types"
import { fieldStyles, removeArrayItem, updateArrayItem } from "./editor-types"

type HotelItem = {
  name: string
  description: string
  image_url: string
  rating: number
  price_range: string
  booking_url: string
  address: string
  phone: string
  distance_from_venue: string
  is_recommended: boolean
}

const EMPTY_HOTEL: HotelItem = {
  name: "",
  description: "",
  image_url: "",
  rating: 0,
  price_range: "",
  booking_url: "",
  address: "",
  phone: "",
  distance_from_venue: "",
  is_recommended: false,
}

export function HotelsEditor({ content, onContentChange }: SectionEditorProps) {
  const heading = (content.heading as string) ?? ""
  const hotels = (content.hotels as HotelItem[]) ?? []

  const update = (field: string, value: unknown) => {
    onContentChange({ ...content, [field]: value })
  }

  return (
    <div className="space-y-3" data-testid="hotels-editor">
      <div>
        <label className={fieldStyles.label} style={{ color: colors.text.secondary }}>
          Heading
        </label>
        <input
          value={heading}
          onChange={(e) => update("heading", e.target.value)}
          className={fieldStyles.input}
          style={{ borderColor: colors.bg.parchment, color: colors.text.primary }}
          placeholder="e.g. Where to Stay"
          data-testid="hotels-heading"
        />
      </div>

      <div>
        <label className={fieldStyles.label} style={{ color: colors.text.secondary }}>
          Hotels
        </label>
        {hotels.map((hotel, i) => (
          <div
            key={i}
            className={fieldStyles.arrayItem}
            style={{ borderColor: colors.bg.parchment }}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium" style={{ color: colors.text.muted }}>
                Hotel {i + 1}
              </span>
              <button
                onClick={() => update("hotels", removeArrayItem(hotels, i))}
                className="p-1 rounded"
                data-testid={`hotels-remove-${i}`}
              >
                <Trash2 className="w-3.5 h-3.5" style={{ color: colors.functional.error }} />
              </button>
            </div>
            <input
              value={hotel.name}
              onChange={(e) =>
                update("hotels", updateArrayItem(hotels, i, "name", e.target.value))
              }
              className={fieldStyles.input}
              style={{ borderColor: colors.bg.parchment, color: colors.text.primary }}
              placeholder="Hotel Name *"
              data-testid={`hotels-name-${i}`}
            />
            <textarea
              value={hotel.description ?? ""}
              onChange={(e) =>
                update("hotels", updateArrayItem(hotels, i, "description", e.target.value))
              }
              className={fieldStyles.textarea}
              style={{ borderColor: colors.bg.parchment, color: colors.text.primary }}
              placeholder="Description"
              rows={2}
              data-testid={`hotels-desc-${i}`}
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                value={hotel.price_range ?? ""}
                onChange={(e) =>
                  update("hotels", updateArrayItem(hotels, i, "price_range", e.target.value))
                }
                className={fieldStyles.input}
                style={{ borderColor: colors.bg.parchment, color: colors.text.primary }}
                placeholder="Price Range"
                data-testid={`hotels-price-${i}`}
              />
              <input
                value={hotel.distance_from_venue ?? ""}
                onChange={(e) =>
                  update(
                    "hotels",
                    updateArrayItem(hotels, i, "distance_from_venue", e.target.value)
                  )
                }
                className={fieldStyles.input}
                style={{ borderColor: colors.bg.parchment, color: colors.text.primary }}
                placeholder="Distance"
                data-testid={`hotels-distance-${i}`}
              />
            </div>
            <input
              value={hotel.address ?? ""}
              onChange={(e) =>
                update("hotels", updateArrayItem(hotels, i, "address", e.target.value))
              }
              className={fieldStyles.input}
              style={{ borderColor: colors.bg.parchment, color: colors.text.primary }}
              placeholder="Address"
              data-testid={`hotels-address-${i}`}
            />
            <input
              value={hotel.booking_url ?? ""}
              onChange={(e) =>
                update("hotels", updateArrayItem(hotels, i, "booking_url", e.target.value))
              }
              className={fieldStyles.input}
              style={{ borderColor: colors.bg.parchment, color: colors.text.primary }}
              placeholder="Booking URL"
              data-testid={`hotels-booking-${i}`}
            />
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: colors.text.secondary }}>Recommended</span>
              <Switch
                checked={hotel.is_recommended ?? false}
                onCheckedChange={(v) =>
                  update("hotels", updateArrayItem(hotels, i, "is_recommended", v))
                }
                data-testid={`hotels-recommended-${i}`}
              />
            </div>
          </div>
        ))}
        <button
          onClick={() => update("hotels", [...hotels, { ...EMPTY_HOTEL }])}
          className={fieldStyles.addBtn}
          style={{ borderColor: colors.bg.parchment, color: colors.text.secondary }}
          data-testid="hotels-add"
        >
          <Plus className="w-3.5 h-3.5 inline me-1" />
          Add Hotel
        </button>
      </div>
    </div>
  )
}

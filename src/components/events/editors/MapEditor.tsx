"use client"

import { colors } from "@/lib/theme"
import { Switch } from "@/components/ui/switch"
import type { SectionEditorProps } from "./editor-types"
import { fieldStyles } from "./editor-types"

export function MapEditor({ content, onContentChange }: SectionEditorProps) {
  const heading = (content.heading as string) ?? ""
  const centerLat = (content.center_lat as number) ?? 0
  const centerLng = (content.center_lng as number) ?? 0
  const zoom = (content.zoom as number) ?? 13
  const showAllPins = (content.show_all_pins as boolean) ?? true
  const mapStyle = (content.map_style as string) ?? "default"

  const update = (field: string, value: unknown) => {
    onContentChange({ ...content, [field]: value })
  }

  return (
    <div className="space-y-3" data-testid="map-editor">
      <div>
        <label className={fieldStyles.label} style={{ color: colors.text.secondary }}>
          Heading
        </label>
        <input
          value={heading}
          onChange={(e) => update("heading", e.target.value)}
          className={fieldStyles.input}
          style={{ borderColor: colors.bg.parchment, color: colors.text.primary }}
          placeholder="e.g. Venue Location"
          data-testid="map-heading"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={fieldStyles.label} style={{ color: colors.text.secondary }}>
            Center Latitude
          </label>
          <input
            type="number"
            step="any"
            value={centerLat}
            onChange={(e) => update("center_lat", parseFloat(e.target.value) || 0)}
            className={fieldStyles.input}
            style={{ borderColor: colors.bg.parchment, color: colors.text.primary }}
            data-testid="map-center-lat"
          />
        </div>
        <div>
          <label className={fieldStyles.label} style={{ color: colors.text.secondary }}>
            Center Longitude
          </label>
          <input
            type="number"
            step="any"
            value={centerLng}
            onChange={(e) => update("center_lng", parseFloat(e.target.value) || 0)}
            className={fieldStyles.input}
            style={{ borderColor: colors.bg.parchment, color: colors.text.primary }}
            data-testid="map-center-lng"
          />
        </div>
      </div>

      <div>
        <label className={fieldStyles.label} style={{ color: colors.text.secondary }}>
          Zoom Level ({zoom})
        </label>
        <input
          type="range"
          min={1}
          max={20}
          value={zoom}
          onChange={(e) => update("zoom", parseInt(e.target.value))}
          className="w-full"
          data-testid="map-zoom"
        />
      </div>

      <div>
        <label className={fieldStyles.label} style={{ color: colors.text.secondary }}>
          Map Style
        </label>
        <select
          value={mapStyle}
          onChange={(e) => update("map_style", e.target.value)}
          className={fieldStyles.select}
          style={{ borderColor: colors.bg.parchment, color: colors.text.primary }}
          data-testid="map-style"
        >
          <option value="default">Default</option>
          <option value="satellite">Satellite</option>
          <option value="warm">Warm</option>
        </select>
      </div>

      <div className="flex items-center justify-between">
        <label className="text-xs font-medium" style={{ color: colors.text.secondary }}>
          Show All Pins
        </label>
        <Switch
          checked={showAllPins}
          onCheckedChange={(v) => update("show_all_pins", v)}
          data-testid="map-show-all-pins"
        />
      </div>

      <p className="text-xs" style={{ color: colors.text.muted }}>
        Map pins are managed in the Map Pins section of the portal settings.
      </p>
    </div>
  )
}

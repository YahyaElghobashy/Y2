"use client"

import { useMemo, useState } from "react"
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet"
import { MapPin, Navigation, ExternalLink } from "lucide-react"
import type { PortalMapPin, PinCategory } from "@/lib/types/portal.types"

import "leaflet/dist/leaflet.css"

// Default center: Cairo
const DEFAULT_CENTER: [number, number] = [30.0444, 31.2357]
const DEFAULT_ZOOM = 13

// Category → color mapping (portal-aware)
const CATEGORY_COLORS: Record<PinCategory, string> = {
  venue: "#C4956A", // gold
  hotel: "#6B8AE5", // blue
  restaurant: "#E57C6B", // coral
  activity: "#6BC7A4", // green
  transport: "#9B8AE5", // purple
  other: "#8C8279", // muted
}

// Category → emoji
const CATEGORY_ICONS: Record<PinCategory, string> = {
  venue: "📍",
  hotel: "🏨",
  restaurant: "🍽️",
  activity: "🎉",
  transport: "🚗",
  other: "📌",
}

type PortalMapProps = {
  pins: PortalMapPin[]
  /** Use portal CSS variables for styling */
  portalStyle?: boolean
  /** Height of the map container */
  height?: string
  /** Show a sidebar list of pins */
  showSidebar?: boolean
  /** Filter by category */
  activeCategory?: PinCategory | null
  /** Callback when a pin is selected */
  onPinSelect?: (pin: PortalMapPin) => void
}

function FitBoundsHelper({ pins }: { pins: PortalMapPin[] }) {
  const map = useMap()

  useMemo(() => {
    if (pins.length === 0) return

    const lats = pins.map((p) => p.lat)
    const lngs = pins.map((p) => p.lng)

    const bounds: [[number, number], [number, number]] = [
      [Math.min(...lats) - 0.005, Math.min(...lngs) - 0.005],
      [Math.max(...lats) + 0.005, Math.max(...lngs) + 0.005],
    ]

    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 })
  }, [pins, map])

  return null
}

export function PortalMap({
  pins,
  portalStyle = false,
  height = "20rem",
  showSidebar = false,
  activeCategory = null,
  onPinSelect,
}: PortalMapProps) {
  const [selectedPin, setSelectedPin] = useState<PortalMapPin | null>(null)

  const filteredPins = useMemo(
    () => (activeCategory ? pins.filter((p) => p.category === activeCategory) : pins),
    [pins, activeCategory]
  )

  const handlePinClick = (pin: PortalMapPin) => {
    setSelectedPin(pin)
    onPinSelect?.(pin)
  }

  if (pins.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-xl border"
        style={{
          height,
          borderColor: portalStyle ? "var(--portal-border)" : undefined,
          backgroundColor: portalStyle ? "var(--portal-surface)" : undefined,
          borderRadius: portalStyle ? "var(--portal-radius)" : undefined,
        }}
        data-testid="map-empty"
      >
        <div className="text-center">
          <MapPin
            className="mx-auto mb-2 h-8 w-8"
            style={{ color: portalStyle ? "var(--portal-primary)" : undefined }}
          />
          <p
            className="text-sm"
            style={{ color: portalStyle ? "var(--portal-text-muted)" : undefined }}
          >
            No locations added yet
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`relative overflow-hidden rounded-xl ${showSidebar ? "flex" : ""}`}
      style={{
        height,
        borderRadius: portalStyle ? "var(--portal-radius)" : undefined,
      }}
      data-testid="portal-map"
    >
      {/* Map */}
      <div className={showSidebar ? "flex-1" : "h-full w-full"}>
        <MapContainer
          center={DEFAULT_CENTER}
          zoom={DEFAULT_ZOOM}
          className="h-full w-full"
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <FitBoundsHelper pins={filteredPins} />

          {filteredPins.map((pin) => {
            const color = CATEGORY_COLORS[pin.category] ?? CATEGORY_COLORS.other
            const isSelected = selectedPin?.id === pin.id

            return (
              <CircleMarker
                key={pin.id}
                center={[pin.lat, pin.lng]}
                radius={isSelected ? 12 : 8}
                pathOptions={{
                  color,
                  fillColor: color,
                  fillOpacity: isSelected ? 0.9 : 0.6,
                  weight: isSelected ? 3 : 2,
                }}
                eventHandlers={{
                  click: () => handlePinClick(pin),
                }}
              >
                <Popup>
                  <div className="min-w-[140px]">
                    <div className="flex items-center gap-1.5">
                      <span>{CATEGORY_ICONS[pin.category]}</span>
                      <strong className="text-sm">{pin.label}</strong>
                    </div>
                    {pin.description && (
                      <p className="mt-1 text-xs text-gray-600">{pin.description}</p>
                    )}
                    {pin.url && (
                      <a
                        href={pin.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-xs text-blue-600"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Directions
                      </a>
                    )}
                  </div>
                </Popup>
              </CircleMarker>
            )
          })}
        </MapContainer>
      </div>

      {/* Sidebar */}
      {showSidebar && (
        <div
          className="w-56 overflow-y-auto border-s"
          style={{
            borderColor: portalStyle ? "var(--portal-border)" : undefined,
            backgroundColor: portalStyle ? "var(--portal-surface)" : undefined,
          }}
          data-testid="map-sidebar"
        >
          {filteredPins.map((pin) => (
            <button
              key={pin.id}
              type="button"
              onClick={() => handlePinClick(pin)}
              className={`flex w-full items-start gap-2 border-b px-3 py-2.5 text-start text-xs transition-opacity hover:opacity-80 ${
                selectedPin?.id === pin.id ? "opacity-100" : "opacity-70"
              }`}
              style={{
                borderColor: portalStyle ? "var(--portal-border)" : undefined,
                backgroundColor:
                  selectedPin?.id === pin.id && portalStyle
                    ? "var(--portal-bg)"
                    : undefined,
              }}
              data-testid={`map-sidebar-item-${pin.id}`}
            >
              <span className="shrink-0 text-sm">
                {CATEGORY_ICONS[pin.category]}
              </span>
              <div>
                <div
                  className="font-medium"
                  style={{ color: portalStyle ? "var(--portal-text)" : undefined }}
                >
                  {pin.label}
                </div>
                {pin.description && (
                  <div
                    className="mt-0.5 line-clamp-2"
                    style={{ color: portalStyle ? "var(--portal-text-muted)" : undefined }}
                  >
                    {pin.description}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

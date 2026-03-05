"use client"

import { useMemo, useState } from "react"
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet"
import { MapPinCard } from "./MapPinCard"
import type { FoodVisit, CuisineType } from "@/lib/types/food-journal.types"

import "leaflet/dist/leaflet.css"

// Default center: Cairo
const DEFAULT_CENTER: [number, number] = [30.0444, 31.2357]
const DEFAULT_ZOOM = 12

type FoodMapProps = {
  visits: FoodVisit[]
  getOverallScore: (visitId: string) => number | null
  getVisitNumber: (visit: FoodVisit) => number
}

function MapWarmFilter() {
  return (
    <style>{`
      .leaflet-tile-pane {
        filter: sepia(15%) saturate(90%) hue-rotate(5deg);
      }
    `}</style>
  )
}

function FitBoundsHelper({ visits }: { visits: FoodVisit[] }) {
  const map = useMap()

  useMemo(() => {
    if (visits.length === 0) return

    const validVisits = visits.filter(
      (v) => v.lat !== null && v.lng !== null && v.lat !== 0 && v.lng !== 0
    )
    if (validVisits.length === 0) return

    const lats = validVisits.map((v) => Number(v.lat))
    const lngs = validVisits.map((v) => Number(v.lng))

    const bounds: [[number, number], [number, number]] = [
      [Math.min(...lats) - 0.01, Math.min(...lngs) - 0.01],
      [Math.max(...lats) + 0.01, Math.max(...lngs) + 0.01],
    ]

    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 })
  }, [visits, map])

  return null
}

export function FoodMap({ visits, getOverallScore, getVisitNumber }: FoodMapProps) {
  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null)

  const selectedVisit = selectedVisitId
    ? visits.find((v) => v.id === selectedVisitId) ?? null
    : null

  const visitsWithCoords = useMemo(
    () =>
      visits.filter(
        (v) => v.lat !== null && v.lng !== null && v.lat !== 0 && v.lng !== 0
      ),
    [visits]
  )

  return (
    <div data-testid="food-map" className="relative h-full w-full">
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        className="h-full w-full rounded-2xl"
        zoomControl={false}
        attributionControl={false}
      >
        <MapWarmFilter />
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <FitBoundsHelper visits={visitsWithCoords} />

        {visitsWithCoords.map((visit) => {
          const score = getOverallScore(visit.id)
          const visitNum = getVisitNumber(visit)
          const hasBothReviewed = score !== null

          return (
            <CircleMarker
              key={visit.id}
              center={[Number(visit.lat), Number(visit.lng)]}
              radius={visitNum > 1 ? 10 : 8}
              pathOptions={{
                color: "#C4956A",
                fillColor: hasBothReviewed ? "#C4956A" : "transparent",
                fillOpacity: hasBothReviewed ? 0.8 : 0,
                weight: 2,
              }}
              eventHandlers={{
                click: () => setSelectedVisitId(visit.id),
              }}
            />
          )
        })}
      </MapContainer>

      {/* Pin card bottom sheet */}
      {selectedVisit && (
        <MapPinCard
          visitId={selectedVisit.id}
          placeName={selectedVisit.place_name}
          cuisineType={selectedVisit.cuisine_type as CuisineType}
          overallScore={getOverallScore(selectedVisit.id)}
          visitDate={selectedVisit.visit_date}
          visitNumber={getVisitNumber(selectedVisit)}
          onDismiss={() => setSelectedVisitId(null)}
          isOpen={!!selectedVisit}
        />
      )}
    </div>
  )
}

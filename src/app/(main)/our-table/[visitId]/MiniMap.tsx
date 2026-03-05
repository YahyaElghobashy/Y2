"use client"

import { MapContainer, TileLayer, CircleMarker } from "react-leaflet"
import "leaflet/dist/leaflet.css"

type MiniMapProps = {
  lat: number
  lng: number
}

export function MiniMap({ lat, lng }: MiniMapProps) {
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={15}
      className="h-full w-full"
      zoomControl={false}
      attributionControl={false}
      dragging={false}
      scrollWheelZoom={false}
      doubleClickZoom={false}
      touchZoom={false}
    >
      <style>{`
        .leaflet-tile-pane {
          filter: sepia(15%) saturate(90%) hue-rotate(5deg);
        }
      `}</style>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <CircleMarker
        center={[lat, lng]}
        radius={8}
        pathOptions={{
          color: "#C4956A",
          fillColor: "#C4956A",
          fillOpacity: 0.8,
          weight: 2,
        }}
      />
    </MapContainer>
  )
}

"use client"

import { WorldMapView, WORLD_MAP_MOCK } from "@/components/travels/WorldMapView"
import { BottomNav } from "@/components/shared/BottomNav"

/**
 * Preview: the Travels world map with mock visits + pins. Callbacks are omitted
 * so the affordances stay inert (the real authed page wires the useWorldMap
 * mutations). Includes the Amsterdam hybrid + a mutual pin → Our Next Adventure.
 *
 * Client component: WORLD_MAP_MOCK carries a Map + a visitsFor function (not
 * RSC-serializable), so the mock must live on the client side of the boundary.
 */
export default function PreviewWorldMapPage() {
  return (
    <div
      className="relative mx-auto min-h-[100dvh] max-w-[430px]"
      style={{ background: "var(--background)" }}
    >
      <WorldMapView {...WORLD_MAP_MOCK} />
      <BottomNav />
    </div>
  )
}

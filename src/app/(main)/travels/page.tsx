"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { PageTransition } from "@/components/animations"
import { WorldMapView } from "@/components/travels/WorldMapView"
import { TravelsView } from "@/components/travels/TravelsView"
import {
  LogTravelForm,
  type LogTravelSubmit,
} from "@/components/travels/LogTravelForm"
import { useTrips } from "@/lib/hooks/use-trips"
import { useWorldMap } from "@/lib/hooks/use-world-map"
import { useAuth } from "@/lib/providers/AuthProvider"
import { uploadMedia } from "@/lib/media-upload"
import { COUNTRY_NAME } from "@/lib/data/iso-country-codes"

/**
 * TravelsPage — the authed Travels overview.
 *
 * The interactive world map (useWorldMap) is the hero; the trip list
 * (useTrips) sits below. "Start planning" a mutual-pin destination creates an
 * upcoming trip via the existing trips module.
 */
export default function TravelsPage() {
  const router = useRouter()
  const { user, profile, partner } = useAuth()
  const { trips, isLoading, createTrip, updateTrip } = useTrips()
  const map = useWorldMap()
  const [formOpen, setFormOpen] = useState(false)

  const handleSubmit = async (data: LogTravelSubmit) => {
    if (!user) {
      toast.error("Please sign in to log a travel")
      throw new Error("not authenticated")
    }
    const { coverFile, ...tripData } = data
    const tripId = await createTrip(tripData)
    if (!tripId) throw new Error("createTrip failed")

    if (coverFile) {
      const result = await uploadMedia({
        file: coverFile,
        userId: user.id,
        bucket: "trip-covers",
        sourceTable: "trips",
        sourceColumn: "cover_image",
        sourceRowId: tripId,
        maxWidth: 1600,
        maxHeight: 1200,
      })
      if ("error" in result) {
        toast.error("Trip saved, but the cover didn't upload")
      } else {
        await updateTrip(tripId, { cover_image: result.url })
      }
    }
  }

  const handleStartPlanning = async (countryCode: string) => {
    const name = COUNTRY_NAME[countryCode] ?? countryCode
    // Reuse an existing upcoming trip to this country if one's already planned.
    const existing = trips.find(
      (t) =>
        t.status === "upcoming" &&
        (t.destination ?? "").toLowerCase().includes(name.toLowerCase())
    )
    if (existing) {
      router.push(`/travels/${existing.id}`)
      return
    }
    try {
      const tripId = await createTrip({
        title: `${name} together`,
        destination: name,
        status: "upcoming",
      })
      if (tripId) router.push(`/travels/${tripId}`)
    } catch {
      toast.error("Couldn't start the plan")
    }
  }

  return (
    <PageTransition>
      <WorldMapView
        countries={map.countries}
        pins={{ me: map.myPins.map((p) => p.country_code), partner: map.partnerPins.map((p) => p.country_code), mutual: map.mutualPins }}
        myPins={map.myPins}
        ourNextTrip={map.ourNextTrip}
        meId={user?.id ?? ""}
        partnerId={partner?.id ?? null}
        meName={profile?.display_name ?? "Me"}
        partnerName={partner?.display_name ?? "Partner"}
        visitsFor={map.visitsFor}
        isLoading={map.isLoading}
        onAddVisit={map.addVisit}
        onTogglePin={async (iso2, pinned) => {
          if (pinned) await map.removePin(iso2)
          else await map.addPin(iso2)
        }}
        onAddPartnerNote={map.addPartnerNote}
        onStartPlanning={handleStartPlanning}
      />

      <TravelsView
        trips={trips}
        isLoading={isLoading}
        onLogTravel={() => setFormOpen(true)}
        onOpenTrip={(tripId) => router.push(`/travels/${tripId}`)}
      />
      <LogTravelForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />
    </PageTransition>
  )
}

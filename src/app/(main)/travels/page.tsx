"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { PageTransition } from "@/components/animations"
import { TravelsView } from "@/components/travels/TravelsView"
import {
  LogTravelForm,
  type LogTravelSubmit,
} from "@/components/travels/LogTravelForm"
import { useTrips } from "@/lib/hooks/use-trips"
import { useAuth } from "@/lib/providers/AuthProvider"
import { uploadMedia } from "@/lib/media-upload"

/**
 * TravelsPage — the authed Travels list.
 *
 * Wires the presentational TravelsView + LogTravelForm to the useTrips() data
 * layer. Trip creation is a two-step flow because the cover upload needs the
 * new trip's id as its `sourceRowId`:
 *   1. createTrip(...)            → insert the row, get its id
 *   2. uploadMedia(coverFile, …)  → push the cover to the `trip-covers` bucket
 *   3. updateTrip(id, { cover })  → patch the public URL back onto the trip
 *
 * Tapping a trip routes to its detail page at /travels/<id>.
 */
export default function TravelsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { trips, isLoading, createTrip, updateTrip } = useTrips()
  const [formOpen, setFormOpen] = useState(false)

  const handleSubmit = async (data: LogTravelSubmit) => {
    if (!user) {
      toast.error("Please sign in to log a travel")
      throw new Error("not authenticated")
    }

    const { coverFile, ...tripData } = data

    // 1. Create the trip (cover_image stays null for now).
    const tripId = await createTrip(tripData)
    if (!tripId) {
      // createTrip already surfaced a toast.
      throw new Error("createTrip failed")
    }

    // 2. Upload the cover (if any) now that we have a row to attach it to.
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
        // Non-fatal: the trip is saved, the cover just didn't stick.
        toast.error("Trip saved, but the cover didn't upload")
      } else {
        // 3. Patch the public URL onto the trip.
        await updateTrip(tripId, { cover_image: result.url })
      }
    }
  }

  return (
    <PageTransition>
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

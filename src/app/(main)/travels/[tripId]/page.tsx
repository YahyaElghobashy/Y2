"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Plane } from "lucide-react"
import { PageTransition } from "@/components/animations"
import { PageHeader } from "@/components/shared/PageHeader"
import { EmptyState } from "@/components/shared/EmptyState"
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton"
import { TripDetailView } from "@/components/travels/TripDetailView"
import { useTrips } from "@/lib/hooks/use-trips"
import { useAuth } from "@/lib/providers/AuthProvider"

/**
 * TripDetailPage — a single trip at /travels/<id>.
 *
 * Resolves the trip from the already-loaded useTrips() set (own + partner's,
 * RLS-scoped). Delete is owner-only — the affordance is omitted for the
 * partner's trips and routes back to /travels on success.
 *
 * The native photo gallery is a clearly-marked v2 TODO (see TripDetailView);
 * here we leave `onAddPhoto` unset so no half-built upload path is exposed.
 */
export default function TripDetailPage() {
  const { tripId } = useParams<{ tripId: string }>()
  const router = useRouter()
  const { user } = useAuth()
  const { getTrip, deleteTrip, isLoading } = useTrips()
  const [isDeleting, setIsDeleting] = useState(false)

  const trip = getTrip(tripId)

  // While the trips set is still loading we can't tell "not found" from
  // "not loaded yet" — show a skeleton rather than a premature 404.
  if (isLoading && !trip) {
    return (
      <PageTransition>
        <PageHeader title="Travel" backHref="/travels" />
        <LoadingSkeleton variant="full-page" />
      </PageTransition>
    )
  }

  if (!trip) {
    return (
      <PageTransition>
        <PageHeader title="Travel" backHref="/travels" />
        <EmptyState
          icon={<Plane size={26} strokeWidth={1.75} />}
          title="Travel not found"
          subtitle="It may have been removed, or it isn't shared with you."
          actionLabel="Back to travels"
          onAction={() => router.push("/travels")}
        />
      </PageTransition>
    )
  }

  const isOwner = !!user && user.id === trip.created_by

  const handleDelete = async () => {
    if (isDeleting) return
    setIsDeleting(true)
    await deleteTrip(trip.id)
    router.push("/travels")
  }

  return (
    <PageTransition>
      <TripDetailView
        trip={trip}
        backHref="/travels"
        // Owner-only delete; partner's trips have no delete affordance.
        onDelete={isOwner ? handleDelete : undefined}
        // TODO(travels-photos v2): wire native trip photo uploads here.
        // Intentionally unset so no half-built gallery path is exposed.
      />
    </PageTransition>
  )
}

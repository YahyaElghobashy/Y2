import {
  TripDetailView,
  TRIP_DETAIL_HOSTED_MOCK,
} from "@/components/travels/TripDetailView"
import { BottomNav } from "@/components/shared/BottomNav"

export const metadata = { title: "Hayah — Trip (Hosted) Preview" }

/**
 * Preview: a hosted trip detail. No onDelete/onAddPhoto so owner affordances
 * stay inert. The "Open the trip" button links to /travels/<id>/site (gated in
 * the real app); harmless here since preview is unauthenticated and inert.
 */
export default function PreviewTripHostedPage() {
  return (
    <div
      className="relative mx-auto min-h-[100dvh] max-w-[430px]"
      style={{ background: "var(--background)" }}
    >
      <TripDetailView trip={TRIP_DETAIL_HOSTED_MOCK} backHref="/preview/travels" />
      <BottomNav />
    </div>
  )
}

import {
  TripDetailView,
  TRIP_DETAIL_NATIVE_MOCK,
} from "@/components/travels/TripDetailView"
import { BottomNav } from "@/components/shared/BottomNav"

export const metadata = { title: "Hayah — Trip (Native) Preview" }

/**
 * Preview: a native trip detail (photos area = v2 TODO). Callbacks omitted so
 * owner affordances stay inert.
 */
export default function PreviewTripNativePage() {
  return (
    <div
      className="relative mx-auto min-h-[100dvh] max-w-[430px]"
      style={{ background: "var(--background)" }}
    >
      <TripDetailView trip={TRIP_DETAIL_NATIVE_MOCK} backHref="/preview/travels" />
      <BottomNav />
    </div>
  )
}

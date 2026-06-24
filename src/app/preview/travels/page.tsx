import { TravelsView, TRAVELS_MOCK } from "@/components/travels/TravelsView"
import { BottomNav } from "@/components/shared/BottomNav"

export const metadata = { title: "Hayah — Travels Preview" }

/**
 * Preview: the Travels list with mock trips. Callbacks are omitted so the
 * affordances stay inert (the real authed page wires onLogTravel / onOpenTrip).
 */
export default function PreviewTravelsPage() {
  return (
    <div
      className="relative mx-auto min-h-[100dvh] max-w-[430px]"
      style={{ background: "var(--background)" }}
    >
      <TravelsView trips={TRAVELS_MOCK} />
      <BottomNav />
    </div>
  )
}

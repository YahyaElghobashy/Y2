import { Suspense } from "react"
import { GameComplete } from "@/components/game/GameComplete"

export default function CheckInCompletePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FBF8F4]" />}>
      <GameComplete mode="check_in" />
    </Suspense>
  )
}

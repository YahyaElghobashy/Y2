import { Suspense } from "react"
import { GameComplete } from "@/components/game/GameComplete"

export default function DateNightCompletePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#1C1A18]" />}>
      <GameComplete mode="date_night" />
    </Suspense>
  )
}

import { Suspense } from "react"
import { DateNightPlayScreen } from "@/components/game/DateNightPlayScreen"

export default function DateNightPlayPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#1C1A18]" />}>
      <DateNightPlayScreen />
    </Suspense>
  )
}

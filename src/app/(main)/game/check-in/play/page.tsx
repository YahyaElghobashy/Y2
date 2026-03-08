import { Suspense } from "react"
import { CheckInPlayScreen } from "@/components/game/CheckInPlayScreen"

export default function CheckInPlayPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FBF8F4]" />}>
      <CheckInPlayScreen />
    </Suspense>
  )
}

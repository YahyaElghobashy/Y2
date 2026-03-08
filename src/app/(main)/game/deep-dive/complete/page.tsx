import { Suspense } from "react"
import { DeepDiveComplete } from "@/components/game/DeepDiveComplete"

export default function DeepDiveCompletePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FBF8F4]" />}>
      <DeepDiveComplete />
    </Suspense>
  )
}

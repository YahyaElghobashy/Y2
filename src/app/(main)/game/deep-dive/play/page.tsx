import { Suspense } from "react"
import { DeepDivePlayScreen } from "@/components/game/DeepDivePlayScreen"

export default function DeepDivePlayPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FBF8F4]" />}>
      <DeepDivePlayScreen />
    </Suspense>
  )
}

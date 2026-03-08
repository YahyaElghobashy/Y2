"use client"

import { Suspense } from "react"
import { PartnerAuthoredSetup } from "@/components/game/PartnerAuthoredSetup"

export default function PartnerAuthoredPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FBF8F4]" />}>
      <PartnerAuthoredSetup />
    </Suspense>
  )
}

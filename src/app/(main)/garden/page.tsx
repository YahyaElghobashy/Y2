"use client"

import { PageTransition } from "@/components/animations"
import { SharedGarden } from "@/components/garden/SharedGarden"

export default function GardenPage() {
  return (
    <PageTransition>
      <div className="px-5 pt-4 pb-8">
        <SharedGarden />
      </div>
    </PageTransition>
  )
}

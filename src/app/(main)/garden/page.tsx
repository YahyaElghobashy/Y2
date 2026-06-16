"use client"

import { useMemo } from "react"
import { PageTransition } from "@/components/animations"
import { PageHeader } from "@/components/shared/PageHeader"
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton"
import { GardenView, type GardenData } from "@/components/garden/GardenView"
import { useGarden } from "@/lib/hooks/use-garden"

/** Format a YYYY-MM-DD date string into a "Mon YYYY" label. */
function formatSince(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  })
}

export default function GardenPage() {
  const { gardenDays, isLoading } = useGarden()

  const data: GardenData = useMemo(() => {
    // A bloom for every day you both showed up → days that earned a flower.
    const bloomed = gardenDays.filter((d) => d.flower_type !== null)
    const days = bloomed.length

    // gardenDays is sorted newest-first by the hook, so the last entry is the
    // earliest recorded day. Fall back to the most recent if needed.
    const earliest =
      gardenDays.length > 0
        ? gardenDays[gardenDays.length - 1].garden_date
        : null
    const since = earliest ? formatSince(earliest) : "—"

    return { days, since }
  }, [gardenDays])

  if (isLoading) {
    return (
      <PageTransition>
        <PageHeader title="Our Garden" backHref="/keepsake" />
        <div className="px-5 py-6">
          <LoadingSkeleton variant="card" count={3} />
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <GardenView data={data} />
    </PageTransition>
  )
}

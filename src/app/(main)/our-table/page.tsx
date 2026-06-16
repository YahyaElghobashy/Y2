"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import { PageTransition } from "@/components/animations/PageTransition"
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton"
import { EmptyState } from "@/components/shared/EmptyState"
import { UtensilsCrossed } from "lucide-react"
import { TableView, type Visit } from "@/components/food/TableView"
import { useFoodJournal } from "@/lib/hooks/use-food-journal"
import { CUISINE_LABELS, type CuisineType, type FoodVisit } from "@/lib/types/food-journal.types"

export default function OurTablePage() {
  const router = useRouter()
  const { visits, isLoading, getMyRating } = useFoodJournal()

  // Replicate the old page's chronological visit-number computation so the
  // "Nth visit" label matches the existing behavior exactly.
  const visitNumberMap = useMemo(() => {
    const map = new Map<string, number>()
    const countByPlace = new Map<string, number>()
    const sorted = [...visits].sort(
      (a, b) => new Date(a.visit_date).getTime() - new Date(b.visit_date).getTime()
    )
    for (const v of sorted) {
      const key = v.place_id ?? v.place_name
      const count = (countByPlace.get(key) ?? 0) + 1
      countByPlace.set(key, count)
      map.set(v.id, count)
    }
    return map
  }, [visits])

  const tableVisits: Visit[] = useMemo(() => {
    return visits.map((v: FoodVisit) => ({
      id: v.id,
      place: v.place_name,
      cuisine: CUISINE_LABELS[v.cuisine_type as CuisineType] ?? v.cuisine_type,
      // Old page used my rating's overall_average as the headline score.
      // TODO(wire): TableView requires a non-null score; default unrated visits to 0.
      score: Math.round(getMyRating(v.id)?.overall_average ?? 0),
      date: new Date(v.visit_date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      visitNo: visitNumberMap.get(v.id) ?? 1,
    }))
  }, [visits, getMyRating, visitNumberMap])

  if (isLoading) {
    return (
      <PageTransition className="px-5 pb-24 pt-4">
        <LoadingSkeleton variant="card" count={3} />
      </PageTransition>
    )
  }

  if (visits.length === 0) {
    return (
      <PageTransition className="px-5 pb-24 pt-4">
        <EmptyState
          icon={<UtensilsCrossed size={48} />}
          title="No visits yet"
          subtitle="Start documenting your food adventures together"
          actionLabel="Add First Visit"
          actionHref="/our-table/new"
        />
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <TableView visits={tableVisits} onAdd={() => router.push("/our-table/new")} />
    </PageTransition>
  )
}

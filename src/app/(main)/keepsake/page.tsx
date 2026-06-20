"use client"

import { KeepsakeView, type KeepsakeData } from "@/components/keepsake/KeepsakeView"
import { useAuth } from "@/lib/providers/AuthProvider"

// Real couple-tenure milestones (days). nextMilestone is the first one past today.
const MILESTONES: { label: string; days: number }[] = [
  { label: "100 days", days: 100 },
  { label: "Half a year", days: 182 },
  { label: "One year", days: 365 },
  { label: "500 days", days: 500 },
  { label: "Two years", days: 730 },
  { label: "1000 days", days: 1000 },
  { label: "Three years", days: 1095 },
]

function daysSince(iso: string | null | undefined): number {
  if (!iso) return 0
  const start = new Date(iso).getTime()
  if (Number.isNaN(start)) return 0
  return Math.max(0, Math.floor((Date.now() - start) / 86_400_000))
}

export default function KeepsakePage() {
  const { profile } = useAuth()

  // paired_at is the couple's true start date (set atomically by pair_partners);
  // fall back to account creation. Previously this number was hardcoded to 128.
  const startIso = profile?.paired_at ?? profile?.created_at ?? null
  const daysTogether = daysSince(startIso)
  const next = MILESTONES.find((m) => m.days > daysTogether)

  const data: KeepsakeData = {
    // onThisDay needs the snap archive — left null until that's wired rather
    // than showing a fabricated memory.
    onThisDay: null,
    daysTogether,
    nextMilestone: next
      ? { label: next.label, inDays: next.days - daysTogether }
      : { label: "Every day from here", inDays: 0 },
  }

  return <KeepsakeView data={data} />
}

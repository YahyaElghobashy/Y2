"use client"

import { KeepsakeView, KEEPSAKE_MOCK } from "@/components/keepsake/KeepsakeView"

// On-this-day + days-together wire to real snap/garden data in the Keepsake
// functional pass; the layout + rooms are live now.
export default function KeepsakePage() {
  return <KeepsakeView data={KEEPSAKE_MOCK} />
}

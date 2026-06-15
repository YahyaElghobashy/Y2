"use client"

import { WorldHub, type HubRoom } from "@/components/shared/WorldHub"

// Rooms link to existing working pages during migration; content moves under
// /keepsake/* in a later pass (docs/DESIGN_BLUEPRINT.md §6).
const ROOMS: HubRoom[] = [
  { label: "Snaps", line: "A photo a day, the two of you", href: "/snap", emoji: "📷", accent: "amber" },
  { label: "Garden", line: "One bloom for every day together", href: "/garden", emoji: "🌿", accent: "teal" },
  { label: "2026 Vision", line: "The year you're building", href: "/2026", emoji: "🌅", accent: "coral" },
  { label: "Letters", line: "Words sealed and kept", href: "/me/rituals", emoji: "✉️", accent: "rose" },
]

export default function KeepsakePage() {
  return (
    <WorldHub
      title="The Keepsake"
      arabic="الذكرى"
      intro="Everything you two are collecting — it accrues, it never resets."
      rooms={ROOMS}
    />
  )
}

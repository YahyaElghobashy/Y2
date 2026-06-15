"use client"

import { WorldHub, type HubRoom } from "@/components/shared/WorldHub"

// Rooms link to the existing working pages during migration; sub-routes move
// under /treasury/* in a later pass (docs/DESIGN_BLUEPRINT.md §5).
const ROOMS: HubRoom[] = [
  { label: "Wallet", line: "Your shared joy pot", href: "/us/coyyns", emoji: "🪙", accent: "amber" },
  { label: "Coupons", line: "Promises you can redeem", href: "/us/coupons", emoji: "🎟", accent: "coral" },
  { label: "Marketplace", line: "Spend CoYYns on each other", href: "/us/marketplace", emoji: "🛍", accent: "terracotta" },
  { label: "Challenges", line: "Playful stakes & bounties", href: "/us/marketplace", emoji: "🏅", accent: "indigo" },
  { label: "Wishlist", line: "Things you're dreaming of", href: "/us/wishlist", emoji: "✨", accent: "rose" },
]

export default function TreasuryPage() {
  return (
    <WorldHub
      title="The Treasury"
      arabic="الخزينة"
      intro="The playful currency of care — earn it, spend it, treasure it."
      rooms={ROOMS}
    />
  )
}

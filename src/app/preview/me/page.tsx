"use client"

import { WorldHub, type HubRoom } from "@/components/shared/WorldHub"
import { BottomNav } from "@/components/shared/BottomNav"

const ROOMS: HubRoom[] = [
  { label: "Body", line: "cycle & wellness", href: "/me/body", emoji: "🌸", accent: "rose" },
  { label: "Soul", line: "prayer, qur'an & du'a", href: "/me/soul", emoji: "🌙", accent: "teal" },
  { label: "Rituals", line: "daily habits & letters", href: "/me/rituals", emoji: "🕯️", accent: "amber" },
]

export default function PreviewMePage() {
  return (
    <div className="relative mx-auto min-h-[100dvh] max-w-[430px]" style={{ background: "var(--background)" }}>
      <WorldHub title="Me" arabic="أنا" intro="Your own quiet corner — body, soul, and the small daily rites." rooms={ROOMS} />
      <BottomNav />
    </div>
  )
}

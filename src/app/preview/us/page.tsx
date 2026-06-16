"use client"

import { WorldHub, type HubRoom } from "@/components/shared/WorldHub"
import { BottomNav } from "@/components/shared/BottomNav"

const ROOMS: HubRoom[] = [
  { label: "Connect", line: "today's question", href: "/us/prompts", emoji: "💬", accent: "coral" },
  { label: "Play", line: "games & the wheel", href: "/game/check-in", emoji: "🎲", accent: "indigo" },
  { label: "Plan", line: "calendar & lists", href: "/us/calendar", emoji: "🗓", accent: "teal" },
  { label: "Watch", line: "what's next, together", href: "/us/watch", emoji: "🎬", accent: "amber" },
  { label: "Table", line: "places you love", href: "/our-table", emoji: "🍽️", accent: "terracotta" },
]

export default function PreviewUsPage() {
  return (
    <div className="relative mx-auto min-h-[100dvh] max-w-[430px]" style={{ background: "var(--background)" }}>
      <WorldHub title="Together" arabic="نحن" intro="Everything you do together — talk, play, plan, watch, taste." rooms={ROOMS} />
      <BottomNav />
    </div>
  )
}

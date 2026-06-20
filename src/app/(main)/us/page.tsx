import { WorldHub, type HubRoom } from "@/components/shared/WorldHub"

// Rooms link to existing routes during migration (Connect→prompts, Play→games).
const ROOMS: HubRoom[] = [
  { label: "Connect", line: "today's question", href: "/us/prompts", emoji: "💬", accent: "coral" },
  { label: "Play", line: "games & the wheel", href: "/game", emoji: "🎲", accent: "indigo" },
  { label: "Plan", line: "calendar & lists", href: "/us/calendar", emoji: "🗓", accent: "teal" },
  { label: "Watch", line: "what's next, together", href: "/us/watch", emoji: "🎬", accent: "amber" },
  { label: "Table", line: "places you love", href: "/our-table", emoji: "🍽️", accent: "terracotta" },
]

export default function UsPage() {
  return <WorldHub title="Together" arabic="نحن" intro="Everything you do together — talk, play, plan, watch, taste." rooms={ROOMS} />
}

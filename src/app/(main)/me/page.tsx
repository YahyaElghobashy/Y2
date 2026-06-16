"use client"

import { WorldHub, type HubRoom } from "@/components/shared/WorldHub"
import { useAuth } from "@/lib/providers/AuthProvider"

export default function MePage() {
  const { profile } = useAuth()
  const admin = profile?.role === "admin"

  const rooms: HubRoom[] = [
    { label: "Body", line: admin ? "cycle & wellness" : "wellness & fitness", href: "/me/body", emoji: "🌸", accent: "rose" },
    { label: "Soul", line: "prayer, qur'an & du'a", href: "/me/soul", emoji: "🌙", accent: "teal" },
    { label: "Rituals", line: "daily habits & letters", href: "/me/rituals", emoji: "🕯️", accent: "amber" },
  ]

  return <WorldHub title="Me" arabic="أنا" intro="Your own quiet corner — body, soul, and the small daily rites." rooms={rooms} />
}

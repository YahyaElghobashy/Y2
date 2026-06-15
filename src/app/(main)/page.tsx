"use client"

import { useEffect, useMemo } from "react"
import { useAuth } from "@/lib/providers/AuthProvider"
import { useCoyyns } from "@/lib/hooks/use-coyyns"
import { useGarden } from "@/lib/hooks/use-garden"
import { HomeView, type HomeViewData } from "@/components/home/HomeView"

function buildGreeting(d: Date): string {
  const h = d.getHours()
  const part = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : h < 20 ? "Good evening" : "A quiet night"
  const day = d.toLocaleDateString("en-US", { weekday: "long" })
  return `${day} · ${part}`
}

const ROOMS: HomeViewData["rooms"] = [
  { label: "Play", icon: "🎲", href: "/wheel", accent: "coral" },
  { label: "Soul", icon: "🌙", href: "/me/soul", accent: "teal" },
  { label: "Snap", icon: "📷", href: "/snap", accent: "amber" },
  { label: "Plan", icon: "🗓", href: "/us/calendar", accent: "indigo" },
]

export default function Home() {
  const { profile, partner } = useAuth()
  const { wallet } = useCoyyns()
  const { recordOpened } = useGarden()

  // Record an "opened together" day for the shared garden (preserved behaviour).
  useEffect(() => {
    recordOpened()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const data: HomeViewData = useMemo(() => {
    const first = (name?: string | null) => name?.trim().split(/\s+/)[0]
    return {
      userName: first(profile?.display_name) || "You",
      partnerName: first(partner?.display_name) || "your love",
      greeting: buildGreeting(new Date()),
      subNote: "Welcome home ♡",
      userMood: null,
      partnerMood: null,
      today: {
        kind: "Today",
        title: "Add a little something to your keepsake.",
        body: "A note, a photo, a coupon — your call.",
        href: "/keepsake",
      },
      // Live keepsake/mood/coupon wiring lands in the Keepsake + Connect passes.
      keepsakes: [],
      balance: wallet?.balance ?? 0,
      coupon: null,
      rooms: ROOMS,
      avatarUrl: profile?.avatar_url ?? null,
    }
  }, [profile, partner, wallet])

  return <HomeView data={data} />
}

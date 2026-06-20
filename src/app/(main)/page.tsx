"use client"

import { useEffect, useMemo } from "react"
import { useAuth } from "@/lib/providers/AuthProvider"
import { useCoyyns } from "@/lib/hooks/use-coyyns"
import { useGarden } from "@/lib/hooks/use-garden"
import { useMood } from "@/lib/hooks/use-mood"
import { useSnap } from "@/lib/hooks/use-snap"
import { useCoupons } from "@/lib/hooks/use-coupons"
import { MOOD_EMOJI, MOOD_LABELS, type Mood } from "@/lib/types/mood.types"
import { HomeView, type HomeViewData } from "@/components/home/HomeView"

function buildGreeting(d: Date): string {
  const h = d.getHours()
  const part = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : h < 20 ? "Good evening" : "A quiet night"
  const day = d.toLocaleDateString("en-US", { weekday: "long" })
  return `${day} · ${part}`
}

// Map a mood_log row's enum to the {emoji,label} the card expects.
function toMood(m: string | null | undefined): HomeViewData["userMood"] {
  if (!m || !(m in MOOD_EMOJI)) return null
  return { emoji: MOOD_EMOJI[m as Mood], label: MOOD_LABELS[m as Mood] }
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
  const { todayMood, partnerMood } = useMood()
  const { snapFeed } = useSnap()
  const { receivedCoupons } = useCoupons()

  // Record an "opened together" day for the shared garden (preserved behaviour).
  useEffect(() => {
    recordOpened()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const data: HomeViewData = useMemo(() => {
    const first = (name?: string | null) => name?.trim().split(/\s+/)[0]
    const partnerName = first(partner?.display_name) || "your love"

    // Recent snaps with a photo become the keepsake peek.
    const keepsakes = snapFeed
      .filter((s) => !!s.photo_url)
      .slice(0, 3)
      .map((s) => ({
        thumb: s.photo_url as string,
        line: s.caption ?? "A moment together",
        tag: new Date(s.snap_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      }))

    // The most recent still-redeemable coupon from the partner.
    const activeCoupon = receivedCoupons.find((c) => c.status === "active")

    return {
      userName: first(profile?.display_name) || "You",
      partnerName,
      greeting: buildGreeting(new Date()),
      subNote: "Welcome home ♡",
      userMood: toMood(todayMood?.mood),
      partnerMood: toMood(partnerMood?.mood),
      today: {
        kind: "Today",
        title: "Add a little something to your keepsake.",
        body: "A note, a photo, a coupon — your call.",
        href: "/keepsake",
      },
      keepsakes,
      balance: wallet?.balance ?? 0,
      coupon: activeCoupon ? { title: activeCoupon.title, from: partnerName } : null,
      rooms: ROOMS,
      avatarUrl: profile?.avatar_url ?? null,
    }
  }, [profile, partner, wallet, todayMood, partnerMood, snapFeed, receivedCoupons])

  return <HomeView data={data} />
}

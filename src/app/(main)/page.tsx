"use client"

import { Heart, Sparkles, User, MoreHorizontal } from "lucide-react"
import { PageTransition } from "@/components/animations"
import { HomeGreeting } from "@/components/home/HomeGreeting"
import { QuickActionCard } from "@/components/home/QuickActionCard"
import { CoyynsWidget } from "@/components/home/CoyynsWidget"
import { HomeCycleWidget } from "@/components/home/HomeCycleWidget"
import { HomeCouponInbox } from "@/components/home/HomeCouponInbox"
import { FeelingGenerousCTA } from "@/components/home/FeelingGenerousCTA"

export default function Home() {
  return (
    <PageTransition>
      <HomeGreeting />

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-2 gap-4 px-5 mt-2">
        <QuickActionCard icon={<Heart size={20} />} label="Us" description="Your shared space" href="/us" />
        <QuickActionCard icon={<User size={20} />} label="Me" description="Body & soul" href="/me" />
        <QuickActionCard icon={<Sparkles size={20} />} label="2026" description="Vision board" href="/2026" />
        <QuickActionCard icon={<MoreHorizontal size={20} />} label="More" description="Settings & tools" href="/more" />
      </div>

      {/* Widget Slots */}
      <div className="flex flex-col gap-4 px-5 mt-6">
        <CoyynsWidget />
        <HomeCycleWidget />
        <HomeCouponInbox />
        <FeelingGenerousCTA />
      </div>
    </PageTransition>
  )
}

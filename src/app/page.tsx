"use client"

import { Heart, Activity, Sun, CheckSquare } from "lucide-react"
import { PageTransition } from "@/components/animations"
import { HomeGreeting } from "@/components/home/HomeGreeting"
import { QuickActionCard } from "@/components/home/QuickActionCard"
import { WidgetSlot } from "@/components/home/WidgetSlot"

export default function Home() {
  return (
    <PageTransition>
      <HomeGreeting />

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-2 gap-4 px-5 mt-2">
        <QuickActionCard icon={<Heart size={20} />} label="Us" description="Your shared space" href="/us" />
        <QuickActionCard icon={<Activity size={20} />} label="Health" description="Track your wellness" href="/health" />
        <QuickActionCard icon={<Sun size={20} />} label="Spirit" description="Daily practice" href="/spirit" />
        <QuickActionCard icon={<CheckSquare size={20} />} label="Ops" description="Lists & tasks" href="/ops" />
      </div>

      {/* Widget Slots */}
      <div className="flex flex-col gap-4 px-5 mt-6">
        <WidgetSlot />
        <WidgetSlot />
      </div>
    </PageTransition>
  )
}

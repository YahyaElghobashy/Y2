"use client"

import { Heart, Sparkles, User, MoreHorizontal } from "lucide-react"
import { PageTransition } from "@/components/animations"
import { HomeGreeting } from "@/components/home/HomeGreeting"
import { MoodStrip } from "@/components/home/MoodStrip"
import { QuickActionCard } from "@/components/home/QuickActionCard"
import { CoyynsWidget } from "@/components/home/CoyynsWidget"
import { HomeCycleWidget } from "@/components/home/HomeCycleWidget"
import { HomeCouponInbox } from "@/components/home/HomeCouponInbox"
import { FeelingGenerousCTA } from "@/components/home/FeelingGenerousCTA"
import { HomeMarketplaceRow } from "@/components/home/HomeMarketplaceRow"
import { HomePrayerWidget } from "@/components/home/HomePrayerWidget"
import { HomeCountdownWidget } from "@/components/home/HomeCountdownWidget"
import { HomeCalendarPeek } from "@/components/home/HomeCalendarPeek"
import { HomeRitualsWidget } from "@/components/home/HomeRitualsWidget"
import { HomeLetterPrompt } from "@/components/home/HomeLetterPrompt"
import { HomeEvaluationPrompt } from "@/components/home/HomeEvaluationPrompt"
import { useActivePurchases } from "@/lib/hooks/use-active-purchases"
import { ActivePurchaseCard } from "@/components/marketplace/ActivePurchaseCard"

export default function Home() {
  const { activePurchases, acknowledgePurchase, completePurchase, declinePurchase } = useActivePurchases()

  return (
    <PageTransition>
      <HomeGreeting />
      <MoodStrip className="mt-2" />

      {/* Active Purchases */}
      {activePurchases.length > 0 && (
        <div className="flex flex-col gap-3 px-5 mt-4">
          {activePurchases.map((purchase) => (
            <ActivePurchaseCard
              key={purchase.id}
              purchase={purchase}
              onAcknowledge={acknowledgePurchase}
              onComplete={completePurchase}
              onDecline={declinePurchase}
            />
          ))}
        </div>
      )}

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-2 gap-4 px-5 mt-2">
        <QuickActionCard icon={<Heart size={20} />} label="Us" description="Your shared space" href="/us" />
        <QuickActionCard icon={<User size={20} />} label="Me" description="Body & soul" href="/me" />
        <QuickActionCard icon={<Sparkles size={20} />} label="2026" description="Vision board" href="/2026" />
        <QuickActionCard icon={<MoreHorizontal size={20} />} label="More" description="Settings & tools" href="/more" />
      </div>

      {/* Marketplace Quick Buys */}
      <HomeMarketplaceRow className="mt-6" />

      {/* Widget Slots */}
      <div className="flex flex-col gap-4 px-5 mt-6">
        <CoyynsWidget />
        <HomeCycleWidget />
        <HomePrayerWidget />
        <HomeRitualsWidget />
        <HomeLetterPrompt />
        <HomeEvaluationPrompt />
        <HomeCountdownWidget />
        <HomeCalendarPeek />
        <HomeCouponInbox />
        <FeelingGenerousCTA />
      </div>
    </PageTransition>
  )
}

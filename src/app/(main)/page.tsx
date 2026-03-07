"use client"

import { useEffect } from "react"
import { PageTransition } from "@/components/animations"
import { TimeAwareBackground } from "@/components/ui/TimeAwareBackground"
import { HomeGreeting } from "@/components/home/HomeGreeting"
import { MoodPicker } from "@/components/mood/MoodPicker"
import { PartnerMoodIndicator } from "@/components/home/PartnerMoodIndicator"
import { MoodStrip } from "@/components/home/MoodStrip"
import { HomeSnapWidget } from "@/components/home/HomeSnapWidget"
import { CoyynsWidget } from "@/components/home/CoyynsWidget"
import { HomeMarketplaceRow } from "@/components/home/HomeMarketplaceRow"
import { useActivePurchases } from "@/lib/hooks/use-active-purchases"
import { ActivePurchaseCard } from "@/components/marketplace/ActivePurchaseCard"
import { HomeCouponInbox } from "@/components/home/HomeCouponInbox"
import { FeelingGenerousCTA } from "@/components/home/FeelingGenerousCTA"
import { HomeRitualsWidget } from "@/components/home/HomeRitualsWidget"
import { HomeCalendarPeek } from "@/components/home/HomeCalendarPeek"
import { HomeCycleWidget } from "@/components/home/HomeCycleWidget"
import { HomePrayerWidget } from "@/components/home/HomePrayerWidget"
import { SharedGarden } from "@/components/garden/SharedGarden"
import { DaysTogetherCounter } from "@/components/shared/DaysTogetherCounter"
import { HomeLetterPrompt } from "@/components/home/HomeLetterPrompt"
import { HomeEvaluationPrompt } from "@/components/home/HomeEvaluationPrompt"
import { HomeCountdownWidget } from "@/components/home/HomeCountdownWidget"
import { GradientDivider } from "@/components/ui/GradientDivider"
import { AnnouncementBanner } from "@/components/shared/AnnouncementBanner"
import { useGarden } from "@/lib/hooks/use-garden"

export default function Home() {
  const { activePurchases, acknowledgePurchase, completePurchase, declinePurchase } = useActivePurchases()
  const { recordOpened } = useGarden()

  // Record that the user opened the app today (for shared garden)
  useEffect(() => {
    recordOpened()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <TimeAwareBackground>
    <PageTransition>
      {/* 0. Announcement Banner */}
      <AnnouncementBanner
        messages={[
          "Welcome to Hayah — your shared companion",
          "Tap the mascot for quick actions",
          "New: Rituals & Prayer widgets available",
        ]}
        className="px-5 pt-3"
      />

      {/* 1. Greeting + MoodPicker */}
      <HomeGreeting />
      <MoodPicker className="mt-3 px-5" />

      {/* 2. PartnerMoodIndicator */}
      <div className="px-5 mt-2">
        <PartnerMoodIndicator />
      </div>

      {/* 3. MoodStrip */}
      <MoodStrip className="mt-2" />

      {/* Divider: Mood → Snap */}
      <GradientDivider className="mt-4 mx-5" />

      {/* 4. HomeSnapWidget */}
      <HomeSnapWidget className="mx-5 mt-3" />

      {/* 5. CoYYns Hero */}
      <div className="px-5 mt-4">
        <CoyynsWidget />
      </div>

      {/* Divider: CoYYns → Marketplace */}
      <GradientDivider className="mt-4 mx-5" glow />

      {/* 6. HomeMarketplaceRow */}
      <HomeMarketplaceRow className="mt-4" />

      {/* 7. Active Purchases */}
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

      {/* Divider: Marketplace → Widgets */}
      <GradientDivider className="mt-4 mx-5" />

      {/* 8–15: Widget Slots */}
      <div className="flex flex-col gap-3 px-5 mt-4 pb-8">
        {/* 8. HomeCouponInbox */}
        <HomeCouponInbox />

        {/* 9. FeelingGenerousCTA */}
        <FeelingGenerousCTA />

        {/* 10. HomeRitualsWidget */}
        <HomeRitualsWidget />

        {/* 11. HomeCalendarPeek */}
        <HomeCalendarPeek />

        {/* 12. HomeCycleWidget (self-managing null) */}
        <HomeCycleWidget />

        {/* 13. HomePrayerWidget (self-managing null) */}
        <HomePrayerWidget />

        {/* 14. SharedGarden preview (last 8 flowers, compact) */}
        <h3 className="font-nav text-[11px] font-medium uppercase tracking-widest text-[var(--text-secondary,#8C8279)]">Our Garden</h3>
        <SharedGarden compact />

        {/* 15. DaysTogetherCounter */}
        <DaysTogetherCounter />

        {/* Remaining widgets */}
        <HomeLetterPrompt />
        <HomeEvaluationPrompt />
        <HomeCountdownWidget />
      </div>
    </PageTransition>
    </TimeAwareBackground>
  )
}

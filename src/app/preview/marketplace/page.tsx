"use client"

import { MarketplaceView, MARKET_MOCK } from "@/components/marketplace/MarketplaceView"
import { BottomNav } from "@/components/shared/BottomNav"

export default function PreviewMarketplacePage() {
  return (
    <div className="relative mx-auto min-h-[100dvh] max-w-[430px]" style={{ background: "var(--background)" }}>
      <MarketplaceView items={MARKET_MOCK} initialBalance={248} />
      <BottomNav />
    </div>
  )
}

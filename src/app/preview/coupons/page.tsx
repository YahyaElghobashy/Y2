"use client"

import { CouponsView, COUPONS_MOCK } from "@/components/coupons/CouponsView"
import { BottomNav } from "@/components/shared/BottomNav"

export default function PreviewCouponsPage() {
  return (
    <div className="relative mx-auto min-h-[100dvh] max-w-[430px]" style={{ background: "var(--background)" }}>
      <CouponsView initial={COUPONS_MOCK} />
      <BottomNav />
    </div>
  )
}

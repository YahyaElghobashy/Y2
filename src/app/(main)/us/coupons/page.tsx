"use client"

import { useMemo } from "react"
import { toast } from "sonner"
import { PageTransition } from "@/components/animations"
import { PageHeader } from "@/components/shared/PageHeader"
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton"
import { CouponsView, type CouponItem } from "@/components/coupons/CouponsView"
import { CouponTicket } from "@/components/coupons/CouponTicket"
import { useCoupons } from "@/lib/hooks/use-coupons"
import { useAuth } from "@/lib/providers/AuthProvider"
import type { Coupon } from "@/lib/types/relationship.types"

/** Map a real coupon row's status onto the ticket's three visual states. */
function mapStatus(status: string): React.ComponentProps<typeof CouponTicket>["status"] {
  if (status === "redeemed" || status === "approved") return "redeemed"
  if (status === "pending_approval") return "pending"
  return "active"
}

export default function CouponWalletPage() {
  const { partner, profile } = useAuth()
  const { myCoupons, receivedCoupons, redeemCoupon, isLoading } = useCoupons()

  const partnerName = partner?.display_name ?? "your love"
  const myName = profile?.display_name ?? "You"

  const items: CouponItem[] = useMemo(() => {
    const received = receivedCoupons.map((c: Coupon) => ({
      id: c.id,
      title: c.title,
      from: partnerName,
      status: mapStatus(c.status),
      mine: false,
    }))
    const mine = myCoupons.map((c: Coupon) => ({
      id: c.id,
      title: c.title,
      from: myName,
      status: mapStatus(c.status),
      mine: true,
    }))
    return [...received, ...mine]
  }, [receivedCoupons, myCoupons, partnerName, myName])

  if (isLoading) {
    return (
      <PageTransition>
        <PageHeader title="Coupons" backHref="/treasury" />
        <div className="px-5 py-6">
          <LoadingSkeleton variant="card" count={3} />
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <CouponsView
        initial={items}
        onRedeem={(id) => {
          // Promise.resolve guards against a non-thenable return; redeemCoupon
          // throws on failure so the .catch surfaces it instead of a silent fail.
          Promise.resolve(redeemCoupon(id))
            .then(() => toast.success("Redemption requested!"))
            .catch(() => toast.error("Failed to redeem coupon"))
        }}
      />
    </PageTransition>
  )
}

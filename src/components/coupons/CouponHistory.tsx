"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Ticket } from "lucide-react"
import { cn } from "@/lib/utils"
import { useCoupons } from "@/lib/hooks/use-coupons"
import { CouponCard } from "@/components/relationship/CouponCard"
import { StaggerList } from "@/components/animations"
import { EmptyState } from "@/components/shared/EmptyState"
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton"
import type { Coupon } from "@/lib/types/relationship.types"

type CouponHistoryProps = {
  className?: string
}

const PAGE_SIZE = 20

const TERMINAL_STATUSES = new Set(["redeemed", "rejected", "expired"])

function getActivityDate(coupon: Coupon): Date {
  const dateStr =
    coupon.approved_at ?? coupon.rejected_at ?? coupon.redeemed_at ?? coupon.updated_at
  return new Date(dateStr)
}

function getActivityLabel(coupon: Coupon): string {
  if (coupon.status === "redeemed") {
    const d = coupon.approved_at ?? coupon.redeemed_at
    return d ? `Redeemed ${format(new Date(d), "MMM d, yyyy")}` : "Redeemed"
  }
  if (coupon.status === "rejected") {
    const d = coupon.rejected_at
    return d ? `Denied ${format(new Date(d), "MMM d, yyyy")}` : "Denied"
  }
  if (coupon.status === "expired") {
    const d = coupon.expires_at
    return d ? `Expired ${format(new Date(d), "MMM d, yyyy")}` : "Expired"
  }
  return ""
}

type MonthGroup = {
  label: string
  coupons: Coupon[]
}

export function CouponHistory({ className }: CouponHistoryProps) {
  const router = useRouter()
  const { myCoupons, receivedCoupons, isLoading } = useCoupons()
  const [page, setPage] = useState(1)
  const sentinelRef = useRef<HTMLDivElement>(null)

  // Merge, dedupe, filter terminal, sort desc
  const historyCoupons = useMemo(() => {
    const map = new Map<string, Coupon>()
    for (const c of [...myCoupons, ...receivedCoupons]) {
      if (TERMINAL_STATUSES.has(c.status) && !map.has(c.id)) {
        map.set(c.id, c)
      }
    }
    return Array.from(map.values()).sort(
      (a, b) => getActivityDate(b).getTime() - getActivityDate(a).getTime()
    )
  }, [myCoupons, receivedCoupons])

  // Paginated slice
  const visibleCoupons = useMemo(
    () => historyCoupons.slice(0, page * PAGE_SIZE),
    [historyCoupons, page]
  )
  const hasMore = visibleCoupons.length < historyCoupons.length

  // Group by month
  const monthGroups = useMemo(() => {
    const groups: MonthGroup[] = []
    let currentLabel = ""
    let currentGroup: Coupon[] = []

    for (const coupon of visibleCoupons) {
      const label = format(getActivityDate(coupon), "MMMM yyyy")
      if (label !== currentLabel) {
        if (currentGroup.length > 0) {
          groups.push({ label: currentLabel, coupons: currentGroup })
        }
        currentLabel = label
        currentGroup = [coupon]
      } else {
        currentGroup.push(coupon)
      }
    }
    if (currentGroup.length > 0) {
      groups.push({ label: currentLabel, coupons: currentGroup })
    }

    return groups
  }, [visibleCoupons])

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    if (!hasMore || !sentinelRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setPage((p) => p + 1)
        }
      },
      { rootMargin: "200px" }
    )

    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [hasMore])

  if (isLoading) {
    return <LoadingSkeleton variant="list-item" count={4} className={className} />
  }

  if (historyCoupons.length === 0) {
    return (
      <EmptyState
        icon={<Ticket size={48} strokeWidth={1.25} />}
        title="No history yet"
        subtitle="Redeemed and expired coupons will appear here"
        className={className}
      />
    )
  }

  return (
    <div className={cn("flex flex-col", className)} data-testid="coupon-history">
      {monthGroups.map((group) => (
        <div key={group.label}>
          {/* Month divider */}
          <div
            className="sticky top-0 z-10 bg-[var(--bg-primary)] px-1 py-2 text-[13px] font-medium font-body text-[var(--text-secondary)]"
            data-testid="month-divider"
          >
            {group.label}
          </div>

          <StaggerList className="flex flex-col gap-3">
            {group.coupons.map((coupon) => (
              <div key={coupon.id} className="flex flex-col gap-1">
                <CouponCard
                  coupon={coupon}
                  compact
                  onPress={() => router.push(`/us/coupons/${coupon.id}`)}
                />
                <span
                  className="ps-1 text-[12px] font-body text-[var(--text-muted)]"
                  data-testid="activity-label"
                >
                  {getActivityLabel(coupon)}
                </span>
              </div>
            ))}
          </StaggerList>
        </div>
      ))}

      {/* Sentinel for infinite scroll */}
      {hasMore && (
        <div ref={sentinelRef} data-testid="scroll-sentinel">
          <LoadingSkeleton variant="list-item" count={2} className="mt-3" />
        </div>
      )}
    </div>
  )
}

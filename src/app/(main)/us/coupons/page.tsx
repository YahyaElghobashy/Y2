"use client"

import { useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Gift } from "lucide-react"
import { cn } from "@/lib/utils"
import { PageTransition } from "@/components/animations"
import { StaggerList } from "@/components/animations"
import { PageHeader } from "@/components/shared/PageHeader"
import { EmptyState } from "@/components/shared/EmptyState"
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton"
import { CouponCard } from "@/components/relationship/CouponCard"
import { CouponHistory } from "@/components/coupons/CouponHistory"
import { useCoupons } from "@/lib/hooks/use-coupons"

const TABS = [
  { id: "for-me", label: "For Me" },
  { id: "i-made", label: "I Made" },
  { id: "history", label: "History" },
] as const

type TabId = (typeof TABS)[number]["id"]

const EASE_OUT: [number, number, number, number] = [0.25, 0.1, 0.25, 1]
const PULL_THRESHOLD = 60

export default function CouponWalletPage() {
  const router = useRouter()
  const { myCoupons, receivedCoupons, pendingApprovals, isLoading, refreshCoupons } = useCoupons()
  const [activeTab, setActiveTab] = useState<TabId>("for-me")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const touchStartY = useRef(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY
  }, [])

  const handleTouchEnd = useCallback(
    async (e: React.TouchEvent) => {
      const deltaY = e.changedTouches[0].clientY - touchStartY.current
      const atTop = !scrollRef.current || scrollRef.current.scrollTop <= 0
      if (deltaY > PULL_THRESHOLD && atTop && !isRefreshing) {
        setIsRefreshing(true)
        await refreshCoupons()
        setIsRefreshing(false)
      }
    },
    [isRefreshing, refreshCoupons]
  )

  // "For Me" tab data
  const forMeCoupons = receivedCoupons.filter(
    (c) => c.status === "active" || c.status === "pending_approval"
  )
  const forMeActive = forMeCoupons
    .filter((c) => c.status === "active")
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  const forMePending = forMeCoupons.filter((c) => c.status === "pending_approval")
  const forMeSorted = [...forMeActive, ...forMePending]

  // "I Made" tab data
  const iMadeActive = myCoupons.filter(
    (c) => c.status === "active" || c.status === "pending_approval"
  )
  const iMadePending = pendingApprovals
  const iMadeRest = iMadeActive
    .filter((c) => c.status !== "pending_approval")
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return (
    <PageTransition>
      <PageHeader title="Coupons" backHref="/us" />

      {/* Pull-to-refresh indicator */}
      {isRefreshing && (
        <div className="flex justify-center py-2">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--accent-primary)] border-t-transparent" />
        </div>
      )}

      {/* Pill tab bar */}
      <div className="flex gap-2 px-5 pb-4" role="tablist" data-testid="tab-bar">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "relative rounded-full px-4 py-2 text-[13px] font-medium font-[family-name:var(--font-body)] transition-colors",
                isActive
                  ? "text-white"
                  : "bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
              )}
              data-testid={`tab-${tab.id}`}
            >
              {isActive && (
                <motion.div
                  layoutId="coupon-wallet-tab"
                  className="absolute inset-0 rounded-full bg-[var(--accent-primary)]"
                  transition={{ duration: 0.25, ease: EASE_OUT }}
                />
              )}
              <span className="relative z-10">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      <div
        ref={scrollRef}
        className="px-5 pb-6"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {isLoading ? (
          <div className="flex flex-col gap-3" data-testid="loading-state">
            <LoadingSkeleton variant="card" />
            <LoadingSkeleton variant="card" />
            <LoadingSkeleton variant="card" />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === "for-me" && (
                <ForMeTab coupons={forMeSorted} onPress={(id) => router.push(`/us/coupons/${id}`)} />
              )}
              {activeTab === "i-made" && (
                <IMadeTab
                  pendingApprovals={iMadePending}
                  activeCoupons={iMadeRest}
                  onPress={(id) => router.push(`/us/coupons/${id}`)}
                />
              )}
              {activeTab === "history" && <CouponHistory />}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </PageTransition>
  )
}

// -- Sub-components --

type ForMeTabProps = {
  coupons: ReturnType<typeof useCoupons>["receivedCoupons"]
  onPress: (id: string) => void
}

function ForMeTab({ coupons, onPress }: ForMeTabProps) {
  if (coupons.length === 0) {
    return (
      <EmptyState
        icon={<Gift size={48} strokeWidth={1.25} />}
        title="No coupons yet"
        subtitle="Your partner's gifts will appear here"
      />
    )
  }

  return (
    <StaggerList className="flex flex-col gap-3">
      {coupons.map((coupon) => (
        <CouponCard
          key={coupon.id}
          coupon={coupon}
          onPress={() => onPress(coupon.id)}
        />
      ))}
    </StaggerList>
  )
}

type IMadeTabProps = {
  pendingApprovals: ReturnType<typeof useCoupons>["pendingApprovals"]
  activeCoupons: ReturnType<typeof useCoupons>["myCoupons"]
  onPress: (id: string) => void
}

function IMadeTab({ pendingApprovals, activeCoupons, onPress }: IMadeTabProps) {
  if (pendingApprovals.length === 0 && activeCoupons.length === 0) {
    return (
      <EmptyState
        icon={<Gift size={48} strokeWidth={1.25} />}
        title="No coupons created"
        subtitle="Feeling generous?"
        actionLabel="Create one"
        actionHref="/create-coupon"
      />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Pending approvals section */}
      {pendingApprovals.length > 0 && (
        <div data-testid="pending-section">
          <h3 className="mb-2 text-[13px] font-semibold font-[family-name:var(--font-body)] text-[var(--accent-primary)]">
            Needs Your Attention
          </h3>
          <StaggerList className="flex flex-col gap-3">
            {pendingApprovals.map((coupon) => (
              <div
                key={coupon.id}
                className="rounded-[var(--radius-card)] border-s-2 border-s-[var(--accent-primary)]"
              >
                <CouponCard coupon={coupon} onPress={() => onPress(coupon.id)} />
              </div>
            ))}
          </StaggerList>
        </div>
      )}

      {/* Active coupons */}
      {activeCoupons.length > 0 && (
        <StaggerList className="flex flex-col gap-3">
          {activeCoupons.map((coupon) => (
            <CouponCard
              key={coupon.id}
              coupon={coupon}
              onPress={() => onPress(coupon.id)}
            />
          ))}
        </StaggerList>
      )}
    </div>
  )
}

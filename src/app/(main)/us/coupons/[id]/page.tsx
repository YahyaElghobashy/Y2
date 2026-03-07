"use client"

import { useState, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { motion } from "framer-motion"
import { Clock, AlertCircle, Eye } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"
import { PageTransition } from "@/components/animations"
import { PageHeader } from "@/components/shared/PageHeader"
import { EmptyState } from "@/components/shared/EmptyState"
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton"
import { RedeemConfirmModal } from "@/components/coupons/RedeemConfirmModal"
import { RedeemStampAnimation } from "@/components/coupons/RedeemStampAnimation"
import { useCoupons } from "@/lib/hooks/use-coupons"
import { useAuth } from "@/lib/providers/AuthProvider"

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  romantic: { bg: "bg-pink-100", text: "text-pink-700" },
  practical: { bg: "bg-blue-100", text: "text-blue-700" },
  fun: { bg: "bg-yellow-100", text: "text-yellow-700" },
  food: { bg: "bg-green-100", text: "text-green-700" },
  general: { bg: "bg-gray-100", text: "text-gray-600" },
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active: { label: "Active", color: "bg-[var(--success)]" },
  pending_approval: { label: "Pending Approval", color: "bg-[var(--warning)]" },
  redeemed: { label: "Redeemed", color: "bg-[var(--accent-primary)]" },
  rejected: { label: "Denied", color: "bg-[var(--error)]" },
  expired: { label: "Expired", color: "bg-[var(--text-muted)]" },
}

export default function CouponDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { user } = useAuth()
  const { myCoupons, receivedCoupons, isLoading, error, refreshCoupons, revealSurprise } = useCoupons()
  const [modalMode, setModalMode] = useState<"redeem" | "approve" | "deny" | null>(null)
  const [showStamp, setShowStamp] = useState(false)

  const coupon = useMemo(() => {
    const all = [...myCoupons, ...receivedCoupons]
    return all.find((c) => c.id === id) ?? null
  }, [myCoupons, receivedCoupons, id])

  const isCreator = user?.id === coupon?.creator_id
  const isRecipient = user?.id === coupon?.recipient_id

  const handleModalConfirm = () => {
    if (modalMode === "approve") {
      setShowStamp(true)
    }
    refreshCoupons()
  }

  const handleReveal = async () => {
    if (coupon) await revealSurprise(coupon.id)
  }

  // Loading state
  if (isLoading) {
    return (
      <PageTransition>
        <PageHeader title="Coupon" backHref="/us/coupons" />
        <LoadingSkeleton variant="full-page" />
      </PageTransition>
    )
  }

  // Error state
  if (error) {
    return (
      <PageTransition>
        <PageHeader title="Coupon" backHref="/us/coupons" />
        <div className="flex flex-col items-center justify-center gap-3 px-5 py-12" data-testid="error-state">
          <AlertCircle size={48} strokeWidth={1.25} className="text-[var(--error)]" />
          <p className="text-[15px] font-body text-[var(--text-secondary)]">
            Something went wrong
          </p>
          <button
            onClick={() => refreshCoupons()}
            className="rounded-lg bg-[var(--accent-primary)] px-6 py-2.5 text-[14px] font-medium text-white"
            data-testid="retry-button"
          >
            Try again
          </button>
        </div>
      </PageTransition>
    )
  }

  // 404 state
  if (!coupon) {
    return (
      <PageTransition>
        <PageHeader title="Coupon" backHref="/us/coupons" />
        <EmptyState
          icon={<AlertCircle size={48} strokeWidth={1.25} />}
          title="Coupon not found"
          subtitle="It may have been removed"
          actionLabel="Go back"
          onAction={() => router.push("/us/coupons")}
        />
      </PageTransition>
    )
  }

  const categoryStyle = CATEGORY_COLORS[coupon.category] ?? CATEGORY_COLORS.general
  const statusInfo = STATUS_LABELS[coupon.status] ?? STATUS_LABELS.active

  const isExpired = coupon.expires_at && new Date(coupon.expires_at) < new Date()
  const expiryText = coupon.expires_at
    ? isExpired
      ? "Expired"
      : `Expires ${formatDistanceToNow(new Date(coupon.expires_at), { addSuffix: true })}`
    : null

  const canReveal = isCreator && coupon.is_surprise && !coupon.surprise_revealed

  return (
    <PageTransition>
      <PageHeader title="Coupon" backHref="/us/coupons" />

      <div className="relative px-5 pb-28">
        {/* Photo */}
        {coupon.image_url && (
          <div className="relative mb-4 aspect-video w-full overflow-hidden rounded-2xl" data-testid="coupon-photo">
            <Image
              src={coupon.image_url}
              alt={coupon.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 500px"
            />
          </div>
        )}

        {/* Emoji + Title */}
        <div className="flex items-start gap-3">
          {coupon.emoji && <span className="text-[40px] leading-none">{coupon.emoji}</span>}
          <div className="min-w-0 flex-1">
            <h2
              className="text-[22px] font-bold font-display text-[var(--text-primary)]"
              data-testid="detail-title"
            >
              {coupon.title}
            </h2>
          </div>
        </div>

        {/* Description */}
        {coupon.description && (
          <p
            className="mt-3 text-[15px] font-body text-[var(--text-secondary)] leading-relaxed"
            data-testid="detail-description"
          >
            {coupon.description}
          </p>
        )}

        {/* Meta row: category + status */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "rounded-full px-3 py-1 text-[12px] font-medium font-body",
              categoryStyle.bg,
              categoryStyle.text
            )}
            data-testid="detail-category"
          >
            {coupon.category}
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-[var(--bg-secondary)] px-3 py-1" data-testid="detail-status">
            <span className={cn("inline-block h-2 w-2 rounded-full", statusInfo.color)} />
            <span className="text-[12px] font-medium font-body text-[var(--text-secondary)]">
              {statusInfo.label}
            </span>
          </span>
        </div>

        {/* Creator info */}
        <p className="mt-3 text-[13px] font-body text-[var(--text-muted)]">
          {isCreator ? "Created by you" : "From your partner"}
        </p>

        {/* Expiry */}
        {expiryText && (
          <div className="mt-3 flex items-center gap-1.5" data-testid="detail-expiry">
            <Clock size={14} className={isExpired ? "text-[var(--error)]" : "text-[var(--text-muted)]"} />
            <span
              className={cn(
                "text-[13px] font-body",
                isExpired ? "text-[var(--error)]" : "text-[var(--text-muted)]"
              )}
            >
              {expiryText}
            </span>
          </div>
        )}

        {/* Reveal button for surprise */}
        {canReveal && (
          <motion.button
            onClick={handleReveal}
            whileTap={{ scale: 0.98 }}
            className="mt-4 flex items-center gap-2 rounded-lg bg-[var(--bg-secondary)] px-4 py-2.5"
            data-testid="reveal-button"
          >
            <Eye size={16} className="text-[var(--accent-primary)]" />
            <span className="text-[14px] font-medium font-body text-[var(--accent-primary)]">
              Reveal to partner
            </span>
          </motion.button>
        )}

        {/* REDEEMED stamp overlay */}
        {coupon.status === "redeemed" && (
          <div className="relative mt-6 flex h-24 items-center justify-center" data-testid="stamp-overlay">
            <RedeemStampAnimation visible={true} />
          </div>
        )}

        {/* Animated stamp on approval */}
        {showStamp && coupon.status !== "redeemed" && (
          <div className="relative mt-6 flex h-24 items-center justify-center">
            <RedeemStampAnimation visible={true} onComplete={() => setShowStamp(false)} />
          </div>
        )}
      </div>

      {/* Sticky action bar */}
      {(isRecipient && coupon.status === "active") && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-5 pb-8 pt-4" data-testid="action-bar">
          <motion.button
            onClick={() => setModalMode("redeem")}
            whileTap={{ scale: 0.98 }}
            className="h-12 w-full rounded-xl bg-[var(--accent-primary)] text-[15px] font-medium font-body text-white"
            data-testid="redeem-button"
          >
            Redeem This Coupon
          </motion.button>
        </div>
      )}

      {(isCreator && coupon.status === "pending_approval") && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-5 pb-8 pt-4" data-testid="action-bar">
          <div className="flex gap-3">
            <motion.button
              onClick={() => setModalMode("approve")}
              whileTap={{ scale: 0.98 }}
              className="h-12 flex-1 rounded-xl bg-[var(--accent-primary)] text-[15px] font-medium font-body text-white"
              data-testid="approve-button"
            >
              Approve
            </motion.button>
            <motion.button
              onClick={() => setModalMode("deny")}
              whileTap={{ scale: 0.98 }}
              className="h-12 flex-1 rounded-xl border border-[var(--border-subtle)] text-[15px] font-medium font-body text-[var(--text-secondary)]"
              data-testid="deny-button"
            >
              Deny
            </motion.button>
          </div>
        </div>
      )}

      {/* Redemption modal */}
      {modalMode && (
        <RedeemConfirmModal
          open={!!modalMode}
          coupon={coupon}
          mode={modalMode}
          onClose={() => setModalMode(null)}
          onConfirm={handleModalConfirm}
        />
      )}
    </PageTransition>
  )
}

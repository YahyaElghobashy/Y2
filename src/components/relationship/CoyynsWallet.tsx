"use client"

import { useEffect, useRef } from "react"
import { motion, useMotionValue, useTransform, animate } from "framer-motion"
import { cn } from "@/lib/utils"
import { useCoyyns } from "@/lib/hooks/use-coyyns"
import { useAuth } from "@/lib/providers/AuthProvider"

type CoyynsWalletProps = {
  onAdd?: () => void
  onSpend?: () => void
  className?: string
}

const EASE_OUT: [number, number, number, number] = [0.25, 0.1, 0.25, 1]

function AnimatedBalance({ value }: { value: number }) {
  const count = useMotionValue(0)
  const rounded = useTransform(count, (v) => Math.round(v).toLocaleString())
  const prevValue = useRef(0)

  useEffect(() => {
    const from = prevValue.current
    prevValue.current = value
    animate(count, value, {
      duration: 0.6,
      ease: "easeOut",
      ...(from === 0 && value === 0 ? { duration: 0 } : {}),
    })
  }, [value, count])

  return (
    <motion.span data-testid="balance-value">
      {rounded}
    </motion.span>
  )
}

function ShimmerPlaceholder({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded bg-accent-soft/30 animate-pulse",
        className,
      )}
    />
  )
}

export function CoyynsWallet({ onAdd, onSpend, className }: CoyynsWalletProps) {
  const { wallet, partnerWallet, isLoading, error, refreshWallet } = useCoyyns()
  const { partner } = useAuth()

  const partnerName = partner?.display_name ?? "Partner"
  const partnerBalance = partnerWallet?.balance ?? 0

  if (error) {
    return (
      <motion.div
        className={cn(
          "rounded-2xl bg-bg-elevated p-6 border border-border-subtle shadow-[0_2px_12px_rgba(44,40,37,0.06)]",
          className,
        )}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: EASE_OUT }}
      >
        <div className="flex flex-col items-center gap-2 py-4">
          <p className="text-[13px] text-text-secondary font-[var(--font-body)]">
            Couldn&apos;t load wallet
          </p>
          <button
            type="button"
            onClick={() => refreshWallet()}
            className="text-[13px] text-accent-primary font-medium font-[var(--font-body)]"
          >
            Retry
          </button>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      className={cn(
        "rounded-2xl bg-bg-elevated p-6 border border-border-subtle shadow-[0_2px_12px_rgba(44,40,37,0.06)]",
        className,
      )}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: EASE_OUT }}
    >
      {isLoading ? (
        <div className="flex flex-col items-center gap-4" data-testid="wallet-loading">
          <ShimmerPlaceholder className="h-10 w-32" />
          <ShimmerPlaceholder className="h-4 w-20" />
          <div className="w-full border-t border-border-subtle" />
          <div className="flex w-full justify-between">
            <ShimmerPlaceholder className="h-4 w-24" />
            <ShimmerPlaceholder className="h-4 w-24" />
          </div>
          <ShimmerPlaceholder className="h-4 w-40" />
          <div className="w-full border-t border-border-subtle" />
          <div className="flex w-full gap-3">
            <ShimmerPlaceholder className="h-10 flex-1" />
            <ShimmerPlaceholder className="h-10 flex-1" />
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-0">
          {/* Coin icon */}
          <span className="text-[28px] leading-none" role="img" aria-label="CoYYns">
            🪙
          </span>

          {/* Balance */}
          <div className="mt-3 text-[40px] leading-none font-[var(--font-mono)] text-accent-primary font-normal">
            <AnimatedBalance value={wallet?.balance ?? 0} />
          </div>

          {/* Label */}
          <p className="mt-1.5 text-sm text-text-secondary font-[var(--font-body)] uppercase tracking-[0.12em]">
            CoYYns
          </p>

          {/* Divider */}
          <div className="mt-4 w-full border-t border-border-subtle" />

          {/* Stats row */}
          <div className="mt-4 flex w-full justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="text-[13px] text-text-muted font-[var(--font-body)]">Earned</span>
              <span className="text-[13px] text-text-muted font-[var(--font-mono)]" data-testid="lifetime-earned">
                {(wallet?.lifetime_earned ?? 0).toLocaleString()}
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[13px] text-text-muted font-[var(--font-body)]">Spent</span>
              <span className="text-[13px] text-text-muted font-[var(--font-mono)]" data-testid="lifetime-spent">
                {(wallet?.lifetime_spent ?? 0).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Partner row */}
          <p className="mt-3 text-[13px] text-text-secondary font-[var(--font-body)] italic" data-testid="partner-row">
            {partnerName} has {partnerBalance.toLocaleString()} CoYYns
          </p>

          {/* Divider */}
          <div className="mt-4 w-full border-t border-border-subtle" />

          {/* Action buttons */}
          <div className="mt-4 flex w-full gap-3">
            <button
              type="button"
              onClick={onAdd}
              className="flex-1 h-10 rounded-xl border border-accent-primary text-accent-primary text-sm font-medium font-[var(--font-body)] transition-colors"
            >
              + Add
            </button>
            <button
              type="button"
              onClick={onSpend}
              className="flex-1 h-10 rounded-xl bg-accent-primary text-[var(--color-bg-elevated)] text-sm font-medium font-[var(--font-body)] transition-colors"
            >
              − Spend
            </button>
          </div>
        </div>
      )}
    </motion.div>
  )
}

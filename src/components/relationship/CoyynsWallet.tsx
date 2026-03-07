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
          <p className="text-[13px] text-text-secondary font-body">
            Couldn&apos;t load wallet
          </p>
          <button
            type="button"
            onClick={() => refreshWallet()}
            className="text-[13px] text-accent-primary font-medium font-body"
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
        "texture-leather rounded-2xl overflow-hidden shimmer-overlay",
        className,
      )}
      style={{
        boxShadow: "0 4px 24px rgba(44,40,37,0.10), 0 1px 3px rgba(44,40,37,0.06)",
      }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: EASE_OUT }}
    >
      {isLoading ? (
        <div className="flex flex-col items-center gap-4 p-6" data-testid="wallet-loading">
          <div className="h-10 w-32 rounded animate-skeleton-warm" style={{ backgroundColor: "var(--bg-soft-cream, #F5EDE3)" }} />
          <div className="h-4 w-20 rounded animate-skeleton-warm" style={{ backgroundColor: "var(--bg-soft-cream, #F5EDE3)" }} />
          <div className="w-full border-t border-[rgba(184,115,51,0.1)]" />
          <div className="flex w-full justify-between">
            <div className="h-4 w-24 rounded animate-skeleton-warm" style={{ backgroundColor: "var(--bg-soft-cream, #F5EDE3)" }} />
            <div className="h-4 w-24 rounded animate-skeleton-warm" style={{ backgroundColor: "var(--bg-soft-cream, #F5EDE3)" }} />
          </div>
        </div>
      ) : (
        <>
          {/* Hero section */}
          <div
            className="px-6 pt-6 pb-5 flex flex-col items-center"
            style={{
              background: "linear-gradient(135deg, var(--bg-warm-white, #FFFDF9) 0%, var(--bg-soft-cream, #F5EDE3) 100%)",
            }}
          >
            {/* Balance */}
            <div
              className="text-[32px] leading-none font-display font-normal tabular-nums"
              style={{ color: "var(--accent-copper, #B87333)" }}
            >
              <AnimatedBalance value={wallet?.balance ?? 0} />
            </div>

            {/* Label */}
            <p
              className="mt-1 text-[11px] font-bold uppercase tracking-[0.2em] font-body"
              style={{ color: "var(--text-muted, #B5ADA4)" }}
            >
              CoYYns
            </p>

            {/* Subtitle */}
            <p
              className="mt-2 font-serif text-[13px] italic"
              style={{ color: "var(--text-secondary, #6B6560)" }}
            >
              Our shared joy pot
            </p>
          </div>

          {/* Stats + partner row */}
          <div className="px-6 py-4 bg-white">
            <div className="flex justify-between mb-3">
              <div className="flex items-baseline gap-1.5">
                <span className="text-[12px] text-[var(--text-muted)] font-body">Earned</span>
                <span className="text-[12px] font-mono font-medium" style={{ color: "var(--accent-copper, #B87333)" }} data-testid="lifetime-earned">
                  {(wallet?.lifetime_earned ?? 0).toLocaleString()}
                </span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-[12px] text-[var(--text-muted)] font-body">Spent</span>
                <span className="text-[12px] font-mono font-medium" style={{ color: "var(--text-secondary, #6B6560)" }} data-testid="lifetime-spent">
                  {(wallet?.lifetime_spent ?? 0).toLocaleString()}
                </span>
              </div>
            </div>

            <p className="text-[12px] text-[var(--text-secondary)] font-body italic" data-testid="partner-row">
              {partnerName} has {partnerBalance.toLocaleString()} CoYYns
            </p>

            {/* Action buttons */}
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={onAdd}
                className="flex-1 h-10 rounded-xl text-sm font-medium font-body transition-colors"
                style={{
                  border: "1px solid var(--accent-copper, #B87333)",
                  color: "var(--accent-copper, #B87333)",
                }}
              >
                + Add
              </button>
              <button
                type="button"
                onClick={onSpend}
                className="flex-1 h-10 rounded-xl text-sm font-medium font-body text-white transition-colors"
                style={{
                  backgroundColor: "var(--accent-copper, #B87333)",
                  boxShadow: "0 2px 8px rgba(184,115,51,0.2)",
                }}
              >
                − Spend
              </button>
            </div>
          </div>
        </>
      )}
    </motion.div>
  )
}

"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { useCoyyns } from "@/lib/hooks/use-coyyns"
import { CoyynsBadge } from "@/components/shared/CoyynsBadge"
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton"

type CoyynsWidgetProps = {
  className?: string
}

export function CoyynsWidget({ className }: CoyynsWidgetProps) {
  const router = useRouter()
  const { wallet, transactions, isLoading } = useCoyyns()
  const recentTransactions = transactions.slice(0, 3)

  return (
    <Link href="/us" className="block">
      <motion.div
        className={cn(
          "texture-parchment rounded-2xl p-4 overflow-hidden",
          className
        )}
        style={{
          backgroundColor: "white",
          border: "1px solid rgba(184,115,51,0.06)",
          boxShadow: "var(--shadow-warm-sm, 0 1px 3px rgba(44,40,37,0.06))",
        }}
        whileTap={{ scale: 0.99 }}
        transition={{ duration: 0.1 }}
      >
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div>
            <span
              className="font-display text-[15px] font-bold"
              style={{ color: "var(--text-primary, #2C2825)" }}
            >
              🪙 CoYYns
            </span>
            <span
              className="ms-2 font-mono text-[18px] font-bold tabular-nums"
              style={{ color: "var(--accent-copper, #B87333)" }}
            >
              {(wallet?.balance ?? 0).toLocaleString()}
            </span>
          </div>
          <span
            className="text-[10px] font-bold uppercase tracking-widest rounded-full px-2 py-0.5"
            style={{
              backgroundColor: "rgba(184,115,51,0.08)",
              color: "var(--accent-copper, #B87333)",
            }}
          >
            Shared Wallet
          </span>
        </div>

        {/* Divider */}
        <div className="my-3" style={{ borderTop: "1px solid rgba(184,115,51,0.08)" }} />

        {/* Transaction list / loading / empty */}
        {isLoading ? (
          <LoadingSkeleton variant="list-item" count={3} />
        ) : recentTransactions.length === 0 ? (
          <p className="font-body text-[13px] text-[var(--color-text-muted)] text-center py-3">
            Start earning CoYYns together
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {recentTransactions.map((tx) => {
              const isEarn = tx.type === "earn"
              const prefix = isEarn ? "+" : "-"
              const amountDisplay = Math.abs(tx.amount).toLocaleString()

              return (
                <div key={tx.id} className="flex items-center justify-between">
                  <span className="font-body text-[13px] text-[var(--color-text-primary)] truncate max-w-[160px]">
                    {prefix} {tx.description ?? "Transaction"}
                  </span>
                  <span
                    className={cn(
                      "font-mono text-[12px] shrink-0 ms-2",
                      isEarn
                        ? "text-accent-primary"
                        : "text-[var(--color-text-secondary)]"
                    )}
                  >
                    {prefix}{amountDisplay}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end mt-3">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              router.push("/us/marketplace")
            }}
            className="font-body text-[13px] font-medium"
            style={{ color: "var(--accent-copper, #B87333)" }}
          >
            Marketplace &rarr;
          </button>
        </div>
      </motion.div>
    </Link>
  )
}

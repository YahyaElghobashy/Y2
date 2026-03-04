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
          "bg-[var(--color-bg-elevated)] rounded-2xl shadow-soft p-4",
          className
        )}
        whileTap={{ scale: 0.99 }}
        transition={{ duration: 0.1 }}
      >
        {/* Header row */}
        <div className="flex items-center justify-between">
          <span className="font-[family-name:var(--font-body)] text-[13px] font-medium text-[var(--color-text-secondary)]">
            CoYYns
          </span>
          <CoyynsBadge balance={wallet?.balance} size="md" />
        </div>

        {/* Divider */}
        <div className="border-t border-[var(--color-border-subtle)] my-3" />

        {/* Transaction list / loading / empty */}
        {isLoading ? (
          <LoadingSkeleton variant="list-item" count={3} />
        ) : recentTransactions.length === 0 ? (
          <p className="font-[family-name:var(--font-body)] text-[13px] text-[var(--color-text-muted)] text-center py-3">
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
                  <span className="font-[family-name:var(--font-body)] text-[13px] text-[var(--color-text-primary)] truncate max-w-[160px]">
                    {prefix} {tx.description ?? "Transaction"}
                  </span>
                  <span
                    className={cn(
                      "font-[family-name:var(--font-mono)] text-[12px] shrink-0 ms-2",
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
            className="font-[family-name:var(--font-body)] text-[13px] font-medium text-accent-primary"
          >
            Marketplace &rarr;
          </button>
        </div>
      </motion.div>
    </Link>
  )
}

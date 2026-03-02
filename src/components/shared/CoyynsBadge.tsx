"use client"

import { motion } from "framer-motion"
import { Coins } from "lucide-react"
import { cn } from "@/lib/utils"
import { useCoyyns } from "@/lib/hooks/use-coyyns"

type CoyynsBadgeProps = {
  balance?: number
  size?: "sm" | "md"
  className?: string
}

const EASE_OUT: [number, number, number, number] = [0.25, 0.1, 0.25, 1]

function CoyynsBadgeDisplay({
  balance,
  isLoading,
  size = "md",
  className,
}: {
  balance: number | null | undefined
  isLoading: boolean
  size: "sm" | "md"
  className?: string
}) {
  const isSm = size === "sm"

  return (
    <motion.div
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-accent-soft",
        isSm ? "px-2 py-0.5" : "px-3 py-1",
        className,
      )}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.15, ease: EASE_OUT }}
    >
      <Coins
        className="text-accent-primary shrink-0"
        size={isSm ? 12 : 14}
        strokeWidth={1.75}
      />
      {isLoading ? (
        <div
          data-testid="loading-pulse"
          className={cn(
            "rounded bg-accent-primary/20 animate-pulse",
            isSm ? "w-8 h-2.5" : "w-10 h-3",
          )}
        />
      ) : (
        <span
          className={cn(
            "font-mono font-medium text-text-primary leading-none",
            isSm ? "text-[11px]" : "text-[13px]",
          )}
        >
          {balance != null ? balance.toLocaleString() : "\u2014"}
        </span>
      )}
    </motion.div>
  )
}

function CoyynsBadgeWithHook({
  size = "md",
  className,
}: {
  size: "sm" | "md"
  className?: string
}) {
  const { wallet, isLoading } = useCoyyns()

  return (
    <CoyynsBadgeDisplay
      balance={isLoading ? undefined : wallet?.balance ?? null}
      isLoading={isLoading}
      size={size}
      className={className}
    />
  )
}

export function CoyynsBadge({ balance, size = "md", className }: CoyynsBadgeProps) {
  if (balance !== undefined) {
    return (
      <CoyynsBadgeDisplay
        balance={balance}
        isLoading={false}
        size={size}
        className={className}
      />
    )
  }

  return <CoyynsBadgeWithHook size={size} className={className} />
}

"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

type MarketplaceItemCardProps = {
  icon: string
  title: string
  description: string
  price: number | null
  available?: boolean
  affordable?: boolean
  onPurchase?: () => void
  className?: string
}

const EASE_OUT: [number, number, number, number] = [0.25, 0.1, 0.25, 1]

export function MarketplaceItemCard({
  icon,
  title,
  description,
  price,
  available = true,
  affordable = true,
  onPurchase,
  className,
}: MarketplaceItemCardProps) {
  const isComingSoon = !available
  const isDisabled = isComingSoon || !affordable

  return (
    <motion.div
      className={cn(
        "rounded-2xl bg-bg-elevated p-5 border border-border-subtle shadow-[0_2px_12px_rgba(44,40,37,0.06)]",
        !affordable && available && "opacity-70",
        isComingSoon && "opacity-60",
        className
      )}
      whileHover={
        !isDisabled
          ? { scale: 1.02, boxShadow: "0 4px 24px rgba(44,40,37,0.10)" }
          : undefined
      }
      whileTap={!isDisabled ? { scale: 0.98 } : undefined}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      onClick={!isDisabled ? onPurchase : undefined}
      role={!isDisabled ? "button" : undefined}
      tabIndex={!isDisabled ? 0 : undefined}
      data-testid="marketplace-item-card"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-soft">
            <span className="text-[20px]" role="img" aria-hidden="true">
              {icon}
            </span>
          </div>
          <div className="min-w-0">
            <h3 className="font-body text-[15px] font-semibold text-text-primary line-clamp-1">
              {title}
            </h3>
            <p className="font-body text-[13px] text-text-secondary line-clamp-2">
              {description}
            </p>
          </div>
        </div>

        <span
          className="shrink-0 rounded-full bg-accent-soft px-3 py-1 font-mono text-[14px] font-medium text-accent-primary"
          data-testid="price-pill"
        >
          {price !== null ? (
            <>
              {price} <span aria-hidden="true">&#x1FA99;</span>
            </>
          ) : (
            "???"
          )}
        </span>
      </div>
    </motion.div>
  )
}

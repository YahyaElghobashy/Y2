"use client"

import Image from "next/image"
import { cn } from "@/lib/utils"

/**
 * Coin — the CoYYns token (docs/DESIGN_BLUEPRINT.md §1.5). Pairs the gold
 * coin-yy asset with a Data-register figure. Use anywhere a CoYYns amount
 * shows. For the earn-celebration, swap to /assets/video/anim-coin-spin.
 */
type CoinProps = {
  amount?: number
  size?: number
  label?: string
  className?: string
}

export function Coin({ amount, size = 26, label, className }: CoinProps) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <Image
        src="/assets/coins/coin-yy.webp"
        alt=""
        aria-hidden
        width={size}
        height={size}
        style={{ width: size, height: size }}
        className="inline-block shrink-0"
      />
      {amount !== undefined && (
        <span
          className="font-bold tabular-nums leading-none"
          style={{ fontFamily: "var(--font-body)", color: "var(--foreground)" }}
        >
          {amount.toLocaleString()}
        </span>
      )}
      {label && (
        <span
          className="text-sm font-medium leading-none"
          style={{ color: "var(--color-ink-soft)" }}
        >
          {label}
        </span>
      )}
    </span>
  )
}

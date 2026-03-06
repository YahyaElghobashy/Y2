"use client"

import { cn } from "@/lib/utils"

type WarmSkeletonVariant = "card" | "pill" | "circle" | "text-line" | "text-block"

interface WarmSkeletonProps {
  variant?: WarmSkeletonVariant
  className?: string
  width?: string | number
  height?: string | number
}

const variantStyles: Record<WarmSkeletonVariant, string> = {
  card: "w-full h-32 rounded-xl",
  pill: "w-20 h-6 rounded-full",
  circle: "w-12 h-12 rounded-full",
  "text-line": "w-full h-4 rounded",
  "text-block": "w-full h-16 rounded-lg",
}

export function WarmSkeleton({
  variant = "text-line",
  className,
  width,
  height,
}: WarmSkeletonProps) {
  return (
    <div
      className={cn(
        "animate-skeleton-warm",
        variantStyles[variant],
        className
      )}
      style={{ width, height }}
      aria-hidden="true"
    />
  )
}

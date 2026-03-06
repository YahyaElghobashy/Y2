"use client"

import { forwardRef } from "react"
import { motion, type HTMLMotionProps } from "framer-motion"
import { cn } from "@/lib/utils"

type WarmCardVariant = "default" | "hero" | "subtle" | "interactive" | "glow" | "featured"

interface WarmCardProps extends Omit<HTMLMotionProps<"div">, "ref"> {
  variant?: WarmCardVariant
  glow?: boolean
}

const variantStyles: Record<WarmCardVariant, string> = {
  default: "bg-[var(--bg-warm-white)] shadow-[var(--shadow-warm-sm)] rounded-xl border border-[var(--border-subtle)]",
  hero: "bg-[var(--bg-soft-cream)] shadow-[var(--shadow-warm-md)] rounded-2xl border border-[var(--border-subtle)]",
  subtle: "bg-transparent rounded-xl",
  interactive: "bg-[var(--bg-warm-white)] shadow-[var(--shadow-warm-sm)] rounded-xl border border-[var(--border-subtle)] cursor-pointer",
  glow: "bg-[var(--bg-warm-white)] shadow-[var(--shadow-warm-sm)] rounded-xl border border-[var(--border-subtle)]",
  featured: "bg-[var(--bg-warm-white)] shadow-[var(--shadow-warm-md)] rounded-2xl border border-[var(--border-subtle)]",
}

export const WarmCard = forwardRef<HTMLDivElement, WarmCardProps>(
  ({ variant = "default", glow = false, className, children, style, ...props }, ref) => {
    const isInteractive = variant === "interactive"
    const isFeatured = variant === "featured"

    return (
      <motion.div
        ref={ref}
        className={cn(
          "relative overflow-hidden",
          variantStyles[variant],
          glow && "animate-pulse-copper",
          className
        )}
        style={{
          ...style,
          ...(isFeatured
            ? {
                borderTop: "2px solid transparent",
                borderImage: "linear-gradient(90deg, var(--accent-copper, #B87333), var(--accent-gold, #DAA520)) 1",
              }
            : {}),
        }}
        {...(isInteractive
          ? {
              whileHover: { y: -2, boxShadow: "0 8px 24px rgba(44,40,37,0.10)" },
              whileTap: { y: 0, boxShadow: "0 1px 3px rgba(44,40,37,0.06)" },
              transition: { duration: 0.2 },
            }
          : {})}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)

WarmCard.displayName = "WarmCard"

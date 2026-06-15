"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

/**
 * PosterCard — the base surface of the redesign (docs/DESIGN_BLUEPRINT.md §1.5).
 * Cards are posters, not boxes: warm grain, soft shadow, one confident focal
 * point, generous space. Token-based so it flips correctly under `.skin-aware`
 * night skin. Never hardcode a card background — reach for this.
 */
type Accent = "none" | "terracotta" | "amber" | "coral" | "teal" | "indigo" | "rose"

const ACCENT_VAR: Record<Accent, string | null> = {
  none: null,
  terracotta: "var(--color-terracotta)",
  amber: "var(--color-amber)",
  coral: "var(--color-coral)",
  teal: "var(--color-teal)",
  indigo: "var(--color-indigo)",
  rose: "var(--color-dusty-rose)",
}

type PosterCardProps = {
  children: React.ReactNode
  className?: string
  /** A thin accent hairline along the top edge (world/section colour). */
  accent?: Accent
  /** Subtle risograph paper grain overlay. Default true. */
  grain?: boolean
  /** Adds a gentle scale-on-tap/hover for tappable cards. */
  interactive?: boolean
  onClick?: () => void
}

export function PosterCard({
  children,
  className,
  accent = "none",
  grain = true,
  interactive = false,
  onClick,
}: PosterCardProps) {
  const accentVar = ACCENT_VAR[accent]
  return (
    <motion.div
      onClick={onClick}
      whileTap={interactive ? { scale: 0.985 } : undefined}
      whileHover={interactive ? { scale: 1.01 } : undefined}
      transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
      className={cn(
        "relative overflow-hidden rounded-2xl border p-5",
        grain && "texture-parchment",
        interactive && "cursor-pointer",
        className,
      )}
      style={{
        background: "var(--card)",
        color: "var(--card-foreground)",
        borderColor: "var(--border)",
        boxShadow: "var(--shadow-warm-md)",
      }}
    >
      {accentVar && (
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 h-[3px]"
          style={{ background: accentVar }}
        />
      )}
      {children}
    </motion.div>
  )
}

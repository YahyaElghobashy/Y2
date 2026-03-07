"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { FadeIn } from "@/components/animations"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type EmptyStateProps = {
  icon: React.ReactNode
  title: string
  subtitle?: string
  actionLabel?: string
  actionHref?: string
  onAction?: () => void
  className?: string
}

export function EmptyState({
  icon,
  title,
  subtitle,
  actionLabel,
  actionHref,
  onAction,
  className,
}: EmptyStateProps) {
  const showButton = !!actionLabel && (!!actionHref || !!onAction)

  return (
    <FadeIn
      className={cn(
        "flex min-h-[300px] flex-col items-center justify-center",
        className
      )}
    >
      <div className="mb-4 w-16 h-16 rounded-full bg-[var(--accent-soft,#E8D5C0)]/50 flex items-center justify-center text-[var(--accent-copper,#B87333)]">
        {icon}
      </div>

      <h3 className="mb-1 text-center font-display text-[18px] font-semibold text-[var(--text-primary,#2C2825)]">
        {title}
      </h3>

      {subtitle && (
        <p className="mb-6 max-w-[240px] text-center font-serif italic text-[14px] text-[var(--text-secondary,#8C8279)]">
          {subtitle}
        </p>
      )}

      {showButton &&
        (actionHref ? (
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <Button variant="copper" asChild>
              <Link href={actionHref}>{actionLabel}</Link>
            </Button>
          </motion.div>
        ) : (
          <Button
            variant="copper"
            onClick={onAction}
          >
            {actionLabel}
          </Button>
        ))}
    </FadeIn>
  )
}

"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { FadeIn } from "@/components/animations"
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

const EASE_OUT: [number, number, number, number] = [0.25, 0.1, 0.25, 1]

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
      <div className="mb-4 text-[var(--text-muted)]">{icon}</div>

      <h3
        className="mb-1 text-center font-[family-name:var(--font-body)] text-[18px] font-semibold text-[var(--text-primary)]"
      >
        {title}
      </h3>

      {subtitle && (
        <p
          className="mb-6 max-w-[240px] text-center font-[family-name:var(--font-body)] text-[14px] text-[var(--text-secondary)]"
        >
          {subtitle}
        </p>
      )}

      {showButton &&
        (actionHref ? (
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.2, ease: EASE_OUT }}
          >
            <Link
              href={actionHref}
              className="inline-block rounded-lg bg-[var(--accent-primary)] px-6 py-2.5 text-[14px] font-medium text-white hover:shadow-[var(--shadow-soft)]"
            >
              {actionLabel}
            </Link>
          </motion.div>
        ) : (
          <motion.button
            onClick={onAction}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.2, ease: EASE_OUT }}
            className="rounded-lg bg-[var(--accent-primary)] px-6 py-2.5 text-[14px] font-medium text-white hover:shadow-[var(--shadow-soft)]"
          >
            {actionLabel}
          </motion.button>
        ))}
    </FadeIn>
  )
}

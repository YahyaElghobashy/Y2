"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

type QuickActionCardProps = {
  icon: React.ReactNode
  label: string
  description: string
  href: string
  className?: string
}

const EASE_OUT: [number, number, number, number] = [0.25, 0.1, 0.25, 1]

export function QuickActionCard({
  icon,
  label,
  description,
  href,
  className,
}: QuickActionCardProps) {
  return (
    <Link href={href} className={cn("block", className)}>
      <motion.div
        className="rounded-xl bg-[var(--color-bg-elevated)] p-5 shadow-[0_2px_12px_rgba(44,40,37,0.06)]"
        whileHover={{ scale: 1.02, boxShadow: "0 4px 24px rgba(44,40,37,0.10)" }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.15, ease: EASE_OUT }}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-accent-soft)]">
          <span className="flex h-5 w-5 items-center justify-center text-[var(--color-accent-primary)] [&>svg]:h-5 [&>svg]:w-5">
            {icon}
          </span>
        </div>

        <p className="mt-3 truncate font-body text-[15px] font-semibold text-[var(--color-text-primary)]">
          {label}
        </p>

        <p className="mt-0.5 truncate font-body text-[12px] text-[var(--color-text-secondary)]">
          {description}
        </p>
      </motion.div>
    </Link>
  )
}

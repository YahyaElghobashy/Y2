"use client"

import { type LucideIcon } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface StatusIndicatorCardProps {
  icon: LucideIcon
  label: string
  value: string
  accent: string
  onClick?: () => void
  className?: string
}

export function StatusIndicatorCard({
  icon: Icon,
  label,
  value,
  accent,
  onClick,
  className,
}: StatusIndicatorCardProps) {
  const Wrapper = onClick ? motion.button : motion.div

  return (
    <Wrapper
      onClick={onClick}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      className={cn(
        "w-full rounded-2xl bg-[var(--bg-elevated,#FFFFFF)] p-4",
        "flex items-center gap-3",
        "shadow-[var(--shadow-soft)]",
        "border border-[var(--border-subtle)]",
        onClick && "cursor-pointer active:bg-[var(--bg-secondary)]",
        className
      )}
      style={{
        borderLeftWidth: "4px",
        borderLeftColor: accent,
      }}
    >
      {/* Icon circle */}
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: `${accent}1A` }}
      >
        <Icon size={20} style={{ color: accent }} />
      </div>

      {/* Text content */}
      <div className="flex flex-col items-start gap-0.5">
        <span className="font-nav text-[11px] font-medium uppercase tracking-widest text-[var(--text-secondary,#8C8279)]">
          {label}
        </span>
        <span className="font-display text-[18px] font-semibold text-[var(--text-primary,#2C2825)]">
          {value}
        </span>
      </div>
    </Wrapper>
  )
}

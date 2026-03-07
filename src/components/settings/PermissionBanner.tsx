"use client"

import { cn } from "@/lib/utils"

type PermissionBannerProps = {
  variant: "info" | "warning" | "success"
  icon: React.ReactNode
  title: string
  description: string
  className?: string
}

const variantStyles = {
  info: {
    bg: "bg-[var(--color-accent-soft)]",
    border: "border-[var(--color-accent-primary)]/20",
    title: "text-[var(--color-accent-primary)]",
    description: "text-[var(--color-text-secondary)]",
    icon: "text-[var(--color-accent-primary)]",
  },
  warning: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    title: "text-amber-800",
    description: "text-amber-700",
    icon: "text-amber-600",
  },
  success: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    title: "text-emerald-800",
    description: "text-emerald-700",
    icon: "text-emerald-600",
  },
}

export function PermissionBanner({
  variant,
  icon,
  title,
  description,
  className,
}: PermissionBannerProps) {
  const styles = variantStyles[variant]

  return (
    <div
      className={cn(
        "flex gap-3 rounded-xl border p-4",
        styles.bg,
        styles.border,
        className
      )}
    >
      <span className={cn("shrink-0 mt-0.5", styles.icon)}>{icon}</span>
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "font-body text-[14px] font-semibold",
            styles.title
          )}
        >
          {title}
        </p>
        <p
          className={cn(
            "font-body text-[13px] mt-0.5",
            styles.description
          )}
        >
          {description}
        </p>
      </div>
    </div>
  )
}

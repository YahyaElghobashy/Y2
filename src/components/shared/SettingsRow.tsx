"use client"

import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

type SettingsRowProps = {
  icon: React.ReactNode
  label: string
  subtitle?: string
  href?: string
  onClick?: () => void
  rightElement?: React.ReactNode
  destructive?: boolean
  showChevron?: boolean
}

export function SettingsRow({
  icon,
  label,
  subtitle,
  href,
  onClick,
  rightElement,
  destructive = false,
  showChevron,
}: SettingsRowProps) {
  const hasAction = Boolean(href || onClick)
  const shouldShowChevron = showChevron ?? (hasAction && !rightElement)

  const content = (
    <>
      <span className={cn("shrink-0", destructive ? "text-red-500" : "text-text-secondary")}>
        {icon}
      </span>
      <div className="flex-1 min-w-0 ms-3">
        <span
          className={cn(
            "text-[15px] font-body",
            destructive ? "text-red-500" : "text-text-primary"
          )}
        >
          {label}
        </span>
        {subtitle && (
          <p className="text-xs text-text-secondary mt-0.5">{subtitle}</p>
        )}
      </div>
      {rightElement && (
        <span className="text-[13px] text-text-muted shrink-0">{rightElement}</span>
      )}
      {shouldShowChevron && (
        <ChevronRight
          size={16}
          strokeWidth={1.75}
          className="text-text-muted shrink-0 ms-2"
        />
      )}
    </>
  )

  const sharedClassName = cn(
    "flex items-center w-full px-6 py-3.5 min-h-[56px]",
    "border-b border-border-subtle last:border-b-0",
    hasAction && "active:bg-bg-secondary transition-colors"
  )

  if (href) {
    return (
      <Link href={href} className={sharedClassName}>
        {content}
      </Link>
    )
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cn(sharedClassName, "text-start")}>
        {content}
      </button>
    )
  }

  return (
    <div className={sharedClassName}>
      {content}
    </div>
  )
}

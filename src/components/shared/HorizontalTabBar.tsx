"use client"

import { useRef, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

type Tab = {
  label: string
  href: string
}

type HorizontalTabBarProps = {
  tabs: Tab[]
  layoutId?: string
  className?: string
}

const EASE_OUT: [number, number, number, number] = [0.25, 0.1, 0.25, 1]

export function HorizontalTabBar({
  tabs,
  layoutId = "horizontal-tab-indicator",
  className,
}: HorizontalTabBarProps) {
  const pathname = usePathname()
  const scrollRef = useRef<HTMLDivElement>(null)
  const activeRef = useRef<HTMLAnchorElement>(null)

  // Scroll active tab into view on mount
  useEffect(() => {
    if (activeRef.current && scrollRef.current) {
      const container = scrollRef.current
      const active = activeRef.current
      const containerRect = container.getBoundingClientRect()
      const activeRect = active.getBoundingClientRect()

      if (
        activeRect.left < containerRect.left ||
        activeRect.right > containerRect.right
      ) {
        active.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        })
      }
    }
  }, [pathname])

  return (
    <div
      ref={scrollRef}
      className={cn(
        "sticky top-0 z-10 flex gap-1 overflow-x-auto bg-[var(--color-bg-primary)] px-5 pb-2 scrollbar-hide",
        className
      )}
      role="tablist"
      data-testid="horizontal-tab-bar"
      style={{
        scrollbarWidth: "none",
        msOverflowStyle: "none",
      }}
    >
      {tabs.map((tab) => {
        const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/")

        return (
          <Link
            key={tab.href}
            href={tab.href}
            ref={isActive ? activeRef : undefined}
            role="tab"
            aria-selected={isActive}
            className={cn(
              "relative shrink-0 px-4 py-2 text-[13px] font-medium font-[family-name:var(--font-body)] transition-colors",
              isActive
                ? "text-[var(--color-accent-primary)]"
                : "text-[var(--color-text-secondary)]"
            )}
            data-testid={`tab-${tab.label.toLowerCase()}`}
          >
            {tab.label}
            {isActive && (
              <motion.div
                layoutId={layoutId}
                className="absolute bottom-0 inset-x-2 h-0.5 rounded-full bg-[var(--color-accent-primary)]"
                transition={{ duration: 0.25, ease: EASE_OUT }}
              />
            )}
          </Link>
        )
      })}
    </div>
  )
}

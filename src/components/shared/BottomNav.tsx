"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { House, Heart, Sparkles, User, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"

import type { LucideIcon } from "lucide-react"

type NavTab = {
  label: string
  href: string
  icon: LucideIcon
  match: (pathname: string) => boolean
  isCenter?: boolean
}

const EASE_OUT: [number, number, number, number] = [0.25, 0.1, 0.25, 1]

const NAV_TABS: NavTab[] = [
  {
    label: "Home",
    href: "/",
    icon: House,
    match: (pathname) => pathname === "/",
  },
  {
    label: "Us",
    href: "/us",
    icon: Heart,
    match: (pathname) => pathname.startsWith("/us"),
  },
  {
    label: "2026",
    href: "/2026",
    icon: Sparkles,
    match: (pathname) => pathname.startsWith("/2026"),
    isCenter: true,
  },
  {
    label: "Me",
    href: "/me",
    icon: User,
    match: (pathname) => pathname.startsWith("/me"),
  },
  {
    label: "More",
    href: "/more",
    icon: MoreHorizontal,
    match: (pathname) => pathname.startsWith("/more"),
  },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 bg-bg-elevated border-t border-border-subtle"
      style={{
        boxShadow: "0 -2px 12px rgba(44, 40, 37, 0.04)",
      }}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around h-16">
        {NAV_TABS.map((tab) => {
          const isActive = tab.match(pathname)
          const Icon = tab.icon

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex-1"
              aria-current={isActive ? "page" : undefined}
            >
              <motion.div
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.1 }}
                className={cn(
                  "flex flex-col items-center gap-1",
                  tab.isCenter && "-translate-y-1.5"
                )}
              >
                <div className="relative flex flex-col items-center">
                  <Icon
                    size={tab.isCenter ? 28 : 20}
                    strokeWidth={1.75}
                    className={cn(
                      "transition-colors duration-200",
                      tab.isCenter
                        ? "text-accent-primary"
                        : isActive
                          ? "text-accent-primary"
                          : "text-text-secondary"
                    )}
                  />
                  {isActive && (
                    <motion.div
                      layoutId="bottomnav-indicator"
                      className="absolute -bottom-1.5 h-0.5 w-6 rounded-full bg-accent-primary"
                      transition={{
                        duration: 0.25,
                        ease: EASE_OUT,
                      }}
                    />
                  )}
                </div>
                <span
                  className={cn(
                    "text-[11px] font-medium leading-none font-body",
                    tab.isCenter
                      ? "text-accent-primary tabular-nums"
                      : isActive
                        ? "text-accent-primary"
                        : "text-text-secondary"
                  )}
                >
                  {tab.label}
                </span>
              </motion.div>
            </Link>
          )
        })}
      </div>
      <div
        className="w-full"
        style={{
          paddingBottom: "max(env(safe-area-inset-bottom), 8px)",
        }}
      />
    </nav>
  )
}

"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  House,
  Heart,
  User,
  MoreHorizontal,
  Sparkles,
  Camera,
  UtensilsCrossed,
  Disc3,
} from "lucide-react"
import { cn } from "@/lib/utils"

import type { LucideIcon } from "lucide-react"

type NavTab = {
  label: string
  href: string
  icon: LucideIcon
  match: (pathname: string) => boolean
}

const EASE_OUT: [number, number, number, number] = [0.25, 0.1, 0.25, 1]

const SIDE_TABS: NavTab[] = [
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
]

const RIGHT_TABS: NavTab[] = [
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

export const NAV_TABS: (NavTab & { isCenter?: boolean })[] = [
  ...SIDE_TABS,
  {
    label: "2026",
    href: "/2026",
    icon: Sparkles,
    match: (pathname) => pathname.startsWith("/2026"),
    isCenter: true,
  },
  ...RIGHT_TABS,
]

type QuickAction = {
  label: string
  href: string
  icon: LucideIcon
}

const QUICK_ACTIONS: QuickAction[] = [
  { label: "2026", href: "/2026", icon: Sparkles },
  { label: "Snap", href: "/snap", icon: Camera },
  { label: "Our Table", href: "/our-table", icon: UtensilsCrossed },
  { label: "Wheel", href: "/wheel", icon: Disc3 },
]

export function BottomNav() {
  const pathname = usePathname()
  const [expanded, setExpanded] = useState(false)
  const navRef = useRef<HTMLElement>(null)

  // Hide during onboarding flow
  if (pathname.startsWith("/onboarding")) return null

  const toggleExpand = useCallback(() => {
    setExpanded((prev) => !prev)
  }, [])

  // Close on route change
  useEffect(() => {
    setExpanded(false)
  }, [pathname])

  // Close on outside click
  useEffect(() => {
    if (!expanded) return
    const handleClick = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setExpanded(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [expanded])

  const isCenter = pathname.startsWith("/2026") ||
    pathname.startsWith("/snap") ||
    pathname.startsWith("/our-table") ||
    pathname.startsWith("/wheel")

  return (
    <>
      {/* Backdrop overlay */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setExpanded(false)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <nav
        ref={navRef}
        className="fixed bottom-0 inset-x-0 z-50 bg-bg-elevated border-t border-border-subtle"
        style={{
          boxShadow: "0 -2px 12px rgba(44, 40, 37, 0.04)",
        }}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Quick action bubbles — expand above mascot */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 flex items-end gap-3"
              initial={{ opacity: 0, y: 16, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.8 }}
              transition={{ duration: 0.25, ease: EASE_OUT }}
            >
              {QUICK_ACTIONS.map((action, i) => {
                const Icon = action.icon
                const isActionActive = pathname.startsWith(action.href)
                return (
                  <motion.div
                    key={action.href}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.2 }}
                  >
                    <Link
                      href={action.href}
                      className={cn(
                        "flex flex-col items-center gap-1.5 rounded-2xl px-4 py-3 shadow-lg border transition-colors",
                        isActionActive
                          ? "bg-[var(--color-accent-primary)] border-[var(--color-accent-primary)] text-white"
                          : "bg-[var(--color-bg-elevated)] border-[var(--color-border-subtle)] text-[var(--color-text-primary)]"
                      )}
                      data-testid={`quick-action-${action.label.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      <Icon size={22} strokeWidth={1.75} />
                      <span className="text-[11px] font-medium font-[family-name:var(--font-body)] whitespace-nowrap">
                        {action.label}
                      </span>
                    </Link>
                  </motion.div>
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-around h-16">
          {/* Left tabs */}
          {SIDE_TABS.map((tab) => (
            <NavItem key={tab.href} tab={tab} pathname={pathname} />
          ))}

          {/* Center mascot button */}
          <div className="flex-1 flex justify-center">
            <motion.button
              type="button"
              onClick={toggleExpand}
              className="relative -translate-y-3 flex items-center justify-center"
              whileTap={{ scale: 0.9 }}
              transition={{ duration: 0.1 }}
              aria-label={expanded ? "Close quick menu" : "Open quick menu"}
              aria-expanded={expanded}
              data-testid="nav-mascot-btn"
            >
              <motion.div
                className={cn(
                  "relative w-[52px] h-[52px] rounded-full overflow-hidden border-2 shadow-md transition-colors",
                  expanded
                    ? "border-[var(--color-accent-primary)] shadow-[0_0_16px_rgba(196,149,106,0.3)]"
                    : isCenter
                      ? "border-[var(--color-accent-primary)]"
                      : "border-[var(--color-border-subtle)]"
                )}
                animate={expanded ? { rotate: [0, -8, 8, -4, 0] } : { rotate: 0 }}
                transition={expanded ? { duration: 0.4, ease: "easeInOut" } : { duration: 0.2 }}
              >
                <Image
                  src="/mascot.png"
                  alt="Hayah"
                  width={52}
                  height={52}
                  className="w-full h-full object-cover"
                  priority
                />
              </motion.div>
            </motion.button>
          </div>

          {/* Right tabs */}
          {RIGHT_TABS.map((tab) => (
            <NavItem key={tab.href} tab={tab} pathname={pathname} />
          ))}
        </div>
        <div
          className="w-full"
          style={{
            paddingBottom: "max(env(safe-area-inset-bottom), 8px)",
          }}
        />
      </nav>
    </>
  )
}

function NavItem({ tab, pathname }: { tab: NavTab; pathname: string }) {
  const isActive = tab.match(pathname)
  const Icon = tab.icon

  return (
    <Link
      href={tab.href}
      className="flex-1"
      aria-current={isActive ? "page" : undefined}
      data-testid={`nav-tab-${tab.label.toLowerCase()}`}
    >
      <motion.div
        whileTap={{ scale: 0.95 }}
        transition={{ duration: 0.1 }}
        className="flex flex-col items-center gap-1"
      >
        <div className="relative flex flex-col items-center">
          <Icon
            size={20}
            strokeWidth={1.75}
            className={cn(
              "transition-colors duration-200",
              isActive ? "text-accent-primary" : "text-text-secondary"
            )}
          />
          {isActive && (
            <motion.div
              layoutId="bottomnav-indicator"
              className="absolute -bottom-1.5 h-0.5 w-6 rounded-full bg-accent-primary"
              transition={{ duration: 0.25, ease: EASE_OUT }}
            />
          )}
        </div>
        <span
          className={cn(
            "text-[11px] font-medium leading-none font-body",
            isActive ? "text-accent-primary" : "text-text-secondary"
          )}
        >
          {tab.label}
        </span>
      </motion.div>
    </Link>
  )
}

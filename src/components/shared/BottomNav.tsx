"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  House,
  Heart,
  Coins,
  BookHeart,
  Plus,
  Camera,
  Ticket,
  PenLine,
  ListPlus,
  Smile,
  Send,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * BottomNav — the 5-world model (docs/DESIGN_BLUEPRINT.md §1.6):
 *   [ Home ] [ Us ]  ( + create )  [ Treasury ] [ Keepsake ]
 * Me + Settings live on the Home top-bar. Active = world accent.
 */
type World = {
  label: string
  href: string
  icon: LucideIcon
  accent: string
  match: (p: string) => boolean
}

const EASE_OUT: [number, number, number, number] = [0.25, 0.1, 0.25, 1]

export const NAV_WORLDS: World[] = [
  { label: "Home", href: "/", icon: House, accent: "var(--color-amber)", match: (p) => p === "/" },
  { label: "Us", href: "/us", icon: Heart, accent: "var(--color-coral)", match: (p) => p.startsWith("/us") || p.startsWith("/game") || p.startsWith("/our-table") || p.startsWith("/wheel") || p.startsWith("/decide") },
  { label: "Treasury", href: "/treasury", icon: Coins, accent: "var(--color-terracotta)", match: (p) => p.startsWith("/treasury") },
  { label: "Keepsake", href: "/keepsake", icon: BookHeart, accent: "var(--color-teal)", match: (p) => p.startsWith("/keepsake") || p.startsWith("/snap") || p.startsWith("/garden") || p.startsWith("/2026") },
]

const LEFT = NAV_WORLDS.slice(0, 2)
const RIGHT = NAV_WORLDS.slice(2)

type CreateAction = { label: string; href: string; icon: LucideIcon; accent: string }
const CREATE_ACTIONS: CreateAction[] = [
  { label: "Snap", href: "/snap/capture", icon: Camera, accent: "var(--color-amber)" },
  { label: "Coupon", href: "/create-coupon", icon: Ticket, accent: "var(--color-coral)" },
  { label: "Letter", href: "/me/rituals", icon: PenLine, accent: "var(--color-teal)" },
  { label: "List", href: "/us/list", icon: ListPlus, accent: "var(--color-indigo)" },
  { label: "Mood", href: "/", icon: Smile, accent: "var(--color-dusty-rose)" },
  { label: "Ping", href: "/us/ping", icon: Send, accent: "var(--color-terracotta)" },
]

export function BottomNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const navRef = useRef<HTMLElement>(null)

  const toggle = useCallback(() => setOpen((p) => !p), [])

  useEffect(() => setOpen(false), [pathname])
  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [open])

  if (pathname.startsWith("/onboarding")) return null

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setOpen(false)}
            aria-hidden
          />
        )}
      </AnimatePresence>

      <nav
        ref={navRef}
        className="fixed inset-x-0 bottom-0 z-50 border-t"
        style={{ background: "var(--card)", borderColor: "var(--border)", boxShadow: "0 -2px 14px rgba(42,40,37,0.05)" }}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Create sheet */}
        <AnimatePresence>
          {open && (
            <motion.div
              className="absolute bottom-full left-1/2 mb-4 grid -translate-x-1/2 grid-cols-3 gap-3 rounded-3xl border p-3"
              style={{ background: "var(--card)", borderColor: "var(--border)", boxShadow: "var(--shadow-warm-xl)" }}
              initial={{ opacity: 0, y: 16, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.94 }}
              transition={{ duration: 0.22, ease: EASE_OUT }}
            >
              {CREATE_ACTIONS.map((a) => {
                const Icon = a.icon
                return (
                  <Link
                    key={a.href}
                    href={a.href}
                    className="flex w-[78px] flex-col items-center gap-1.5 rounded-2xl px-2 py-3"
                    style={{ background: "var(--color-sand)" }}
                    data-testid={`create-${a.label.toLowerCase()}`}
                  >
                    <span className="grid h-10 w-10 place-items-center rounded-full" style={{ background: a.accent, color: "#FFF7EF" }}>
                      <Icon size={20} strokeWidth={2} />
                    </span>
                    <span className="text-[11px] font-semibold" style={{ fontFamily: "var(--font-nav)", color: "var(--foreground)" }}>
                      {a.label}
                    </span>
                  </Link>
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex h-16 items-center justify-around">
          {LEFT.map((w) => <NavItem key={w.href} world={w} pathname={pathname} />)}

          <div className="flex flex-1 justify-center">
            <motion.button
              type="button"
              onClick={toggle}
              className="relative -translate-y-3 grid h-[54px] w-[54px] place-items-center rounded-full"
              style={{ background: "var(--color-terracotta)", color: "#FFF7EF", boxShadow: "var(--shadow-glow-copper)" }}
              whileTap={{ scale: 0.9 }}
              animate={{ rotate: open ? 45 : 0 }}
              transition={{ duration: 0.2, ease: EASE_OUT }}
              aria-label={open ? "Close create menu" : "Create"}
              aria-expanded={open}
              data-testid="nav-create-btn"
            >
              <Plus size={26} strokeWidth={2.5} />
            </motion.button>
          </div>

          {RIGHT.map((w) => <NavItem key={w.href} world={w} pathname={pathname} />)}
        </div>
        <div className="w-full" style={{ paddingBottom: "max(env(safe-area-inset-bottom), 8px)" }} />
      </nav>
    </>
  )
}

function NavItem({ world, pathname }: { world: World; pathname: string }) {
  const active = world.match(pathname)
  const Icon = world.icon
  return (
    <Link href={world.href} className="flex-1" aria-current={active ? "page" : undefined} data-testid={`nav-${world.label.toLowerCase()}`}>
      <motion.div whileTap={{ scale: 0.95 }} transition={{ duration: 0.1 }} className="flex flex-col items-center gap-1">
        <div className="relative flex flex-col items-center">
          <Icon
            size={21}
            strokeWidth={1.85}
            style={{ color: active ? world.accent : "var(--color-ink-soft)" }}
            className="transition-colors duration-200"
          />
          {active && (
            <motion.span
              layoutId="nav-indicator"
              className="absolute -bottom-1.5 h-1 w-1 rounded-full"
              style={{ background: world.accent }}
              transition={{ duration: 0.25, ease: EASE_OUT }}
            />
          )}
        </div>
        <span
          className="text-[10.5px] leading-none"
          style={{
            fontFamily: "var(--font-nav)",
            fontWeight: active ? 700 : 500,
            color: active ? world.accent : "var(--color-ink-soft)",
          }}
        >
          {world.label}
        </span>
      </motion.div>
    </Link>
  )
}

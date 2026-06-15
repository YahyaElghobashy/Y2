"use client"

import { Plus } from "lucide-react"
import { NAV_WORLDS } from "@/components/shared/BottomNav"
import { cn } from "@/lib/utils"

type BottomNavPreviewProps = {
  highlightLabel?: string
}

/** Static, non-interactive mirror of BottomNav for onboarding tours. */
export function BottomNavPreview({ highlightLabel }: BottomNavPreviewProps) {
  const left = NAV_WORLDS.slice(0, 2)
  const right = NAV_WORLDS.slice(2)

  const Item = ({ world }: { world: (typeof NAV_WORLDS)[number] }) => {
    const Icon = world.icon
    const highlighted = world.label === highlightLabel
    return (
      <div className="flex-1" data-testid={`nav-${world.label.toLowerCase()}`}>
        <div className="flex flex-col items-center gap-1">
          <Icon
            size={21}
            strokeWidth={1.85}
            style={{ color: highlighted ? world.accent : "var(--color-ink-soft)" }}
          />
          <span
            className="text-[10.5px] leading-none"
            style={{
              fontFamily: "var(--font-nav)",
              fontWeight: highlighted ? 700 : 500,
              color: highlighted ? world.accent : "var(--color-ink-soft)",
            }}
          >
            {world.label}
          </span>
        </div>
      </div>
    )
  }

  return (
    <nav
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 border-t"
      style={{ background: "var(--card)", borderColor: "var(--border)", boxShadow: "0 -2px 14px rgba(42,40,37,0.05)" }}
      aria-hidden="true"
      data-testid="bottom-nav-preview"
    >
      <div className="flex h-16 items-center justify-around">
        {left.map((w) => <Item key={w.href} world={w} />)}
        <div className="flex flex-1 justify-center">
          <span
            className={cn("-translate-y-3 grid h-[54px] w-[54px] place-items-center rounded-full")}
            style={{ background: "var(--color-terracotta)", color: "#FFF7EF", boxShadow: "var(--shadow-glow-copper)" }}
          >
            <Plus size={26} strokeWidth={2.5} />
          </span>
        </div>
        {right.map((w) => <Item key={w.href} world={w} />)}
      </div>
      <div className="w-full" style={{ paddingBottom: "max(env(safe-area-inset-bottom), 8px)" }} />
    </nav>
  )
}

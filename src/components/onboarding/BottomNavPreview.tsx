"use client"

import { NAV_TABS } from "@/components/shared/BottomNav"
import { cn } from "@/lib/utils"

type BottomNavPreviewProps = {
  highlightLabel?: string
}

export function BottomNavPreview({ highlightLabel }: BottomNavPreviewProps) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 pointer-events-none border-t border-border-subtle bg-bg-elevated"
      style={{ boxShadow: "0 -2px 12px rgba(44, 40, 37, 0.04)" }}
      aria-hidden="true"
      data-testid="bottom-nav-preview"
    >
      <div className="flex h-16 items-center justify-around">
        {NAV_TABS.map((tab) => {
          const isHighlighted = tab.label === highlightLabel
          const Icon = tab.icon

          return (
            <div
              key={tab.href}
              className="flex-1"
              data-testid={`nav-tab-${tab.label.toLowerCase()}`}
            >
              <div
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
                      tab.isCenter || isHighlighted
                        ? "text-accent-primary"
                        : "text-text-secondary"
                    )}
                  />
                  {isHighlighted && (
                    <div className="absolute -bottom-1.5 h-0.5 w-6 rounded-full bg-accent-primary" />
                  )}
                </div>
                <span
                  className={cn(
                    "text-[11px] font-medium leading-none font-body",
                    tab.isCenter
                      ? "text-accent-primary tabular-nums"
                      : isHighlighted
                        ? "text-accent-primary"
                        : "text-text-secondary"
                  )}
                >
                  {tab.label}
                </span>
              </div>
            </div>
          )
        })}
      </div>
      <div
        className="w-full"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 8px)" }}
      />
    </nav>
  )
}

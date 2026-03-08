"use client"

import type { PortalSection } from "@/lib/types/portal.types"

type TimelineItem = {
  time?: string
  title: string
  description?: string
  icon?: string
}

type Props = { section: PortalSection }

export function TimelineSection({ section }: Props) {
  const heading = (section.content.heading as string) ?? ""
  const items = (section.content.items as TimelineItem[]) ?? []
  const orientation = (section.content.orientation as string) ?? "vertical"

  if (items.length === 0) return null

  return (
    <div className="mx-auto max-w-3xl px-4" data-testid="timeline-section">
      {heading && (
        <h2
          className="mb-8 text-center text-2xl font-semibold"
          style={{
            fontFamily: "var(--portal-font-heading)",
            color: "var(--portal-text)",
          }}
        >
          {heading}
        </h2>
      )}

      {orientation === "horizontal" ? (
        <div className="scrollbar-none -mx-4 flex gap-6 overflow-x-auto px-4 pb-2">
          {items.map((item, i) => (
            <div
              key={i}
              className="flex min-w-[180px] flex-shrink-0 flex-col items-center text-center"
              data-testid={`timeline-item-${i}`}
            >
              <div
                className="mb-2 flex h-10 w-10 items-center justify-center rounded-full text-lg"
                style={{ backgroundColor: "var(--portal-primary)", color: "#fff" }}
              >
                {item.icon || i + 1}
              </div>
              {item.time && (
                <span className="mb-1 text-xs font-medium" style={{ color: "var(--portal-primary)" }}>
                  {item.time}
                </span>
              )}
              <span className="text-sm font-semibold" style={{ color: "var(--portal-text)" }}>
                {item.title}
              </span>
              {item.description && (
                <span className="mt-1 text-xs" style={{ color: "var(--portal-text-muted)" }}>
                  {item.description}
                </span>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="relative ms-4 border-s-2" style={{ borderColor: "var(--portal-border)" }}>
          {items.map((item, i) => (
            <div
              key={i}
              className="relative pb-8 ps-8 last:pb-0"
              data-testid={`timeline-item-${i}`}
            >
              {/* Dot */}
              <div
                className="absolute -start-[9px] top-1 h-4 w-4 rounded-full border-2"
                style={{
                  backgroundColor: "var(--portal-surface)",
                  borderColor: "var(--portal-primary)",
                }}
              />
              {item.time && (
                <span className="mb-1 block text-xs font-medium" style={{ color: "var(--portal-primary)" }}>
                  {item.time}
                </span>
              )}
              <h3 className="text-sm font-semibold" style={{ color: "var(--portal-text)" }}>
                {item.icon && <span className="me-1.5">{item.icon}</span>}
                {item.title}
              </h3>
              {item.description && (
                <p className="mt-1 text-sm" style={{ color: "var(--portal-text-muted)" }}>
                  {item.description}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

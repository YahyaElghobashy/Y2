"use client"

import type { PortalSection } from "@/lib/types/portal.types"

type TipItem = {
  title: string
  body: string
  icon?: string
  category?: string
}

type Props = { section: PortalSection }

const CATEGORY_ICONS: Record<string, string> = {
  visa: "🛂",
  weather: "🌤️",
  currency: "💰",
  safety: "🛡️",
  culture: "🎭",
  general: "💡",
}

export function TravelTipsSection({ section }: Props) {
  const heading = (section.content.heading as string) ?? ""
  const tips = (section.content.tips as TipItem[]) ?? []

  if (tips.length === 0) return null

  return (
    <div className="mx-auto max-w-3xl px-4" data-testid="travel-tips-section">
      {heading && (
        <h2
          className="mb-6 text-center text-2xl font-semibold"
          style={{
            fontFamily: "var(--portal-font-heading)",
            color: "var(--portal-text)",
          }}
        >
          {heading}
        </h2>
      )}

      <div className="space-y-4">
        {tips.map((tip, i) => (
          <div
            key={i}
            className="rounded-xl border p-5"
            style={{
              borderColor: "var(--portal-border)",
              backgroundColor: "var(--portal-surface)",
              borderRadius: "var(--portal-radius)",
            }}
            data-testid={`tip-card-${i}`}
          >
            <div className="flex items-start gap-3">
              <span className="text-xl">
                {tip.icon || CATEGORY_ICONS[tip.category ?? "general"] || "💡"}
              </span>
              <div>
                <h3 className="text-sm font-semibold" style={{ color: "var(--portal-text)" }}>
                  {tip.title}
                </h3>
                <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--portal-text-muted)" }}>
                  {tip.body}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

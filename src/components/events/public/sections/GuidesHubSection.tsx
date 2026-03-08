"use client"

import { ExternalLink } from "lucide-react"
import type { PortalSection } from "@/lib/types/portal.types"

type GuideItem = {
  title: string
  description?: string
  image_url?: string
  url?: string
  category?: string
}

type Props = { section: PortalSection }

export function GuidesHubSection({ section }: Props) {
  const heading = (section.content.heading as string) ?? ""
  const description = (section.content.description as string) ?? ""
  const guides = (section.content.guides as GuideItem[]) ?? []

  if (guides.length === 0) return null

  return (
    <div className="mx-auto max-w-3xl px-4" data-testid="guides-hub-section">
      {heading && (
        <h2
          className="mb-2 text-center text-2xl font-semibold"
          style={{
            fontFamily: "var(--portal-font-heading)",
            color: "var(--portal-text)",
          }}
        >
          {heading}
        </h2>
      )}
      {description && (
        <p className="mb-6 text-center text-sm" style={{ color: "var(--portal-text-muted)" }}>
          {description}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {guides.map((guide, i) => (
          <a
            key={i}
            href={guide.url || "#"}
            target={guide.url ? "_blank" : undefined}
            rel={guide.url ? "noopener noreferrer" : undefined}
            className="group overflow-hidden rounded-xl border transition-shadow hover:shadow-md"
            style={{
              borderColor: "var(--portal-border)",
              backgroundColor: "var(--portal-surface)",
              borderRadius: "var(--portal-radius)",
            }}
            data-testid={`guide-card-${i}`}
          >
            {guide.image_url && (
              <img src={guide.image_url} alt={guide.title} className="h-32 w-full object-cover" />
            )}
            <div className="p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold" style={{ color: "var(--portal-text)" }}>
                  {guide.title}
                </h3>
                {guide.url && (
                  <ExternalLink
                    className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100"
                    style={{ color: "var(--portal-primary)" }}
                  />
                )}
              </div>
              {guide.description && (
                <p className="mt-1 text-xs" style={{ color: "var(--portal-text-muted)" }}>
                  {guide.description}
                </p>
              )}
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}

"use client"

import { Car, Plane, Train, Bus, ExternalLink } from "lucide-react"
import type { PortalSection } from "@/lib/types/portal.types"

type TransportItem = {
  mode: string
  title: string
  description: string
  tips?: string[]
  links?: { label: string; url: string }[]
}

type Props = { section: PortalSection }

const MODE_ICONS: Record<string, React.ReactNode> = {
  car: <Car className="h-5 w-5" />,
  flight: <Plane className="h-5 w-5" />,
  train: <Train className="h-5 w-5" />,
  bus: <Bus className="h-5 w-5" />,
}

export function TransportSection({ section }: Props) {
  const heading = (section.content.heading as string) ?? ""
  const sections = (section.content.sections as TransportItem[]) ?? []

  if (sections.length === 0) return null

  return (
    <div className="mx-auto max-w-3xl px-4" data-testid="transport-section">
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
        {sections.map((item, i) => (
          <div
            key={i}
            className="rounded-xl border p-5"
            style={{
              borderColor: "var(--portal-border)",
              backgroundColor: "var(--portal-surface)",
              borderRadius: "var(--portal-radius)",
            }}
            data-testid={`transport-item-${i}`}
          >
            <div className="mb-2 flex items-center gap-3">
              <span style={{ color: "var(--portal-primary)" }}>
                {MODE_ICONS[item.mode] ?? <Car className="h-5 w-5" />}
              </span>
              <h3
                className="text-sm font-semibold"
                style={{ color: "var(--portal-text)" }}
              >
                {item.title}
              </h3>
            </div>
            <p
              className="text-sm leading-relaxed"
              style={{ color: "var(--portal-text-muted)" }}
            >
              {item.description}
            </p>
            {item.links && item.links.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {item.links.map((link, li) => (
                  <a
                    key={li}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium"
                    style={{ color: "var(--portal-primary)" }}
                  >
                    {link.label}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

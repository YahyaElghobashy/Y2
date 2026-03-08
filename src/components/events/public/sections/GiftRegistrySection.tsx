"use client"

import { ExternalLink, Gift } from "lucide-react"
import type { PortalSection } from "@/lib/types/portal.types"

type RegistryLink = {
  name: string
  url: string
  image_url?: string
}

type Props = { section: PortalSection }

export function GiftRegistrySection({ section }: Props) {
  const heading = (section.content.heading as string) ?? ""
  const description = (section.content.description as string) ?? ""
  const showExternal = (section.content.show_external_registries as boolean) ?? false
  const externalRegistries = (section.content.external_registries as RegistryLink[]) ?? []

  return (
    <div className="mx-auto max-w-2xl px-4 text-center" data-testid="gift-registry-section">
      {heading && (
        <h2
          className="mb-2 text-2xl font-semibold"
          style={{
            fontFamily: "var(--portal-font-heading)",
            color: "var(--portal-text)",
          }}
        >
          {heading}
        </h2>
      )}
      {description && (
        <p className="mb-6 text-sm" style={{ color: "var(--portal-text-muted)" }}>
          {description}
        </p>
      )}

      {showExternal && externalRegistries.length > 0 && (
        <div className="flex flex-wrap justify-center gap-4">
          {externalRegistries.map((reg, i) => (
            <a
              key={i}
              href={reg.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 rounded-xl border px-5 py-3 transition-shadow hover:shadow-md"
              style={{
                borderColor: "var(--portal-border)",
                backgroundColor: "var(--portal-surface)",
                borderRadius: "var(--portal-radius)",
              }}
              data-testid={`registry-link-${i}`}
            >
              {reg.image_url ? (
                <img
                  src={reg.image_url}
                  alt={reg.name}
                  className="h-8 w-8 object-contain"
                />
              ) : (
                <Gift className="h-5 w-5" style={{ color: "var(--portal-primary)" }} />
              )}
              <span className="text-sm font-medium" style={{ color: "var(--portal-text)" }}>
                {reg.name}
              </span>
              <ExternalLink
                className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100"
                style={{ color: "var(--portal-primary)" }}
              />
            </a>
          ))}
        </div>
      )}

      {!showExternal && (
        <div style={{ color: "var(--portal-text-muted)" }}>
          <Gift className="mx-auto mb-2 h-8 w-8" style={{ color: "var(--portal-primary)" }} />
          <p className="text-sm">Gift registry details coming soon</p>
        </div>
      )}
    </div>
  )
}

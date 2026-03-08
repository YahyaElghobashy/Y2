"use client"

import type { PortalSection } from "@/lib/types/portal.types"

type DressCodeItem = {
  event_title: string
  code: string
  description?: string
  color_palette?: string[]
  image_url?: string
}

type Props = { section: PortalSection }

export function DressCodeSection({ section }: Props) {
  const heading = (section.content.heading as string) ?? ""
  const description = (section.content.description as string) ?? ""
  const dressCodes = (section.content.dress_codes as DressCodeItem[]) ?? []

  if (dressCodes.length === 0) return null

  return (
    <div className="mx-auto max-w-3xl px-4" data-testid="dress-code-section">
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
        <p
          className="mb-6 text-center text-sm"
          style={{ color: "var(--portal-text-muted)" }}
        >
          {description}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {dressCodes.map((item, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-xl border"
            style={{
              borderColor: "var(--portal-border)",
              backgroundColor: "var(--portal-surface)",
              borderRadius: "var(--portal-radius)",
            }}
            data-testid={`dress-code-card-${i}`}
          >
            {item.image_url && (
              <img
                src={item.image_url}
                alt={item.code}
                className="h-40 w-full object-cover"
              />
            )}
            <div className="p-4">
              <span
                className="mb-1 block text-xs font-medium uppercase tracking-wider"
                style={{ color: "var(--portal-primary)" }}
              >
                {item.event_title}
              </span>
              <h3
                className="text-lg font-semibold"
                style={{ color: "var(--portal-text)" }}
              >
                {item.code}
              </h3>
              {item.description && (
                <p
                  className="mt-1 text-sm"
                  style={{ color: "var(--portal-text-muted)" }}
                >
                  {item.description}
                </p>
              )}
              {item.color_palette && item.color_palette.length > 0 && (
                <div className="mt-3 flex gap-1.5">
                  {item.color_palette.map((color, ci) => (
                    <span
                      key={ci}
                      className="h-6 w-6 rounded-full border"
                      style={{
                        backgroundColor: color,
                        borderColor: "var(--portal-border)",
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

"use client"

import type { PortalSection } from "@/lib/types/portal.types"

type Props = { section: PortalSection }

export function TextSection({ section }: Props) {
  const heading = (section.content.heading as string) ?? ""
  const body = (section.content.body as string) ?? ""
  const alignment = (section.content.alignment as string) ?? "left"

  return (
    <div
      className="mx-auto max-w-3xl px-4"
      style={{ textAlign: alignment as React.CSSProperties["textAlign"] }}
      data-testid="text-section"
    >
      {heading && (
        <h2
          className="mb-3 text-2xl font-semibold"
          style={{
            fontFamily: "var(--portal-font-heading)",
            color: "var(--portal-text)",
          }}
        >
          {heading}
        </h2>
      )}
      <div
        className="whitespace-pre-wrap text-base leading-relaxed"
        style={{ color: "var(--portal-text-muted)" }}
      >
        {body}
      </div>
    </div>
  )
}

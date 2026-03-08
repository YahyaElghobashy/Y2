"use client"

import type { PortalSection } from "@/lib/types/portal.types"

type Props = { section: PortalSection }

const SPACING_MAP: Record<string, string> = {
  sm: "1rem",
  md: "2rem",
  lg: "3.5rem",
}

export function DividerSection({ section }: Props) {
  const style = (section.content.style as string) ?? "line"
  const spacing = (section.content.spacing as string) ?? "md"

  const paddingY = SPACING_MAP[spacing] ?? SPACING_MAP.md

  if (style === "space") {
    return (
      <div style={{ height: paddingY }} data-testid="divider-section" />
    )
  }

  return (
    <div
      className="mx-auto max-w-3xl px-4"
      style={{ paddingTop: paddingY, paddingBottom: paddingY }}
      data-testid="divider-section"
    >
      {style === "line" && (
        <hr style={{ borderColor: "var(--portal-border)" }} />
      )}
      {style === "dots" && (
        <div className="flex items-center justify-center gap-2">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="block h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: "var(--portal-border)" }}
            />
          ))}
        </div>
      )}
      {style === "ornament" && (
        <div
          className="text-center text-lg"
          style={{ color: "var(--portal-primary)" }}
        >
          ✦
        </div>
      )}
    </div>
  )
}

"use client"

import { ImageIcon } from "lucide-react"
import type { PortalSection } from "@/lib/types/portal.types"

type Props = { section: PortalSection }

export function GallerySection({ section }: Props) {
  const heading = (section.content.heading as string) ?? ""
  const layout = (section.content.layout as string) ?? "grid"
  const columns = (section.content.columns as number) ?? 3

  // Media items will be fetched via portal_media table
  // Placeholder until media integration is complete

  return (
    <div className="mx-auto max-w-4xl px-4" data-testid="gallery-section">
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
      <div
        className="text-center text-sm"
        style={{ color: "var(--portal-text-muted)" }}
        data-testid="gallery-placeholder"
      >
        <ImageIcon
          className="mx-auto mb-2 h-8 w-8"
          style={{ color: "var(--portal-primary)" }}
        />
        Gallery photos will appear here
      </div>
    </div>
  )
}

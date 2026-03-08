"use client"

import type { PortalSection } from "@/lib/types/portal.types"

type Props = { section: PortalSection }

export function QuoteSection({ section }: Props) {
  const text = (section.content.text as string) ?? ""
  const attribution = (section.content.attribution as string) ?? ""
  const style = (section.content.style as string) ?? "simple"

  const isLarge = style === "large"
  const isDecorative = style === "decorative"

  return (
    <blockquote
      className="mx-auto max-w-2xl px-4 text-center"
      data-testid="quote-section"
    >
      {isDecorative && (
        <span
          className="mb-2 block text-5xl leading-none"
          style={{ color: "var(--portal-primary)" }}
          aria-hidden
        >
          &ldquo;
        </span>
      )}
      <p
        className={`italic leading-relaxed ${isLarge ? "text-2xl sm:text-3xl" : "text-lg"}`}
        style={{
          fontFamily: "var(--portal-font-heading)",
          color: "var(--portal-text)",
        }}
      >
        {isDecorative ? text : `"${text}"`}
      </p>
      {attribution && (
        <footer
          className="mt-3 text-sm"
          style={{ color: "var(--portal-text-muted)" }}
        >
          {attribution}
        </footer>
      )}
    </blockquote>
  )
}

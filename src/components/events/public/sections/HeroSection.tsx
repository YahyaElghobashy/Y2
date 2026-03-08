"use client"

import type { PortalSection } from "@/lib/types/portal.types"

type Props = { section: PortalSection }

export function HeroSection({ section }: Props) {
  const heading = (section.content.heading as string) ?? ""
  const subheading = (section.content.subheading as string) ?? ""
  const bgImage = (section.content.background_image_url as string) || undefined
  const overlay = (section.content.background_overlay_opacity as number) ?? 0.4
  const dateDisplay = (section.content.date_display as string) ?? ""
  const layout = (section.content.layout as string) ?? "centered"
  const ctaText = (section.content.cta_text as string) ?? ""
  const ctaLink = (section.content.cta_link as string) ?? ""

  const alignClass =
    layout === "left" ? "items-start text-start" : "items-center text-center"

  return (
    <div
      className="relative flex min-h-[60vh] flex-col justify-center overflow-hidden px-6 py-16"
      style={{ backgroundColor: "var(--portal-surface)" }}
      data-testid="hero-section"
    >
      {bgImage && (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${bgImage})` }}
          />
          <div
            className="absolute inset-0"
            style={{
              backgroundColor: `rgba(0,0,0,${overlay})`,
            }}
          />
        </>
      )}

      <div className={`relative z-10 mx-auto flex w-full max-w-3xl flex-col ${alignClass}`}>
        {dateDisplay && (
          <span
            className="mb-3 text-sm font-medium tracking-wider uppercase"
            style={{ color: bgImage ? "rgba(255,255,255,0.8)" : "var(--portal-primary)" }}
          >
            {dateDisplay}
          </span>
        )}
        <h1
          className="text-4xl font-bold leading-tight sm:text-5xl md:text-6xl"
          style={{
            fontFamily: "var(--portal-font-heading)",
            color: bgImage ? "#fff" : "var(--portal-text)",
          }}
        >
          {heading}
        </h1>
        {subheading && (
          <p
            className="mt-3 text-lg sm:text-xl"
            style={{
              color: bgImage ? "rgba(255,255,255,0.85)" : "var(--portal-text-muted)",
            }}
          >
            {subheading}
          </p>
        )}
        {ctaText && ctaLink && (
          <a
            href={ctaLink}
            className="mt-8 inline-block rounded-lg px-8 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{
              backgroundColor: "var(--portal-primary)",
              borderRadius: "var(--portal-radius)",
            }}
            data-testid="hero-cta"
          >
            {ctaText}
          </a>
        )}
      </div>
    </div>
  )
}

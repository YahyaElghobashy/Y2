"use client"

import type { PortalSection } from "@/lib/types/portal.types"

type Props = { section: PortalSection }

export function CTASection({ section }: Props) {
  const heading = (section.content.heading as string) ?? ""
  const description = (section.content.description as string) ?? ""
  const buttonText = (section.content.button_text as string) ?? ""
  const buttonUrl = (section.content.button_url as string) ?? "#"
  const buttonStyle = (section.content.button_style as string) ?? "primary"
  const bgColor = (section.content.background_color as string) || undefined
  const imageUrl = (section.content.image_url as string) || undefined

  const buttonClasses = "inline-block rounded-lg px-8 py-3 text-sm font-semibold transition-opacity hover:opacity-90"

  return (
    <div
      className="relative mx-auto max-w-3xl overflow-hidden rounded-xl px-6 py-12 text-center"
      style={{
        backgroundColor: bgColor ?? "var(--portal-surface)",
        borderRadius: "var(--portal-radius)",
      }}
      data-testid="cta-section"
    >
      {imageUrl && (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${imageUrl})` }}
        />
      )}
      <div className="relative z-10">
        <h2
          className="mb-2 text-2xl font-bold"
          style={{
            fontFamily: "var(--portal-font-heading)",
            color: "var(--portal-text)",
          }}
        >
          {heading}
        </h2>
        {description && (
          <p
            className="mx-auto mb-6 max-w-lg text-sm"
            style={{ color: "var(--portal-text-muted)" }}
          >
            {description}
          </p>
        )}
        {buttonText && (
          <a
            href={buttonUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClasses}
            style={
              buttonStyle === "primary"
                ? {
                    backgroundColor: "var(--portal-primary)",
                    color: "#fff",
                    borderRadius: "var(--portal-radius)",
                  }
                : buttonStyle === "outline"
                  ? {
                      border: "2px solid var(--portal-primary)",
                      color: "var(--portal-primary)",
                      borderRadius: "var(--portal-radius)",
                    }
                  : {
                      color: "var(--portal-primary)",
                      borderRadius: "var(--portal-radius)",
                    }
            }
            data-testid="cta-button"
          >
            {buttonText}
          </a>
        )}
      </div>
    </div>
  )
}

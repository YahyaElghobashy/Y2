"use client"

import type { PortalSection } from "@/lib/types/portal.types"

type Props = { section: PortalSection }

export function WelcomeSection({ section }: Props) {
  const heading = (section.content.heading as string) ?? ""
  const body = (section.content.body as string) ?? ""
  const imageUrl = (section.content.image_url as string) || undefined
  const imagePosition = (section.content.image_position as string) ?? "right"
  const signatures = (section.content.signatures as string[]) ?? []

  const isVertical = imagePosition === "top" || imagePosition === "bottom"
  const isImageFirst = imagePosition === "left" || imagePosition === "top"

  const textContent = (
    <div className="flex-1">
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
      <p
        className="whitespace-pre-wrap text-base leading-relaxed"
        style={{ color: "var(--portal-text-muted)" }}
      >
        {body}
      </p>
      {signatures.length > 0 && (
        <div className="mt-6 space-y-1">
          {signatures.map((sig, i) => (
            <p
              key={i}
              className="text-sm italic"
              style={{
                fontFamily: "var(--portal-font-heading)",
                color: "var(--portal-text)",
              }}
            >
              {sig}
            </p>
          ))}
        </div>
      )}
    </div>
  )

  const imageContent = imageUrl ? (
    <div className={isVertical ? "w-full" : "w-full sm:w-2/5"}>
      <img
        src={imageUrl}
        alt={heading || "Welcome"}
        className="h-auto w-full object-cover"
        style={{ borderRadius: "var(--portal-radius)" }}
      />
    </div>
  ) : null

  return (
    <div
      className={`mx-auto max-w-3xl px-4 ${
        isVertical
          ? "flex flex-col gap-6"
          : "flex flex-col gap-6 sm:flex-row sm:items-center"
      }`}
      data-testid="welcome-section"
    >
      {isImageFirst ? (
        <>
          {imageContent}
          {textContent}
        </>
      ) : (
        <>
          {textContent}
          {imageContent}
        </>
      )}
    </div>
  )
}

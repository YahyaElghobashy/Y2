"use client"

/**
 * CountryTooltip — the hover popup. Positioned by the View near the cursor.
 * Display-font country name + a one-line status. Purely presentational.
 */
export function CountryTooltip({
  name,
  summary,
  pinned,
  x,
  y,
}: {
  name: string
  summary: string
  pinned?: boolean
  x: number
  y: number
}) {
  return (
    <div
      role="tooltip"
      className="pointer-events-none absolute z-30 -translate-x-1/2 -translate-y-full rounded-xl px-3 py-2 shadow-lg"
      style={{
        left: x,
        top: y - 10,
        maxWidth: 220,
        background: "var(--card)",
        color: "var(--card-foreground)",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-warm-lg)",
      }}
    >
      <p
        className="text-[13px] font-semibold leading-tight"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {name}
      </p>
      <p
        className="mt-0.5 text-[11px] leading-tight"
        style={{ fontFamily: "var(--font-nav)", color: "var(--color-ink-soft)" }}
      >
        {summary}
      </p>
      {pinned && (
        <p
          className="mt-0.5 text-[10px]"
          style={{ fontFamily: "var(--font-nav)", color: "var(--color-coral)" }}
        >
          ★ on the wishlist
        </p>
      )}
    </div>
  )
}

"use client"

/**
 * PinBadge — an aspirational-destination marker, rendered INSIDE the map <svg>
 * at a country centroid. Distinct per owner: amber (me), teal (partner), and a
 * glowing coral for a mutual/shared dream.
 */
export type PinKind = "me" | "partner" | "mutual"

const COLOR: Record<PinKind, string> = {
  me: "var(--color-amber)",
  partner: "var(--color-teal)",
  mutual: "var(--color-coral)",
}

export function PinBadge({
  x,
  y,
  kind,
}: {
  x: number
  y: number
  kind: PinKind
}) {
  const color = COLOR[kind]
  const r = kind === "mutual" ? 4.4 : 3.6
  return (
    <g
      transform={`translate(${x}, ${y})`}
      pointerEvents="none"
      className={kind === "mutual" ? "wm-pin wm-pin-mutual" : "wm-pin"}
    >
      {kind === "mutual" && (
        <circle r={r + 3} fill={color} opacity={0.22} className="wm-pin-halo" />
      )}
      {/* teardrop: circle head + pointer */}
      <path
        d={`M0,${r * 1.7} L${-r * 0.7},${r * 0.2} A${r},${r} 0 1 1 ${r * 0.7},${r * 0.2} Z`}
        fill={color}
        stroke="var(--color-paper)"
        strokeWidth={0.5}
      />
      <circle cx={0} cy={-r * 0.15} r={r * 0.42} fill="var(--color-paper)" />
    </g>
  )
}

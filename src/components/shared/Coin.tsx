"use client"

import { cn } from "@/lib/utils"

/**
 * Coin — the CoYYns token (docs/DESIGN_BLUEPRINT.md §1.5). A crisp CSS gold coin
 * (gradient + embossed rim + YY), so it stays premium and halo-free at any size
 * on any background. The riso coin-yy art is reserved for the big WalletHero.
 */
type CoinProps = {
  amount?: number
  size?: number
  label?: string
  className?: string
}

export function CoinIcon({ size = 24 }: { size?: number }) {
  const showYY = size >= 17
  return (
    <span
      aria-hidden
      className="inline-grid shrink-0 place-items-center"
      style={{
        width: size,
        height: size,
        borderRadius: "9999px",
        background: "radial-gradient(circle at 36% 30%, #FBE6AE 0%, #ECB85A 48%, #C98A38 78%, #9E6A2C 100%)",
        boxShadow:
          "inset 0 0 0 1.5px rgba(139,94,43,0.55), inset 0 -2px 3px rgba(139,94,43,0.45), inset 0 2px 3px rgba(255,247,224,0.5), 0 1px 2px rgba(42,32,24,0.25)",
      }}
    >
      {showYY ? (
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: Math.round(size * 0.46),
            lineHeight: 1,
            color: "#7A3B16",
            letterSpacing: "-0.04em",
            textShadow: "0 1px 0 rgba(255,247,224,0.4)",
          }}
        >
          YY
        </span>
      ) : (
        <span style={{ width: Math.max(2, size * 0.16), height: Math.max(2, size * 0.16), borderRadius: "9999px", background: "#7A3B16", opacity: 0.6 }} />
      )}
    </span>
  )
}

export function Coin({ amount, size = 24, label, className }: CoinProps) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <CoinIcon size={size} />
      {amount !== undefined && (
        <span className="font-bold tabular-nums leading-none" style={{ fontFamily: "var(--font-body)", color: "currentColor" }}>
          {amount.toLocaleString()}
        </span>
      )}
      {label && (
        <span className="text-sm font-medium leading-none" style={{ color: "var(--color-ink-soft)" }}>
          {label}
        </span>
      )}
    </span>
  )
}

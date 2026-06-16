/**
 * Auth ground — the Constitution's golden-hour skin (DESIGN_BLUEPRINT §8.1).
 * Warm paper base + a soft sunrise glow up top + a faint paper grain and a
 * gentle warm vignette. Calm, editorial, the first warmth a guest feels.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative min-h-[100dvh] overflow-hidden" style={{ background: "var(--color-paper, #F7EFE3)" }}>
      {/* Golden-hour wash — sunrise from the top */}
      <div
        className="pointer-events-none fixed inset-0 z-[1]"
        style={{
          background:
            "radial-gradient(120% 70% at 50% -8%, rgba(242,169,59,0.20) 0%, rgba(232,205,174,0.10) 38%, transparent 68%)",
        }}
        aria-hidden="true"
      />
      {/* Warm grounding vignette + a hint of terracotta at the foot */}
      <div
        className="pointer-events-none fixed inset-0 z-[1]"
        style={{
          background:
            "radial-gradient(90% 60% at 50% 118%, rgba(200,85,43,0.10) 0%, transparent 60%), radial-gradient(130% 90% at 50% 50%, transparent 60%, rgba(42,32,24,0.05) 100%)",
        }}
        aria-hidden="true"
      />
      {/* Paper grain */}
      <div
        className="pointer-events-none fixed inset-0 z-[1] opacity-[0.5] mix-blend-multiply"
        style={{
          backgroundImage: "url('/assets/textures/texture-paper-cream.webp')",
          backgroundSize: "420px",
        }}
        aria-hidden="true"
      />
      <div className="relative z-10">{children}</div>
    </div>
  )
}

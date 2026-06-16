/**
 * Offline — a warm "you're offline" rest stop (DESIGN_BLUEPRINT §8.6).
 * Lantern-dusk scene, a Hand-written reassurance, and the worlds that still
 * work from cache. Calm, never an error wall.
 */
const CACHED = [
  { emoji: "🏠", label: "Home" },
  { emoji: "📖", label: "Keepsake" },
  { emoji: "🪙", label: "Treasury" },
]

export default function OfflinePage() {
  return (
    <main className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-6 text-center" style={{ background: "var(--color-paper, #F7EFE3)" }}>
      {/* Dusk glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(120% 60% at 50% 0%, rgba(242,169,59,0.18) 0%, transparent 62%)" }}
        aria-hidden="true"
      />

      <div className="relative z-10 flex w-full max-w-[340px] flex-col items-center">
        <span
          className="block h-40 w-40 rounded-[28px] bg-cover bg-center"
          style={{
            backgroundImage: "url('/assets/scenes/scene-lantern-dusk.webp')",
            boxShadow: "var(--shadow-warm-lg, 0 18px 40px -12px rgba(42,32,24,0.28))",
          }}
          aria-hidden="true"
        />

        <h1 className="mt-7 text-[28px] font-extrabold tracking-tight" style={{ fontFamily: "var(--font-display)", color: "var(--color-ink, #2A2018)" }}>
          You&apos;re offline
        </h1>
        <p className="mt-2 text-[19px]" style={{ fontFamily: "var(--font-hand)", color: "var(--color-terracotta, #C8552B)" }}>
          take a breath — Hayah waits for you
        </p>
        <p className="mt-3 text-[14px] leading-relaxed" style={{ fontFamily: "var(--font-serif)", color: "var(--color-ink-soft, #6B5D4F)" }}>
          We&apos;ll sync everything the moment you reconnect.
        </p>

        <div className="mt-7 w-full">
          <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.2em]" style={{ fontFamily: "var(--font-nav)", color: "var(--color-ink-soft, #6B5D4F)" }}>
            Still here from cache
          </p>
          <div className="flex justify-center gap-2.5">
            {CACHED.map((c) => (
              <span
                key={c.label}
                className="flex items-center gap-1.5 rounded-full px-3 py-2 text-[13px] font-bold"
                style={{ background: "var(--color-sand, #EBDDC7)", color: "var(--color-ink, #2A2018)", fontFamily: "var(--font-body)" }}
              >
                <span aria-hidden="true">{c.emoji}</span>
                {c.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}

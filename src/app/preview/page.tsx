import Link from "next/link"

/**
 * Preview gallery — the redesign review surface. Public, no auth. Every screen
 * is a props-driven *View rendered with mock data; the real authed pages reuse
 * the same components wired to hooks.
 */
export const metadata = { title: "Hayah — Redesign Preview" }

const GROUPS: { world: string; arabic: string; accent: string; items: { name: string; href: string; note: string }[] }[] = [
  { world: "Home", arabic: "الدار", accent: "#F2A93B", items: [{ name: "The Living Room", href: "/preview/home", note: "calm hub · golden-hour hero" }] },
  {
    world: "Treasury", arabic: "الخزينة", accent: "#C8552B", items: [
      { name: "Hub + Wallet", href: "/preview/treasury", note: "coin · count-up · pots" },
      { name: "Coupons", href: "/preview/coupons", note: "redeem → big celebration" },
      { name: "Marketplace", href: "/preview/marketplace", note: "buy → quiet celebration" },
      { name: "Wishlist", href: "/preview/wishlist", note: "warm catalog · claim" },
    ],
  },
  {
    world: "Me", arabic: "أنا", accent: "#1F8A8A", items: [
      { name: "Soul", href: "/preview/soul", note: "prayer-light · du'a · geometry" },
      { name: "Body", href: "/preview/body", note: "cycle ribbon · rose" },
      { name: "Rituals", href: "/preview/rituals", note: "habit journal · streaks" },
    ],
  },
  {
    world: "Keepsake", arabic: "الذكرى", accent: "#E0857A", items: [
      { name: "Hub", href: "/preview/keepsake", note: "on this day" },
      { name: "Garden", href: "/preview/garden", note: "garden-sway · bloom field" },
      { name: "Snap", href: "/preview/snap", note: "polaroid feed" },
      { name: "Letters", href: "/preview/letters", note: "candle · Fraunces · seal" },
      { name: "2026 Vision", href: "/preview/vision", note: "annual board · goals" },
    ],
  },
  {
    world: "Us", arabic: "نحن", accent: "#E5663C", items: [
      { name: "Connect", href: "/preview/connect", note: "prompt → reveal-both" },
      { name: "Play", href: "/preview/play", note: "games hub" },
      { name: "Plan", href: "/preview/plan", note: "warm calendar" },
      { name: "Watch", href: "/preview/watch", note: "movies · both ratings" },
      { name: "Table", href: "/preview/table", note: "food journal · map/list" },
    ],
  },
  { world: "Moments", arabic: "لحظات", accent: "#2B2F5E", items: [{ name: "Celebration", href: "/preview/celebration", note: "confetti · sunburst · seal" }] },
]

export default function PreviewGalleryPage() {
  return (
    <div className="min-h-[100dvh] px-5 py-8" style={{ background: "var(--background)" }}>
      <div className="mx-auto max-w-[760px]">
        <p className="text-[12px] font-bold uppercase tracking-[0.28em]" style={{ fontFamily: "var(--font-nav)", color: "#C8552B" }}>Hayah · Redesign Preview</p>
        <h1 className="mt-2 text-[clamp(34px,7vw,56px)] font-extrabold leading-[0.96] tracking-tight" style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}>
          Every screen, by world.
        </h1>
        <p className="mt-2 max-w-[52ch] text-[17px]" style={{ fontFamily: "var(--font-serif)", color: "var(--color-ink-soft)" }}>
          Open on a phone-width window. Each is the real component with mock data.
        </p>

        {GROUPS.map((g) => (
          <section key={g.world} className="mt-8">
            <div className="mb-3 flex items-baseline gap-2.5">
              <h2 className="text-[20px] font-extrabold tracking-tight" style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}>{g.world}</h2>
              <span className="text-[16px]" style={{ fontFamily: "var(--font-arabic)", color: g.accent }}>{g.arabic}</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {g.items.map((it) => (
                <Link
                  key={it.href}
                  href={it.href}
                  className="group relative overflow-hidden rounded-2xl border p-4 transition-transform hover:-translate-y-0.5"
                  style={{ background: "var(--card)", borderColor: "var(--border)", boxShadow: "var(--shadow-warm-md)" }}
                >
                  <span className="absolute inset-x-0 top-0 h-[3px]" style={{ background: g.accent }} />
                  <span className="block text-[16px] font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}>{it.name}</span>
                  <span className="mt-0.5 block text-[13px]" style={{ fontFamily: "var(--font-serif)", color: "var(--color-ink-soft)" }}>{it.note}</span>
                  <span className="mt-2 block text-[12px] font-mono" style={{ color: "var(--color-ink-faint)" }}>{it.href}</span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}

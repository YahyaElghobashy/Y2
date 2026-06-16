import Link from "next/link"

export default function PortalNotFound() {
  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-5 text-center"
      style={{ background: "var(--color-paper, #F7EFE3)" }}
    >
      {/* Golden-hour wash */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(120% 55% at 50% -4%, rgba(242,169,59,0.16) 0%, transparent 66%)" }}
        aria-hidden="true"
      />
      <div className="relative z-10 flex flex-col items-center">
        <span
          className="mb-4 block h-20 w-20 rounded-2xl bg-cover bg-center shadow-warm-md"
          style={{ backgroundImage: "url('/assets/scenes/scene-lantern-dusk.webp')" }}
          aria-hidden="true"
        />
        <h1
          className="mb-2 text-[26px] font-extrabold tracking-tight"
          style={{ fontFamily: "var(--font-display)", color: "var(--color-ink, #2A2018)" }}
        >
          Portal Not Found
        </h1>
        <p
          className="mb-6 text-[14px]"
          style={{ fontFamily: "var(--font-serif)", color: "var(--color-ink-soft, #6B5D4F)" }}
        >
          This event portal doesn&apos;t exist or hasn&apos;t been published yet.
        </p>
        <Link
          href="/"
          className="rounded-full px-6 py-2.5 text-[14px] font-semibold text-white shadow-warm-md transition-opacity hover:opacity-90"
          style={{ background: "var(--color-terracotta, #C8552B)", fontFamily: "var(--font-body)" }}
        >
          Go Home
        </Link>
      </div>
    </div>
  )
}

"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Camera } from "lucide-react"

/**
 * SnapView — the daily photo feed (docs/DESIGN_BLUEPRINT.md §6.1). Polaroids,
 * pinned and tilted, grouped by day; both snaps side-by-side when you both
 * shared. Warm, keepsake. Presentational.
 */
const hideOnError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  e.currentTarget.style.display = "none"
}

export type Snap = { photo: string; who: string; reaction?: string }
export type SnapDay = { label: string; mine?: Snap; theirs?: Snap }

function Polaroid({ snap, tilt }: { snap: Snap; tilt: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14, rotate: tilt * 1.5 }}
      animate={{ opacity: 1, y: 0, rotate: tilt }}
      transition={{ type: "spring", damping: 16, stiffness: 200 }}
      className="rounded-[14px] bg-white p-2 pb-3"
      style={{ boxShadow: "var(--shadow-warm-lg)" }}
    >
      <div className="relative overflow-hidden rounded-[8px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={snap.photo} alt="" onError={hideOnError} className="aspect-[4/5] w-full object-cover" />
        {snap.reaction && (
          <span className="absolute -bottom-1 right-1.5 text-[22px] drop-shadow-md">{snap.reaction}</span>
        )}
      </div>
      <p className="mt-1.5 text-center text-[18px] leading-none" style={{ fontFamily: "var(--font-handwritten)", color: "var(--color-ink-soft)" }}>
        {snap.who}
      </p>
    </motion.div>
  )
}

export function SnapView({ days }: { days: SnapDay[] }) {
  return (
    <div className="skin-aware min-h-[100dvh] px-5 pb-28 pt-6" style={{ background: "var(--background)" }}>
      <header className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-[19px] leading-none" style={{ fontFamily: "var(--font-arabic)", color: "var(--color-teal-deep)" }}>لقطات</p>
          <h1 className="mt-1 text-[30px] font-extrabold tracking-tight" style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}>Snaps</h1>
        </div>
        <Link
          href="/snap/capture"
          aria-label="Take a snap"
          className="grid h-12 w-12 place-items-center rounded-full"
          style={{ background: "var(--color-terracotta)", color: "#FFF7EF", boxShadow: "var(--shadow-glow-copper)" }}
        >
          <Camera size={22} />
        </Link>
      </header>

      <div className="grid gap-6">
        {days.map((d, i) => {
          const both = d.mine && d.theirs
          return (
            <div key={i}>
              <p className="mb-2 text-[12px] font-bold uppercase tracking-[0.18em]" style={{ fontFamily: "var(--font-nav)", color: "var(--color-ink-soft)" }}>
                {d.label}
              </p>
              <div className={both ? "grid grid-cols-2 gap-3" : "mx-auto max-w-[64%]"}>
                {d.mine && <Polaroid snap={d.mine} tilt={-2} />}
                {d.theirs && <Polaroid snap={d.theirs} tilt={2} />}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export const SNAP_MOCK: SnapDay[] = [
  { label: "Today", mine: { photo: "/assets/scenes/scene-rooftop-cups.webp", who: "you", reaction: "🔥" }, theirs: { photo: "/assets/scenes/scene-coffee-pourover.webp", who: "Yara", reaction: "❤️" } },
  { label: "Yesterday", mine: { photo: "/assets/scenes/scene-garden-rooftop.webp", who: "you", reaction: "😍" } },
  { label: "Tuesday", mine: { photo: "/assets/scenes/scene-datenight-balcony.webp", who: "you" }, theirs: { photo: "/assets/scenes/scene-cards-flatlay.webp", who: "Yara", reaction: "😂" } },
]

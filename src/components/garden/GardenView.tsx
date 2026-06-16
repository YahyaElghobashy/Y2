"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"
import { PosterCard } from "@/components/shared/PosterCard"

/**
 * GardenView — the shared garden (docs/DESIGN_BLUEPRINT.md §6.2). One bloom for
 * every day you've both opened Hayah. Garden-sway video header, sage+teal,
 * a field that visibly grows. Presentational; real bloom dates wire behind it.
 */
const FLOWERS = ["🌼", "🌷", "🌸", "🌺", "🪻", "🌻", "💐"]

const hideOnError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  e.currentTarget.style.display = "none"
}

export type GardenData = { days: number; since: string }

export function GardenView({ data }: { data: GardenData }) {
  const blooms = useMemo(
    () => Array.from({ length: data.days }, (_, i) => FLOWERS[(i * 7 + (i % 5) * 3) % FLOWERS.length]),
    [data.days],
  )

  return (
    <div className="skin-aware min-h-[100dvh] pb-28" style={{ background: "var(--background)" }}>
      {/* ── Garden-sway ambient header ── */}
      <div className="relative h-[200px] overflow-hidden rounded-b-[28px]">
        <video
          autoPlay
          muted
          loop
          playsInline
          poster="/assets/video/anim-garden-sway-poster.webp"
          className="absolute inset-0 h-full w-full object-cover"
        >
          <source src="/assets/video/anim-garden-sway.webm" type="video/webm" />
          <source src="/assets/video/anim-garden-sway.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(21,112,111,0.05) 0%, rgba(21,112,111,0.55) 100%)" }} />
        <div className="absolute inset-x-0 bottom-0 p-5">
          <p className="text-[22px] leading-none" style={{ fontFamily: "var(--font-arabic)", color: "#EAF6F2" }}>الحديقة</p>
          <h1 className="mt-1.5 text-[30px] font-extrabold tracking-tight" style={{ fontFamily: "var(--font-display)", color: "#FFF7EF" }}>Our Garden</h1>
          <p className="mt-0.5 text-[14px]" style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", color: "#CDEAE6" }}>
            A bloom for every day you both showed up.
          </p>
        </div>
      </div>

      <div className="px-5 pt-5">
        <PosterCard accent="teal" grain={false} className="flex items-center justify-between">
          <div>
            <span className="text-[34px] font-extrabold leading-none tabular-nums" style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}>
              {data.days}
            </span>
            <span className="ml-1.5 text-[14px]" style={{ color: "var(--color-ink-soft)" }}>blooms</span>
            <p className="mt-1 text-[13px]" style={{ fontFamily: "var(--font-serif)", color: "var(--color-ink-soft)" }}>growing since {data.since}</p>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/posters/poster-grow-garden.webp" alt="" aria-hidden onError={hideOnError} className="h-16 w-16 rounded-xl object-cover" />
        </PosterCard>

        {/* ── The bloom field ── */}
        <div className="mt-5 flex flex-wrap content-start gap-x-1 gap-y-0.5">
          {blooms.map((f, i) => (
            <motion.span
              key={i}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 14, stiffness: 220, delay: Math.min(i * 0.006, 1.2) }}
              className="text-[19px] leading-none"
              style={{ filter: "saturate(0.92)" }}
            >
              {f}
            </motion.span>
          ))}
        </div>
      </div>
    </div>
  )
}

export const GARDEN_MOCK: GardenData = { days: 128, since: "Feb 2026" }

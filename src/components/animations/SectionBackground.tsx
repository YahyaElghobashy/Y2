"use client"

import { useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { usePathname } from "next/navigation"

type SectionId = "home" | "us" | "me" | "more" | "snap" | "our-table" | "2026" | "wheel"

type BlobConfig = {
  color: string
  size: number
  x: string
  y: string
  duration: number
  driftX: number
  driftY: number
}

const SECTION_BLOBS: Record<SectionId, BlobConfig[]> = {
  // Home: warm gold + soft rose — welcoming sunrise
  home: [
    { color: "rgba(218, 165, 32, 0.08)", size: 280, x: "15%", y: "10%", duration: 22, driftX: 60, driftY: 40 },
    { color: "rgba(244, 168, 184, 0.06)", size: 240, x: "75%", y: "30%", duration: 18, driftX: -50, driftY: 50 },
    { color: "rgba(196, 149, 106, 0.05)", size: 200, x: "40%", y: "70%", duration: 25, driftX: 40, driftY: -30 },
  ],
  // Us: rose + copper — romantic, intimate
  us: [
    { color: "rgba(244, 168, 184, 0.09)", size: 300, x: "20%", y: "15%", duration: 20, driftX: 50, driftY: 35 },
    { color: "rgba(184, 115, 51, 0.07)", size: 250, x: "70%", y: "40%", duration: 24, driftX: -45, driftY: 45 },
    { color: "rgba(244, 168, 184, 0.05)", size: 220, x: "50%", y: "75%", duration: 17, driftX: 35, driftY: -40 },
  ],
  // Me: sage green + cream — reflective, personal
  me: [
    { color: "rgba(168, 181, 160, 0.08)", size: 280, x: "25%", y: "12%", duration: 23, driftX: 55, driftY: 30 },
    { color: "rgba(245, 237, 227, 0.10)", size: 260, x: "65%", y: "35%", duration: 19, driftX: -40, driftY: 55 },
    { color: "rgba(168, 181, 160, 0.05)", size: 200, x: "35%", y: "72%", duration: 26, driftX: 45, driftY: -35 },
  ],
  // More: dusk blue + soft cream — neutral, administrative
  more: [
    { color: "rgba(126, 200, 227, 0.07)", size: 260, x: "18%", y: "18%", duration: 21, driftX: 45, driftY: 40 },
    { color: "rgba(245, 237, 227, 0.08)", size: 240, x: "72%", y: "38%", duration: 25, driftX: -50, driftY: 35 },
    { color: "rgba(126, 200, 227, 0.04)", size: 200, x: "45%", y: "68%", duration: 18, driftX: 35, driftY: -45 },
  ],
  // Snap: uses Us palette (rose/copper) — shared feature
  snap: [
    { color: "rgba(244, 168, 184, 0.08)", size: 280, x: "22%", y: "14%", duration: 20, driftX: 50, driftY: 35 },
    { color: "rgba(184, 115, 51, 0.06)", size: 240, x: "68%", y: "42%", duration: 23, driftX: -45, driftY: 40 },
    { color: "rgba(196, 149, 106, 0.05)", size: 210, x: "48%", y: "70%", duration: 17, driftX: 40, driftY: -35 },
  ],
  // Our Table: gold + warm amber — food warmth
  "our-table": [
    { color: "rgba(218, 165, 32, 0.09)", size: 300, x: "20%", y: "10%", duration: 21, driftX: 55, driftY: 30 },
    { color: "rgba(184, 115, 51, 0.07)", size: 250, x: "72%", y: "35%", duration: 18, driftX: -50, driftY: 50 },
    { color: "rgba(218, 165, 32, 0.05)", size: 220, x: "40%", y: "68%", duration: 24, driftX: 40, driftY: -40 },
  ],
  // 2026: gold + sage — growth/aspiration
  "2026": [
    { color: "rgba(218, 165, 32, 0.08)", size: 280, x: "25%", y: "12%", duration: 22, driftX: 50, driftY: 35 },
    { color: "rgba(168, 181, 160, 0.07)", size: 250, x: "68%", y: "38%", duration: 19, driftX: -45, driftY: 45 },
    { color: "rgba(218, 165, 32, 0.04)", size: 200, x: "42%", y: "72%", duration: 25, driftX: 35, driftY: -30 },
  ],
  // Wheel: copper + rose — playful
  wheel: [
    { color: "rgba(184, 115, 51, 0.09)", size: 280, x: "18%", y: "15%", duration: 20, driftX: 55, driftY: 40 },
    { color: "rgba(244, 168, 184, 0.07)", size: 250, x: "75%", y: "35%", duration: 23, driftX: -50, driftY: 35 },
    { color: "rgba(184, 115, 51, 0.05)", size: 210, x: "45%", y: "70%", duration: 17, driftX: 40, driftY: -45 },
  ],
}

function getSection(pathname: string): SectionId {
  if (pathname === "/") return "home"
  if (pathname.startsWith("/us")) return "us"
  if (pathname.startsWith("/me")) return "me"
  if (pathname.startsWith("/more") || pathname.startsWith("/settings")) return "more"
  if (pathname.startsWith("/snap")) return "snap"
  if (pathname.startsWith("/our-table")) return "our-table"
  if (pathname.startsWith("/2026")) return "2026"
  if (pathname.startsWith("/wheel")) return "wheel"
  return "home"
}

export function SectionBackground() {
  const pathname = usePathname()
  const section = getSection(pathname)
  const blobs = SECTION_BLOBS[section]

  // Memoize the prefersReducedMotion check
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === "undefined") return false
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches
  }, [])

  return (
    <div
      className="fixed inset-0 z-0 overflow-hidden pointer-events-none"
      aria-hidden="true"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={section}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
        >
          {blobs.map((blob, i) => (
            <motion.div
              key={`${section}-blob-${i}`}
              className="absolute rounded-full"
              style={{
                width: blob.size,
                height: blob.size,
                left: blob.x,
                top: blob.y,
                background: `radial-gradient(circle, ${blob.color} 0%, transparent 70%)`,
                filter: "blur(80px)",
                willChange: "transform",
              }}
              animate={
                prefersReducedMotion
                  ? {}
                  : {
                      x: [0, blob.driftX, 0],
                      y: [0, blob.driftY, 0],
                    }
              }
              transition={
                prefersReducedMotion
                  ? undefined
                  : {
                      duration: blob.duration,
                      repeat: Infinity,
                      repeatType: "mirror",
                      ease: "easeInOut",
                    }
              }
            />
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

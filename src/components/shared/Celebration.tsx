"use client"

import { useEffect, useMemo } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"

/**
 * Celebration — the calibrated reward moment (docs/DESIGN_BLUEPRINT.md §1.4).
 * tone="big" = confetti + spinning sunburst + wax seal (milestones); tone="quiet"
 * = a soft glow + seal (everyday acts). Reused by coupon-redeem, game-win,
 * pairing, streaks. Auto-dismisses; tap to dismiss early.
 */
type Tone = "big" | "quiet"

const CONFETTI = ["#C8552B", "#F2A93B", "#E5663C", "#1F8A8A", "#2B2F5E", "#E0857A"]

export function Celebration({
  open,
  tone = "big",
  title,
  subtitle,
  onDone,
  autoMs = 2800,
}: {
  open: boolean
  tone?: Tone
  title: string
  subtitle?: string
  onDone?: () => void
  autoMs?: number
}) {
  useEffect(() => {
    if (!open) return
    const t = setTimeout(() => onDone?.(), autoMs)
    return () => clearTimeout(t)
  }, [open, autoMs, onDone])

  const pieces = useMemo(
    () =>
      Array.from({ length: tone === "big" ? 44 : 0 }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.4,
        dur: 1.7 + Math.random() * 1.3,
        size: 6 + Math.round(Math.random() * 6),
        color: CONFETTI[i % CONFETTI.length],
        round: Math.random() > 0.5,
      })),
    // regenerate per fire
    [open, tone],
  )

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[120] grid place-items-center overflow-hidden"
          style={{ background: "rgba(25,26,44,0.45)", backdropFilter: "blur(2px)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={() => onDone?.()}
          role="status"
          aria-live="polite"
        >
          {/* confetti */}
          {pieces.map((p, i) => (
            <span
              key={i}
              className="pointer-events-none absolute top-0"
              style={{
                left: `${p.left}%`,
                width: p.size,
                height: p.size,
                background: p.color,
                borderRadius: p.round ? "9999px" : "2px",
                animation: `confetti-fall ${p.dur}s linear ${p.delay}s forwards`,
              }}
            />
          ))}

          <div className="relative flex flex-col items-center px-8 text-center">
            {tone === "big" && (
              <motion.div
                className="pointer-events-none absolute overflow-hidden rounded-full"
                style={{ width: 360, height: 360, maskImage: "radial-gradient(circle, #000 55%, transparent 78%)", WebkitMaskImage: "radial-gradient(circle, #000 55%, transparent 78%)" }}
                initial={{ opacity: 0, scale: 0.7, rotate: 0 }}
                animate={{ opacity: 0.5, scale: 1, rotate: 360 }}
                transition={{ opacity: { duration: 0.4 }, scale: { duration: 0.5 }, rotate: { duration: 26, repeat: Infinity, ease: "linear" } }}
              >
                <Image src="/assets/backdrops/backdrop-sunburst.webp" alt="" aria-hidden fill className="scale-150 object-cover" />
              </motion.div>
            )}

            <motion.div
              initial={{ scale: 0.4, rotate: -16, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ type: "spring", damping: 11, stiffness: 200, delay: 0.05 }}
              style={{ width: 96, height: 96 }}
              className="relative drop-shadow-xl"
            >
              <Image src="/assets/seals/seal-yy-wax.webp" alt="" aria-hidden width={96} height={96} />
            </motion.div>

            <motion.h2
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.18, duration: 0.35 }}
              className="relative mt-4 text-[32px] font-extrabold leading-tight tracking-tight"
              style={{ fontFamily: "var(--font-display)", color: "#FFF7EF" }}
            >
              {title}
            </motion.h2>
            {subtitle && (
              <motion.p
                initial={{ y: 8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.26, duration: 0.35 }}
                className="relative mt-1 text-[16px]"
                style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", color: "#F2C99B" }}
              >
                {subtitle}
              </motion.p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

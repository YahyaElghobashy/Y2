"use client"

import { useCallback } from "react"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"

/**
 * Shared riso animation + sound/haptic primitives for the Decide suite.
 * Games (D1–D5) import these so the suite feels cohesive: a warm sunburst
 * flash on a result, a tiny WebAudio blip, an optional haptic tick. All are
 * SSR-safe and fail silent; sound + motion are opt-out (reduced-motion aware).
 */

// ── Sound: tiny WebAudio blips, no asset files ──────────────────────────────

let _ctx: AudioContext | null = null

function audioCtx(): AudioContext | null {
  if (typeof window === "undefined") return null
  try {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    if (!_ctx) _ctx = new Ctor()
    return _ctx
  } catch {
    return null
  }
}

export type DecideSound = "tick" | "spin" | "roll" | "win"

const TONES: Record<DecideSound, { freq: number; dur: number; type: OscillatorType }> = {
  tick: { freq: 660, dur: 0.05, type: "square" },
  spin: { freq: 330, dur: 0.22, type: "sawtooth" },
  roll: { freq: 220, dur: 0.12, type: "triangle" },
  win: { freq: 880, dur: 0.4, type: "sine" },
}

/** Play a one-shot blip. No-op when WebAudio is unavailable. */
export function playDecideSound(name: DecideSound): void {
  const ctx = audioCtx()
  if (!ctx) return
  try {
    if (ctx.state === "suspended") void ctx.resume()
    const { freq, dur, type } = TONES[name]
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0.0001, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + dur + 0.02)
  } catch {
    /* fail silent */
  }
}

/** Hook form — returns a stable `play` gated by an `enabled` flag. */
export function useDecideSound(enabled = true): (name: DecideSound) => void {
  return useCallback(
    (name: DecideSound) => {
      if (enabled) playDecideSound(name)
    },
    [enabled],
  )
}

/** Fire a haptic tick (Android/Chrome). No-op elsewhere. */
export function haptic(pattern: number | number[] = 12): void {
  if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
    try {
      navigator.vibrate(pattern)
    } catch {
      /* fail silent */
    }
  }
}

// ── Motion: the shared "decided!" sunburst flash ────────────────────────────

const hideOnError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  e.currentTarget.style.display = "none"
}

/**
 * RisoBurst — a quick spinning sunburst + soft glow behind a result. Inline
 * (not a full-screen overlay — that's `Celebration`'s job). Honors reduced
 * motion by skipping the spin and just showing the glow.
 */
export function RisoBurst({ active, size = 220 }: { active: boolean; size?: number }) {
  const reduce = useReducedMotion()
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          className="pointer-events-none absolute left-1/2 top-1/2 z-0"
          style={{ width: size, height: size, x: "-50%", y: "-50%" }}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 0.55, scale: 1 }}
          exit={{ opacity: 0, scale: 1.1 }}
          transition={{ duration: 0.4 }}
          aria-hidden
        >
          <motion.div
            className="absolute inset-0 overflow-hidden rounded-full"
            style={{
              maskImage: "radial-gradient(circle, #000 50%, transparent 78%)",
              WebkitMaskImage: "radial-gradient(circle, #000 50%, transparent 78%)",
            }}
            animate={reduce ? undefined : { rotate: 360 }}
            transition={reduce ? undefined : { duration: 18, repeat: Infinity, ease: "linear" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/backdrops/backdrop-sunburst.webp"
              alt=""
              aria-hidden
              onError={hideOnError}
              className="absolute inset-0 h-full w-full scale-150 object-cover"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

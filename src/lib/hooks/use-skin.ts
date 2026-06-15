"use client"

import { useEffect, useState } from "react"

/**
 * Hayah's adaptive, time-aware skin (see docs/DESIGN_BLUEPRINT.md §1.1).
 * Not a dark-mode toggle — the app's ground breathes with the Cairo day:
 *   day (golden) → dusk (lantern-warm) → night (indigo night-drive).
 *
 * This hook sets `data-skin` on <html>. Night token overrides are SCOPED to
 * `.skin-aware` wrappers (see globals.css), so only migrated screens flip at
 * night — un-migrated screens stay in the warm day palette and never look
 * half-broken. Roll night out per-screen by adding `.skin-aware` to a world's
 * root once its colors come from tokens.
 */
export type SkinPhase = "day" | "dusk" | "night"

export function computeSkinPhase(date: Date): SkinPhase {
  const h = date.getHours()
  if (h >= 6 && h < 16) return "day"
  if (h >= 16 && h < 19) return "dusk"
  return "night"
}

export function useSkin(): SkinPhase {
  const [phase, setPhase] = useState<SkinPhase>("day")

  useEffect(() => {
    const apply = () => {
      const next = computeSkinPhase(new Date())
      setPhase(next)
      document.documentElement.dataset.skin = next
    }
    apply()
    // Re-check each minute so the skin turns over at the phase boundaries.
    const id = window.setInterval(apply, 60_000)
    return () => window.clearInterval(id)
  }, [])

  return phase
}

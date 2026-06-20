"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { motion, useReducedMotion } from "framer-motion"
import type { DecideOption, DecideResult, SelectorGame, SelectorGameProps } from "../../contract"
import { weightedPick, winnerSummary } from "../../shared/random"
import { haptic, playDecideSound } from "../../shared/primitives"

/**
 * Spin the Wheel — the real "many" selector for Decide Together (D1).
 *
 * A riso wheel of names: sectors are sized in proportion to each option's
 * `weight` (equal when unweighted) and tinted from the Constitution palette.
 * Picking the winner and landing the wheel on it are split so the visual is
 * always honest: `weightedPick` chooses, then `landingRotation` lands the
 * pointer inside that winner's arc. Pure geometry helpers below carry the
 * correctness and are unit-tested in isolation.
 *
 * Fix vs. the old `components/wheel/SpinTheWheel`: that component gated spinning
 * on `state === "idle"` and never reset out of `"result"`, so it could spin
 * exactly once and then jammed. Here the only guard is `phase === "spinning"`,
 * so the wheel is immediately re-spinnable after a result — "Spin again" (or the
 * centre hub) just keeps the cumulative rotation growing.
 */

// ── Riso sector palette (tokens only — fill + legible text per slice) ─────────

type RisoSector = { fill: string; text: string }

/** Saturated riso slices, ordered for maximal adjacent contrast. */
export const RISO_SECTORS: RisoSector[] = [
  { fill: "var(--color-terracotta)", text: "var(--color-paper)" },
  { fill: "var(--color-amber)", text: "var(--color-ink)" },
  { fill: "var(--color-teal)", text: "var(--color-paper)" },
  { fill: "var(--color-dusty-rose)", text: "var(--color-ink)" },
  { fill: "var(--color-indigo)", text: "var(--color-paper)" },
  { fill: "var(--color-clay)", text: "var(--color-ink)" },
  { fill: "var(--color-coral)", text: "var(--color-paper)" },
]

// ── Pure geometry (exported for unit tests) ───────────────────────────────────

export type Sector = {
  /** Degrees clockwise from the 12-o'clock pointer. */
  start: number
  end: number
  mid: number
  /** Arc width in degrees. */
  arc: number
}

/**
 * Slice the circle into one sector per option, arc-length ∝ weight. Falls back
 * to equal slices when every weight is ≤ 0 (mirrors `weightedPick`).
 */
export function buildSectors(options: DecideOption[]): Sector[] {
  const n = options.length
  if (n === 0) return []
  const weights = options.map((o) => Math.max(0, o.weight ?? 1))
  const total = weights.reduce((s, w) => s + w, 0)
  const fractions = total > 0 ? weights.map((w) => w / total) : weights.map(() => 1 / n)

  const sectors: Sector[] = []
  let cursor = 0
  for (let i = 0; i < n; i++) {
    const arc = fractions[i] * 360
    const start = cursor
    const end = cursor + arc
    sectors.push({ start, end, mid: (start + end) / 2, arc })
    cursor = end
  }
  return sectors
}

/** Cartesian point on a circle for `deg` measured clockwise from the top. */
export function polar(cx: number, cy: number, r: number, deg: number): { x: number; y: number } {
  const rad = (deg * Math.PI) / 180
  return { x: cx + r * Math.sin(rad), y: cy - r * Math.cos(rad) }
}

/** SVG path for a pie sector spanning [startDeg, endDeg] clockwise from top. */
export function sectorPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  // A single full-circle sector can't be drawn as one arc — split into two.
  if (endDeg - startDeg >= 359.999) {
    const mid = startDeg + 180
    return `${sectorPath(cx, cy, r, startDeg, mid)} ${sectorPath(cx, cy, r, mid, endDeg)}`
  }
  const a = polar(cx, cy, r, startDeg)
  const b = polar(cx, cy, r, endDeg)
  const largeArc = endDeg - startDeg > 180 ? 1 : 0
  return `M ${cx} ${cy} L ${a.x} ${a.y} A ${r} ${r} 0 ${largeArc} 1 ${b.x} ${b.y} Z`
}

const MIN_SPINS = 4

/**
 * Cumulative rotation (degrees, clockwise) that lands `winner`'s sector under
 * the top pointer, after at least `MIN_SPINS` full turns past the current
 * resting `rotation`. `rand` (0..1) nudges the landing point within the sector
 * so it never feels mechanically centred — clamped to keep the pointer safely
 * inside the winning arc.
 */
export function landingRotation(rotation: number, winner: Sector, rand = 0.5): number {
  const margin = Math.min(winner.arc * 0.35, 12)
  const jitter = (rand - 0.5) * 2 * margin // ±margin
  const landLocal = ((winner.mid + jitter) % 360 + 360) % 360
  // We need (-target) ≡ landLocal (mod 360) so landLocal sits at the pointer.
  const baseAngle = ((-landLocal) % 360 + 360) % 360
  const currentMod = ((rotation % 360) + 360) % 360
  const forward = ((baseAngle - currentMod) % 360 + 360) % 360
  return rotation + MIN_SPINS * 360 + forward
}

/** Index of the sector currently under the top pointer at the given rotation. */
export function sectorUnderPointer(sectors: Sector[], rotation: number): number {
  if (sectors.length === 0) return -1
  const local = ((-rotation) % 360 + 360) % 360
  for (let i = 0; i < sectors.length; i++) {
    if (local >= sectors[i].start && local < sectors[i].end) return i
  }
  return sectors.length - 1
}

// ── View helpers ──────────────────────────────────────────────────────────────

const SIZE = 300
const CENTER = SIZE / 2
const RADIUS = 138
const LABEL_RADIUS = RADIUS * 0.62
const SPIN_MS = 4000
const OVERSHOOT_DEG = 7

function labelFontSize(n: number): number {
  if (n <= 6) return 13
  if (n <= 9) return 11
  if (n <= 12) return 10
  return 9
}

function truncate(label: string, n: number): string {
  const max = n <= 6 ? 14 : n <= 10 ? 11 : 9
  return label.length > max ? `${label.slice(0, max - 1)}…` : label
}

/**
 * Legible text token for a slice given its fill. Curated riso slices carry
 * their own pairing; for a user-supplied `color` we pick ink/paper from the
 * hex luminance so a light custom fill never gets near-white text. Non-hex
 * (CSS var) custom fills default to ink, the safer choice for light values.
 */
export function sliceTextColor(fill: string): string {
  const m = /^#([0-9a-fA-F]{6})$/.exec(fill.trim())
  if (!m) return "var(--color-ink)"
  const n = parseInt(m[1], 16)
  const lum = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255
  return lum > 0.6 ? "var(--color-ink)" : "var(--color-paper)"
}

type Phase = "idle" | "spinning" | "done"

type WheelProps = SelectorGameProps & {
  /** Injectable RNG for deterministic tests. Defaults to Math.random. */
  rng?: () => number
  /** Spin duration override (ms) for tests. */
  spinMs?: number
}

// ── Component ─────────────────────────────────────────────────────────────────

export function Wheel({ options, onResult, rng = Math.random, spinMs = SPIN_MS }: WheelProps) {
  const reduce = useReducedMotion()

  const playable = useMemo(() => options.filter((o) => o.label.trim().length > 0), [options])
  const sectors = useMemo(() => buildSectors(playable), [playable])

  const [phase, setPhase] = useState<Phase>("idle")
  const [rotation, setRotation] = useState(0)
  const [frames, setFrames] = useState<number[]>([0])
  const [winner, setWinner] = useState<DecideOption | null>(null)

  const rotationRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reportedRef = useRef(false)

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current)
  }, [])

  const reveal = useCallback(
    (won: DecideOption | null) => {
      setWinner(won)
      setPhase("done")
      playDecideSound("win")
      haptic([0, 45, 25, 60])
      // Each spin is its own decision — the hub persists every reported result.
      const result: DecideResult = {
        winner: won,
        summary: winnerSummary(won),
        detail: { tool: "wheel", count: playable.length },
      }
      onResult(result)
    },
    [onResult, playable.length],
  )

  const spin = useCallback(() => {
    if (phase === "spinning" || playable.length === 0) return

    const won = weightedPick(playable, rng)
    if (!won) return
    const idx = playable.indexOf(won)
    const sector = sectors[idx] ?? sectors[0]

    const from = rotationRef.current
    const target = landingRotation(from, sector, rng())
    rotationRef.current = target
    setRotation(target)
    reportedRef.current = false

    playDecideSound("spin")
    haptic(14)

    if (reduce) {
      setFrames([target])
      setPhase("spinning")
      reveal(won)
      reportedRef.current = true
      return
    }

    setFrames([from, target + OVERSHOOT_DEG, target])
    setPhase("spinning")

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      if (reportedRef.current) return
      reportedRef.current = true
      reveal(won)
    }, spinMs)
  }, [phase, playable, sectors, rng, reduce, reveal, spinMs])

  // Tick haptics as the wheel passes slices (skipped under reduced motion).
  useEffect(() => {
    if (phase !== "spinning" || reduce || playable.length === 0) return
    const interval = setInterval(() => haptic(6), Math.max(90, spinMs / (playable.length * 3)))
    return () => clearInterval(interval)
  }, [phase, reduce, playable.length, spinMs])

  const spinning = phase === "spinning"
  const empty = playable.length === 0
  const fontSize = labelFontSize(playable.length)

  return (
    <div className="flex flex-col items-center gap-4 py-1 text-center" data-testid="decide-wheel">
      <div className="relative mx-auto w-full" style={{ maxWidth: 320 }}>
        {/* Pointer — chunky riso wedge biting into the rim at 12 o'clock */}
        <div
          data-testid="wheel-pointer"
          className="absolute start-1/2 top-0 z-20 -translate-x-1/2"
          style={{ marginTop: -2 }}
          aria-hidden
        >
          <svg width="30" height="34" viewBox="0 0 30 34" fill="none">
            <path
              d="M15 31 L3 4 Q15 -2 27 4 Z"
              fill="var(--color-ink)"
              stroke="var(--color-paper)"
              strokeWidth="3"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Wheel — the whole SVG rotates; pointer + hub stay fixed overlays */}
        <motion.svg
          data-testid="wheel-svg"
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          style={{ width: "100%", height: "auto", display: "block" }}
          animate={{ rotate: spinning ? frames : rotation }}
          transition={
            spinning && !reduce
              ? { duration: spinMs / 1000, times: [0, 0.82, 1], ease: ["easeOut", "easeInOut"] }
              : { duration: 0 }
          }
        >
          {/* Outer rim */}
          <circle cx={CENTER} cy={CENTER} r={RADIUS} fill="var(--color-paper)" />
          {sectors.map((s, i) => {
            const opt = playable[i]
            const tone = RISO_SECTORS[i % RISO_SECTORS.length]
            const fill = opt.color ?? tone.fill
            const text = opt.color ? sliceTextColor(opt.color) : tone.text
            const mid = s.mid
            const pos = polar(CENTER, CENTER, LABEL_RADIUS, mid)
            // Radial text, flipped on the left half so it stays upright.
            const flip = mid > 90 && mid < 270
            const rotate = (flip ? mid - 90 + 180 : mid - 90)
            return (
              <g key={opt.id}>
                <path
                  data-testid={`wheel-slice-${i}`}
                  d={sectorPath(CENTER, CENTER, RADIUS, s.start, s.end)}
                  fill={fill}
                  stroke="var(--color-paper)"
                  strokeWidth={2}
                  strokeLinejoin="round"
                />
                <text
                  x={pos.x}
                  y={pos.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  transform={`rotate(${rotate} ${pos.x} ${pos.y})`}
                  fill={text}
                  fontSize={fontSize}
                  fontWeight={700}
                  style={{ fontFamily: "var(--font-nav)", pointerEvents: "none", userSelect: "none" }}
                >
                  {truncate(opt.label, playable.length)}
                </text>
              </g>
            )
          })}
          {/* Rim outline on top of slices for the riso registration edge */}
          <circle cx={CENTER} cy={CENTER} r={RADIUS} fill="none" stroke="var(--color-ink)" strokeWidth={3} />
        </motion.svg>

        {/* Centre hub / spin trigger */}
        <motion.button
          type="button"
          data-testid="decide-game-run"
          onClick={spin}
          disabled={spinning || empty}
          whileTap={spinning || empty ? undefined : { scale: 0.92 }}
          aria-label={phase === "done" ? "Spin again" : "Spin the wheel"}
          className="absolute start-1/2 top-1/2 z-20 grid h-[64px] w-[64px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full text-[12px] font-extrabold uppercase tracking-wider disabled:opacity-60"
          style={{
            background: "var(--color-paper)",
            color: "var(--color-terracotta)",
            border: "3px solid var(--color-ink)",
            fontFamily: "var(--font-nav)",
            boxShadow: "var(--shadow-warm-lg)",
          }}
        >
          {spinning ? "···" : phase === "done" ? "Again" : "Spin"}
        </motion.button>
      </div>

      {/* Winner reveal */}
      {phase === "done" && winner && (
        <motion.div
          data-testid="wheel-winner"
          initial={reduce ? false : { opacity: 0, y: 8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.32, ease: [0.25, 0.1, 0.25, 1] }}
          className="flex flex-col items-center gap-2"
        >
          <span
            className="text-[11px] font-bold uppercase tracking-[0.28em]"
            style={{ fontFamily: "var(--font-nav)", color: "var(--color-ink-soft)" }}
          >
            Winner
          </span>
          <p
            className="text-[28px] font-extrabold leading-none"
            style={{ fontFamily: "var(--font-display)", color: "var(--color-terracotta)" }}
          >
            {winner.label}
          </p>
          <button
            type="button"
            data-testid="wheel-spin-again"
            onClick={spin}
            className="mt-1 rounded-xl px-5 py-2.5 text-[14px] font-bold"
            style={{ background: "var(--color-terracotta)", color: "var(--color-paper)", fontFamily: "var(--font-nav)" }}
          >
            Spin again
          </button>
        </motion.div>
      )}

      {phase === "idle" && (
        <p className="text-[13px]" style={{ fontFamily: "var(--font-body)", color: "var(--color-ink-soft)" }}>
          {empty ? "Add options to spin" : "Tap the wheel to spin"}
        </p>
      )}
    </div>
  )
}

const wheel: SelectorGame = {
  id: "wheel",
  label: "Spin the Wheel",
  arabicLabel: "عجلة الحظ",
  whenToUse: "Several options, all roughly equal — let the wheel land on one.",
  kind: "many",
  asset: "/assets/objects/object-01.png",
  Component: Wheel,
}

export default wheel

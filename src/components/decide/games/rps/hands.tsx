"use client"

import { useId } from "react"
import type { Throw } from "./logic"

/**
 * Riso-poster RPS hands, hand-drawn as flat duotone SVG (no asset files — none
 * ship for gestures). One morphable hand: fingers extend or curl per gesture,
 * so Rock / Paper / Scissors share a body and read as the same printed hand.
 * Constitution treatment: flat accent fill, a misregistered indigo underlay,
 * a faint halftone-dot shade, and a warm ink outline with hand-feel rounding.
 */

type Tone = {
  /** flat fill var, e.g. var(--color-coral) */
  fill: string
  /** misregister underlay var, e.g. var(--color-indigo) */
  shade: string
}

export const SIDE_TONE: Record<"a" | "b", Tone> = {
  a: { fill: "var(--color-coral)", shade: "var(--color-indigo)" },
  b: { fill: "var(--color-teal)", shade: "var(--color-indigo)" },
}

// ── Geometry ────────────────────────────────────────────────────────────────
// Hand points up. Palm is a rounded block; four fingers + a thumb morph by gesture.

const PALM = { x: 24, y: 70, w: 72, h: 58, rx: 22 }

type Finger = { cx: number; w: number; topExtended: number }
// index, middle, ring, pinky — pinky a touch shorter + inset
const FINGERS: Finger[] = [
  { cx: 38, w: 15, topExtended: 26 },
  { cx: 55, w: 16, topExtended: 18 },
  { cx: 72, w: 15, topExtended: 26 },
  { cx: 88, w: 13, topExtended: 40 },
]

const CURL_TOP = 56 // folded fingertip line, sitting on the palm
const PALM_OVERLAP = 10 // fingers tuck into the palm so there's no seam

/** Which finger indices stand up for each gesture (0=index … 3=pinky). */
const EXTENDED: Record<Throw, number[]> = {
  rock: [],
  paper: [0, 1, 2, 3],
  scissors: [0, 1],
}

function fingerRect(f: Finger, extended: boolean) {
  const top = extended ? f.topExtended : CURL_TOP
  const bottom = PALM.y + PALM_OVERLAP
  return { x: f.cx - f.w / 2, y: top, width: f.w, height: bottom - top, rx: f.w / 2 }
}

// Thumb: a tilted capsule on the lower-left. Tucks across for rock/scissors,
// swings out for paper.
function thumbTransform(gesture: Throw): string {
  return gesture === "paper" ? "rotate(-42 30 104)" : "rotate(-14 30 104)"
}

export function RisoHand({
  gesture,
  tone,
  size = 132,
  flip = false,
  dimmed = false,
}: {
  gesture: Throw
  tone: Tone
  size?: number
  /** mirror so the two players' hands face each other */
  flip?: boolean
  dimmed?: boolean
}) {
  const uid = useId().replace(/[:]/g, "")
  const dotId = `riso-dots-${uid}`
  const clipId = `riso-clip-${uid}`

  // Shapes drawn twice: once as the indigo misregister underlay (offset), once
  // as the flat fill on top. A single <g> per layer keeps them in lock-step.
  const Shapes = ({ color, opacity = 1 }: { color: string; opacity?: number }) => (
    <g fill={color} stroke="none" opacity={opacity}>
      <rect x={PALM.x} y={PALM.y} width={PALM.w} height={PALM.h} rx={PALM.rx} />
      <g transform={thumbTransform(gesture)}>
        <rect x={12} y={84} width={20} height={44} rx={10} />
      </g>
      {FINGERS.map((f, i) => {
        const r = fingerRect(f, EXTENDED[gesture].includes(i))
        return <rect key={i} x={r.x} y={r.y} width={r.width} height={r.height} rx={r.rx} />
      })}
    </g>
  )

  // Outline pass — same silhouette, stroked only, for the warm ink edge.
  const Outline = () => (
    <g fill="none" stroke="var(--color-ink)" strokeWidth={3} strokeLinejoin="round" strokeLinecap="round">
      <rect x={PALM.x} y={PALM.y} width={PALM.w} height={PALM.h} rx={PALM.rx} />
      <g transform={thumbTransform(gesture)}>
        <rect x={12} y={84} width={20} height={44} rx={10} />
      </g>
      {FINGERS.map((f, i) => {
        const r = fingerRect(f, EXTENDED[gesture].includes(i))
        return <rect key={i} x={r.x} y={r.y} width={r.width} height={r.height} rx={r.rx} />
      })}
    </g>
  )

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 140"
      role="img"
      aria-label={gesture}
      style={{
        transform: flip ? "scaleX(-1)" : undefined,
        opacity: dimmed ? 0.4 : 1,
        transition: "opacity 0.25s ease",
        overflow: "visible",
      }}
    >
      <defs>
        {/* halftone shade — small dots, masked to the hand, faint print texture */}
        <pattern id={dotId} width="7" height="7" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.4" fill="var(--color-ink)" opacity="0.18" />
        </pattern>
        <clipPath id={clipId}>
          <rect x={PALM.x} y={PALM.y} width={PALM.w} height={PALM.h} rx={PALM.rx} />
          {FINGERS.map((f, i) => {
            const r = fingerRect(f, EXTENDED[gesture].includes(i))
            return <rect key={i} x={r.x} y={r.y} width={r.width} height={r.height} rx={r.rx} />
          })}
        </clipPath>
      </defs>

      {/* misregistered indigo underlay (offset down-right) */}
      <g transform="translate(3.5 4)">
        <Shapes color={tone.shade} opacity={0.55} />
      </g>
      {/* flat accent fill */}
      <Shapes color={tone.fill} />
      {/* halftone shade, clipped to the hand, weighted to the lower palm */}
      <g clipPath={`url(#${clipId})`}>
        <rect x="0" y="74" width="120" height="66" fill={`url(#${dotId})`} />
      </g>
      <Outline />
    </svg>
  )
}

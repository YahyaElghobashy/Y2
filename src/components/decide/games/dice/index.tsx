"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { motion, useReducedMotion } from "framer-motion"
import type { DecideOption, DecideResult, SelectorGame, SelectorGameProps } from "../../contract"
import { weightedPick, winnerSummary } from "../../shared/random"
import { haptic, playDecideSound, RisoBurst } from "../../shared/primitives"

/**
 * Roll the Dice — a riso, flat-faced d6 that tumbles, bounces to a settle, and
 * maps the rolled value(s) onto the option list. Supports a 1-die and a 2-dice
 * mode. The pick is decided FAIRLY first (weighted), then we choose a real roll
 * whose modulo-mapping lands on that pick — so the dice the user sees always
 * correspond to the option that wins (no sleight of hand). With no options it
 * is a plain dice roll and just reports the number.
 *
 * Timing is driven by timers (not framer callbacks) so it behaves identically
 * under reduced motion and in tests where framer-motion is mocked away.
 */

// ── Pure roll logic (exported, rng-injectable → fully unit-testable) ─────────

export type DiceCount = 1 | 2

export type RollOutcome = {
  /** The settled face value of each die, length === count, each in 1..6. */
  dice: number[]
  /** Sum of the dice. */
  total: number
  /** Index of the chosen option, or null when there were no options. */
  index: number | null
  /** The chosen option, or null when there were no options. */
  winner: DecideOption | null
}

/** Roll one fair d6 → 1..6. */
export function rollFace(rng: () => number = Math.random): number {
  return 1 + Math.floor(rng() * 6)
}

/**
 * Map a dice total onto an option index for a list of `n` options.
 *   1 die  → (total - 1) mod n   (total ∈ 1..6  → base 0..5)
 *   2 dice → (total - 2) mod n   (total ∈ 2..12 → base 0..10)
 * Returns -1 when there are no options.
 */
export function mapIndex(total: number, count: DiceCount, n: number): number {
  if (n <= 0) return -1
  const base = count === 1 ? total - 1 : total - 2
  return ((base % n) + n) % n
}

/** Every possible roll for a die count, as face arrays (used to back-solve faces). */
function allRolls(count: DiceCount): number[][] {
  if (count === 1) return [1, 2, 3, 4, 5, 6].map((a) => [a])
  const rolls: number[][] = []
  for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) rolls.push([a, b])
  return rolls
}

const sum = (dice: number[]) => dice.reduce((s, d) => s + d, 0)

/**
 * Resolve a roll for the given options + die count.
 *
 * Fairness-first: pick the winner with `weightedPick` (respects weights), then
 * choose, at random, a real roll whose mapping lands on that winner — so the
 * faces shown always equal the option revealed. If the winner's index can't be
 * represented by this die count (e.g. >6 options on a single d6), we fall back
 * to a display-driven roll and derive the winner from the faces, keeping dice
 * and reveal consistent.
 */
export function resolveRoll(
  options: DecideOption[],
  count: DiceCount,
  rng: () => number = Math.random,
): RollOutcome {
  const n = options.length

  // No options → just a plain roll, no winner.
  const winner = weightedPick(options, rng)
  if (!winner || n === 0) {
    const dice = Array.from({ length: count }, () => rollFace(rng))
    return { dice, total: sum(dice), index: null, winner: null }
  }

  const target = options.indexOf(winner)
  const candidates = allRolls(count).filter((roll) => mapIndex(sum(roll), count, n) === target)

  if (candidates.length === 0) {
    // Winner unrepresentable for this die count → let the dice drive the pick.
    const dice = Array.from({ length: count }, () => rollFace(rng))
    const total = sum(dice)
    const index = mapIndex(total, count, n)
    return { dice, total, index, winner: options[index] ?? null }
  }

  const dice = candidates[Math.floor(rng() * candidates.length)] ?? candidates[0]
  return { dice, total: sum(dice), index: target, winner }
}

// ── Riso die face ────────────────────────────────────────────────────────────

/** Pip positions on a 3×3 grid (0..8, row-major) for each face value. */
const PIPS: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
}

function DieFace({ value, faceColor, pipColor }: { value: number; faceColor: string; pipColor: string }) {
  const on = new Set(PIPS[value] ?? PIPS[1])
  return (
    <div
      className="grid h-full w-full grid-cols-3 grid-rows-3 rounded-[22%] p-[15%]"
      style={{ background: faceColor }}
      aria-hidden
    >
      {Array.from({ length: 9 }, (_, i) => (
        <span key={i} className="flex items-center justify-center">
          {on.has(i) && (
            <span
              className="block rounded-full"
              style={{ width: "62%", aspectRatio: "1 / 1", background: pipColor }}
            />
          )}
        </span>
      ))}
    </div>
  )
}

type DieTheme = { face: string; pip: string; offset: string }

const DIE_THEMES: DieTheme[] = [
  { face: "var(--color-amber)", pip: "var(--color-ink)", offset: "var(--color-terracotta)" },
  { face: "var(--color-teal)", pip: "var(--color-paper)", offset: "var(--color-indigo)" },
]

type Phase = "idle" | "rolling" | "settled"

function Die({
  value,
  phase,
  theme,
  size,
  reduce,
  delay,
}: {
  value: number
  phase: Phase
  theme: DieTheme
  size: number
  reduce: boolean
  delay: number
}) {
  const rolling = phase === "rolling"
  return (
    <motion.div
      data-testid="die"
      data-face={value}
      data-phase={phase}
      style={{
        width: size,
        height: size,
        borderRadius: "22%",
        border: "1.5px solid var(--color-ink)",
        boxShadow: `4px 4px 0 0 ${theme.offset}`,
      }}
      animate={
        reduce
          ? { rotate: 0, y: 0 }
          : rolling
            ? { rotate: [0, 360, 760, 1140, 1480], y: [0, -30, 6, -16, 0] }
            : { rotate: 0, y: 0, scale: [1, 1.16, 0.94, 1] }
      }
      transition={
        rolling
          ? { duration: ROLL_MS / 1000, ease: "easeInOut", times: [0, 0.25, 0.5, 0.75, 1], delay }
          : { type: "spring", stiffness: 280, damping: 13 }
      }
    >
      <DieFace value={value} faceColor={theme.face} pipColor={theme.pip} />
    </motion.div>
  )
}

// ── Timings (ms) ──────────────────────────────────────────────────────────────

const ROLL_MS = 1300
const REVEAL_MS = 700
const CYCLE_MS = 90
const REDUCED_ROLL_MS = 220
const REDUCED_REVEAL_MS = 260

// ── Component ─────────────────────────────────────────────────────────────────

function RollTheDice({ options, onResult }: SelectorGameProps) {
  const reduce = useReducedMotion() ?? false
  const [count, setCount] = useState<DiceCount>(1)
  const [phase, setPhase] = useState<Phase>("idle")
  const [faces, setFaces] = useState<number[]>(() => [1])
  const [outcome, setOutcome] = useState<RollOutcome | null>(null)

  // All pending timers, cleared on unmount and before each fresh roll.
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const interval = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []
    if (interval.current !== null) {
      clearInterval(interval.current)
      interval.current = null
    }
  }, [])

  useEffect(() => clearTimers, [clearTimers])

  // Reset displayed faces when switching die count (only while idle).
  useEffect(() => {
    if (phase === "idle") setFaces(Array.from({ length: count }, () => 1))
  }, [count, phase])

  const roll = useCallback(() => {
    if (phase === "rolling") return
    clearTimers()
    const next = resolveRoll(options, count)
    setOutcome(next)
    setPhase("rolling")
    playDecideSound("roll")
    haptic([6, 24, 6])

    const rollMs = reduce ? REDUCED_ROLL_MS : ROLL_MS
    const revealMs = reduce ? REDUCED_REVEAL_MS : REVEAL_MS

    // Flicker random faces while tumbling (skipped under reduced motion).
    if (!reduce) {
      interval.current = setInterval(() => {
        setFaces(Array.from({ length: count }, () => rollFace()))
      }, CYCLE_MS)
    }

    // Settle: snap to the real faces, bounce, sound + haptic.
    timers.current.push(
      setTimeout(() => {
        if (interval.current !== null) {
          clearInterval(interval.current)
          interval.current = null
        }
        setFaces(next.dice)
        setPhase("settled")
        playDecideSound("win")
        haptic(18)
      }, rollMs),
    )

    // Reveal beat, then hand the outcome to the hub (which shows the Result panel).
    timers.current.push(
      setTimeout(() => {
        const result: DecideResult = {
          winner: next.winner,
          summary: next.winner ? winnerSummary(next.winner) : `Rolled ${next.total}`,
          detail: {
            tool: "dice",
            mode: count === 1 ? "single" : "pair",
            dice: next.dice,
            total: next.total,
            index: next.index,
          },
        }
        onResult(result)
      }, rollMs + revealMs),
    )
  }, [phase, options, count, reduce, clearTimers, onResult])

  const dieSize = count === 1 ? 92 : 76
  const revealText = outcome?.winner ? outcome.winner.label : outcome ? `Rolled ${outcome.total}` : ""

  return (
    <div className="flex flex-col items-center gap-5 py-2 text-center">
      {/* Mode toggle */}
      <div
        className="inline-flex rounded-full p-1"
        style={{ background: "var(--color-sand)" }}
        role="radiogroup"
        aria-label="Number of dice"
      >
        {([1, 2] as DiceCount[]).map((c) => {
          const selected = count === c
          return (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={phase === "rolling"}
              onClick={() => setCount(c)}
              className="rounded-full px-4 py-1.5 text-[13px] font-bold transition-opacity disabled:opacity-50"
              style={{
                background: selected ? "var(--color-indigo)" : "transparent",
                color: selected ? "var(--color-paper)" : "var(--color-ink-soft)",
                fontFamily: "var(--font-nav)",
              }}
              data-testid={`dice-mode-${c}`}
            >
              {c === 1 ? "1 die" : "2 dice"}
            </button>
          )
        })}
      </div>

      {/* Dice stage */}
      <div className="relative flex min-h-[120px] items-center justify-center">
        <RisoBurst active={phase === "settled"} size={200} />
        <div className="relative z-10 flex items-center gap-4">
          {faces.map((value, i) => (
            <Die
              key={i}
              value={value}
              phase={phase}
              theme={DIE_THEMES[i % DIE_THEMES.length]}
              size={dieSize}
              reduce={reduce}
              delay={i * 0.06}
            />
          ))}
        </div>
      </div>

      {/* Settle reveal (brief — the hub's Result panel does the full reveal) */}
      <div className="min-h-[34px]">
        {phase === "settled" && revealText && (
          <motion.p
            initial={{ y: 6, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.28 }}
            className="text-[20px] font-extrabold"
            style={{ fontFamily: "var(--font-display)", color: "var(--color-indigo)" }}
            data-testid="dice-reveal"
          >
            {revealText}
          </motion.p>
        )}
      </div>

      <motion.button
        type="button"
        onClick={roll}
        disabled={phase === "rolling"}
        whileTap={{ scale: 0.96 }}
        className="rounded-xl px-7 py-3 text-[15px] font-bold disabled:opacity-50"
        style={{ background: "var(--color-indigo)", color: "var(--color-paper)", fontFamily: "var(--font-nav)" }}
        data-testid="decide-game-run"
      >
        {phase === "rolling" ? "Rolling…" : count === 1 ? "Roll" : "Roll both"}
      </motion.button>
    </div>
  )
}

const dice: SelectorGame = {
  id: "dice",
  label: "Roll the Dice",
  arabicLabel: "النرد",
  whenToUse: "Quick and breezy — leave a small call to chance.",
  kind: "playful",
  asset: "/assets/objects/object-02.png",
  Component: RollTheDice,
}

export default dice

"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import { ArrowRight, Check, RotateCcw, Swords, Trophy } from "lucide-react"
import type { DecideOption, DecideResult, SelectorGame, SelectorGameProps } from "../../contract"
import { winnerSummary } from "../../shared/random"
import { haptic, useDecideSound, RisoBurst } from "../../shared/primitives"
import {
  BEST_OF_OPTIONS,
  resolveThrow,
  throwHeadline,
  matchWinner,
  winsNeeded,
  THROWS,
  THROW_LABEL,
  type RoundWinner,
  type Throw,
} from "./logic"
import { RisoHand, SIDE_TONE } from "./hands"

/**
 * Rock Paper Scissors — a two-player, pass-and-reveal tiebreaker for one phone.
 *
 * Flow: set the stakes (bind each option to a side + name the wager + pick a
 * best-of-N) → Player A picks hidden → hand over → Player B picks hidden →
 * animated 3·2·1 shoot → reveal both hands, score the round, ties replay →
 * first to the majority takes the match, mapping the winning side back to its
 * bound `DecideOption`. Emits `onResult` exactly once, when the verdict is read.
 */

type Stage = "setup" | "pickA" | "pass" | "pickB" | "shoot"
type RoundLog = { a: Throw; b: Throw; winner: RoundWinner }

const PAPER = "var(--primary-foreground)" // warm off-white for text on accents
const BEAT_MS = { full: 560, reduced: 220 }
const FLASH_MS = { full: 360, reduced: 160 }

function findOption(options: DecideOption[], id: string | null): DecideOption | undefined {
  return options.find((o) => o.id === id)
}

// ── Small shared bits ───────────────────────────────────────────────────────

function PillButton({
  onClick,
  children,
  bg = "var(--color-terracotta)",
  fg = PAPER,
  testId,
  disabled,
}: {
  onClick: () => void
  children: React.ReactNode
  bg?: string
  fg?: string
  testId?: string
  disabled?: boolean
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileTap={{ scale: 0.96 }}
      className="flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-[15px] font-bold disabled:opacity-40"
      style={{ background: bg, color: fg, fontFamily: "var(--font-nav)" }}
      data-testid={testId}
    >
      {children}
    </motion.button>
  )
}

/** The three hand choices, shown to whichever player is picking. */
function ThrowChooser({ side, onPick }: { side: "a" | "b"; onPick: (t: Throw) => void }) {
  const tone = SIDE_TONE[side]
  return (
    <div className="grid grid-cols-3 gap-2">
      {THROWS.map((t) => (
        <motion.button
          key={t}
          type="button"
          onClick={() => onPick(t)}
          whileTap={{ scale: 0.93 }}
          whileHover={{ y: -3 }}
          className="flex flex-col items-center gap-1 rounded-2xl border px-1 py-3"
          style={{ borderColor: "var(--border)", background: "var(--color-paper)" }}
          data-testid={`rps-pick-${t}`}
        >
          <RisoHand gesture={t} tone={tone} size={72} />
          <span
            className="text-[13px] font-bold"
            style={{ fontFamily: "var(--font-nav)", color: "var(--color-ink)" }}
          >
            {THROW_LABEL[t]}
          </span>
        </motion.button>
      ))}
    </div>
  )
}

/** Score pips for one side — filled up to `score`, out of `need`. */
function ScorePips({ score, need, color }: { score: number; need: number; color: string }) {
  return (
    <div className="flex items-center gap-1" aria-hidden>
      {Array.from({ length: need }).map((_, i) => (
        <span
          key={i}
          className="h-2.5 w-2.5 rounded-full"
          style={{ background: i < score ? color : "var(--color-clay)" }}
        />
      ))}
    </div>
  )
}

// ── The game ────────────────────────────────────────────────────────────────

function RockPaperScissors({ options, onResult }: SelectorGameProps) {
  const reduced = useReducedMotion()
  const play = useDecideSound(true)

  // ── Stakes / roles ──
  const [nameA, setNameA] = useState("Player A")
  const [nameB, setNameB] = useState("Player B")
  const [optionAId, setOptionAId] = useState(options[0]?.id ?? "")
  const [optionBId, setOptionBId] = useState(options[1]?.id ?? options[0]?.id ?? "")
  const [stake, setStake] = useState("")
  const [bestOf, setBestOf] = useState(3)

  // ── Match state ──
  const [stage, setStage] = useState<Stage>("setup")
  const [round, setRound] = useState(1)
  const [scoreA, setScoreA] = useState(0)
  const [scoreB, setScoreB] = useState(0)
  const [choiceA, setChoiceA] = useState<Throw | null>(null)
  const [choiceB, setChoiceB] = useState<Throw | null>(null)
  const [history, setHistory] = useState<RoundLog[]>([])

  // ── Throw-off / reveal ──
  const [throwSeq, setThrowSeq] = useState(0)
  const [count, setCount] = useState(3) // 3·2·1 → 0 = "shoot"
  const [revealed, setRevealed] = useState(false)
  const [roundWinner, setRoundWinner] = useState<RoundWinner>(null)

  const appliedRef = useRef(-1)
  const resultSentRef = useRef(false)

  const need = winsNeeded(bestOf)
  const optionA = findOption(options, optionAId)
  const optionB = findOption(options, optionBId)
  const matchOver = matchWinner(scoreA, scoreB, bestOf) !== null
  const ready = Boolean(optionA && optionB)

  // Countdown + reveal, re-armed every throw-off via `throwSeq`.
  useEffect(() => {
    if (stage !== "shoot") return
    if (appliedRef.current === throwSeq) return
    const a = choiceA
    const b = choiceB
    if (!a || !b) return

    const beat = reduced ? BEAT_MS.reduced : BEAT_MS.full
    const flash = reduced ? FLASH_MS.reduced : FLASH_MS.full
    const timers: ReturnType<typeof setTimeout>[] = []

    setCount(3)
    play("roll")
    haptic(10)
    timers.push(setTimeout(() => { setCount(2); play("roll"); haptic(10) }, beat))
    timers.push(setTimeout(() => { setCount(1); play("roll"); haptic(10) }, beat * 2))
    timers.push(setTimeout(() => { setCount(0); play("win"); haptic([30, 20, 40]) }, beat * 3))
    timers.push(
      setTimeout(() => {
        appliedRef.current = throwSeq
        const w = resolveThrow(a, b)
        setRoundWinner(w)
        if (w === "a") setScoreA((s) => s + 1)
        if (w === "b") setScoreB((s) => s + 1)
        setHistory((h) => [...h, { a, b, winner: w }])
        setRevealed(true)
      }, beat * 3 + flash),
    )
    return () => timers.forEach(clearTimeout)
    // choiceA/B are frozen for this throwSeq; re-arming is driven by throwSeq only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [throwSeq, stage])

  // ── Transitions ──
  const startMatch = useCallback(() => {
    if (!ready) return
    setRound(1)
    setScoreA(0)
    setScoreB(0)
    setHistory([])
    setChoiceA(null)
    setChoiceB(null)
    setRevealed(false)
    resultSentRef.current = false
    appliedRef.current = -1
    play("tick")
    setStage("pickA")
  }, [ready, play])

  const pickA = useCallback((t: Throw) => {
    setChoiceA(t)
    play("tick")
    haptic(14)
    setStage("pass")
  }, [play])

  const pickB = useCallback((t: Throw) => {
    setChoiceB(t)
    play("tick")
    haptic(14)
    setRevealed(false)
    setStage("shoot")
    setThrowSeq((n) => n + 1)
  }, [play])

  const nextRound = useCallback(() => {
    setChoiceA(null)
    setChoiceB(null)
    setRoundWinner(null)
    setRevealed(false)
    setRound((r) => r + 1)
    setStage("pickA")
  }, [])

  // Tie: replay the SAME round (no score, no round bump).
  const replayTie = useCallback(() => {
    setChoiceA(null)
    setChoiceB(null)
    setRoundWinner(null)
    setRevealed(false)
    setStage("pickA")
  }, [])

  const sideToOption = useCallback(
    (side: "a" | "b"): DecideOption | undefined => (side === "a" ? optionA : optionB),
    [optionA, optionB],
  )

  const readVerdict = useCallback(() => {
    if (resultSentRef.current) return
    const winSide = matchWinner(scoreA, scoreB, bestOf)
    if (!winSide) return
    const winnerOption = sideToOption(winSide) ?? null
    const winnerName = winSide === "a" ? nameA : nameB
    const [hi, lo] = winSide === "a" ? [scoreA, scoreB] : [scoreB, scoreA]
    const stakeLine = stake.trim() ? ` — ${stake.trim()}` : ""
    const result: DecideResult = {
      winner: winnerOption,
      summary: `${winnerSummary(winnerOption)} · ${winnerName} took it ${hi}–${lo}${stakeLine}`,
      detail: {
        tool: "rps",
        bestOf,
        winnerSide: winSide,
        scoreA,
        scoreB,
        players: { a: nameA, b: nameB },
        stake: stake.trim() || null,
        rounds: history.map((r) => ({ a: r.a, b: r.b, winner: r.winner })),
      },
    }
    resultSentRef.current = true
    onResult(result)
  }, [scoreA, scoreB, bestOf, sideToOption, nameA, nameB, stake, history, onResult])

  // ── Guard: hub guarantees ≥2 options, but stay graceful. ──
  if (options.length < 2) {
    return (
      <p className="py-6 text-center text-[14px]" style={{ fontFamily: "var(--font-body)", color: "var(--color-ink-soft)" }}>
        Add two options to play Rock Paper Scissors.
      </p>
    )
  }

  // ── Render ──
  return (
    <div className="flex flex-col gap-4 py-1">
      {stage === "setup" && (
        <SetupStep
          options={options}
          nameA={nameA}
          nameB={nameB}
          optionAId={optionAId}
          optionBId={optionBId}
          stake={stake}
          bestOf={bestOf}
          onNameA={setNameA}
          onNameB={setNameB}
          onOptionA={setOptionAId}
          onOptionB={setOptionBId}
          onStake={setStake}
          onBestOf={setBestOf}
          onStart={startMatch}
          canStart={ready}
        />
      )}

      {stage !== "setup" && (
        <>
          {/* Scoreboard */}
          <div className="flex items-center justify-between rounded-2xl border px-4 py-2.5"
            style={{ borderColor: "var(--border)", background: "var(--color-sand)" }}>
            <SideBadge name={nameA} option={optionA} score={scoreA} need={need} color="var(--color-coral)" />
            <div className="flex flex-col items-center px-2">
              <span className="text-[11px] font-bold uppercase tracking-wider"
                style={{ fontFamily: "var(--font-nav)", color: "var(--color-ink-soft)" }}>
                Best of {bestOf}
              </span>
              <span className="text-[12px] font-semibold" style={{ fontFamily: "var(--font-nav)", color: "var(--color-ink-soft)" }}>
                Round {round}
              </span>
            </div>
            <SideBadge name={nameB} option={optionB} score={scoreB} need={need} color="var(--color-teal)" alignEnd />
          </div>

          {stake.trim() && (
            <p className="text-center text-[13px]" style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", color: "var(--color-ink-soft)" }}>
              On the line: {stake.trim()}
            </p>
          )}

          {/* Hidden-pick: Player A */}
          {stage === "pickA" && (
            <PickStep
              title={`${nameA}, choose in secret`}
              hint={`${nameB}, look away`}
              side="a"
              onPick={pickA}
            />
          )}

          {/* Handoff */}
          {stage === "pass" && (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <span className="grid h-14 w-14 place-items-center rounded-full"
                style={{ background: "var(--color-coral)", color: PAPER }}>
                <Check size={26} strokeWidth={2.5} />
              </span>
              <p className="text-[20px] font-extrabold" style={{ fontFamily: "var(--font-display)", color: "var(--color-ink)" }}>
                Locked in
              </p>
              <p className="text-[14px]" style={{ fontFamily: "var(--font-body)", color: "var(--color-ink-soft)" }}>
                Pass the phone to {nameB}.
              </p>
              <PillButton onClick={() => setStage("pickB")} bg="var(--color-teal)" testId="rps-pass-continue">
                I&apos;m {nameB} <ArrowRight size={18} strokeWidth={2.25} />
              </PillButton>
            </div>
          )}

          {/* Hidden-pick: Player B */}
          {stage === "pickB" && (
            <PickStep
              title={`${nameB}, choose in secret`}
              hint="Then reveal the throw"
              side="b"
              onPick={pickB}
            />
          )}

          {/* Shoot + reveal */}
          {stage === "shoot" && (
            <ThrowOff
              choiceA={choiceA}
              choiceB={choiceB}
              count={count}
              revealed={revealed}
              roundWinner={roundWinner}
              reduced={Boolean(reduced)}
            />
          )}

          {/* Post-reveal controls */}
          {stage === "shoot" && revealed && (
            <div className="flex flex-col items-center gap-2" data-testid="rps-reveal-controls">
              {roundWinner === null ? (
                <PillButton onClick={replayTie} bg="var(--color-amber)" fg="var(--color-ink)" testId="rps-again">
                  <RotateCcw size={18} strokeWidth={2.25} /> Tie — throw again
                </PillButton>
              ) : matchOver ? (
                <PillButton onClick={readVerdict} bg="var(--color-terracotta)" testId="rps-verdict">
                  <Trophy size={18} strokeWidth={2.25} /> See the verdict
                </PillButton>
              ) : (
                <PillButton onClick={nextRound} bg="var(--color-teal)" testId="rps-next">
                  Next round <ArrowRight size={18} strokeWidth={2.25} />
                </PillButton>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ── Sub-steps ───────────────────────────────────────────────────────────────

function SideBadge({
  name,
  option,
  score,
  need,
  color,
  alignEnd,
}: {
  name: string
  option?: DecideOption
  score: number
  need: number
  color: string
  alignEnd?: boolean
}) {
  return (
    <div className={`flex flex-col gap-1 ${alignEnd ? "items-end text-right" : "items-start text-left"}`}>
      <span className="max-w-[12ch] truncate text-[13px] font-extrabold" style={{ fontFamily: "var(--font-nav)", color }}>
        {name}
      </span>
      {option && (
        <span className="max-w-[14ch] truncate text-[12px]" style={{ fontFamily: "var(--font-body)", color: "var(--color-ink-soft)" }}>
          for {option.label}
        </span>
      )}
      <ScorePips score={score} need={need} color={color} />
    </div>
  )
}

function PickStep({
  title,
  hint,
  side,
  onPick,
}: {
  title: string
  hint: string
  side: "a" | "b"
  onPick: (t: Throw) => void
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="text-center">
        <p className="text-[18px] font-extrabold" style={{ fontFamily: "var(--font-display)", color: "var(--color-ink)" }}>
          {title}
        </p>
        <p className="text-[13px]" style={{ fontFamily: "var(--font-body)", color: "var(--color-ink-soft)" }}>
          {hint}
        </p>
      </div>
      <ThrowChooser side={side} onPick={onPick} />
    </div>
  )
}

function ThrowOff({
  choiceA,
  choiceB,
  count,
  revealed,
  roundWinner,
  reduced,
}: {
  choiceA: Throw | null
  choiceB: Throw | null
  count: number
  revealed: boolean
  roundWinner: RoundWinner
  reduced: boolean
}) {
  const shake = !reduced && !revealed
  const dimA = revealed && roundWinner === "b"
  const dimB = revealed && roundWinner === "a"

  // Until revealed, both show closed fists ("rock") shaking on the beat.
  const shownA: Throw = revealed && choiceA ? choiceA : "rock"
  const shownB: Throw = revealed && choiceB ? choiceB : "rock"

  return (
    <div className="relative flex flex-col items-center gap-3 py-2">
      <div className="relative flex w-full items-center justify-center gap-3">
        <motion.div
          animate={shake ? { y: [0, -16, 0] } : { y: 0 }}
          transition={shake ? { duration: 0.5, repeat: Infinity, ease: "easeInOut" } : { duration: 0.2 }}
        >
          <RisoHand gesture={shownA} tone={SIDE_TONE.a} size={120} flip dimmed={dimA} />
        </motion.div>

        {/* Center: countdown number → "VS" on reveal */}
        <div className="grid w-14 shrink-0 place-items-center">
          <AnimatePresence mode="popLayout">
            {!revealed ? (
              <motion.span
                key={count}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.6, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="text-[34px] font-black leading-none"
                style={{ fontFamily: "var(--font-display)", color: "var(--color-terracotta)" }}
                data-testid="rps-count"
              >
                {count === 0 ? "!" : count}
              </motion.span>
            ) : (
              <motion.span
                key="vs"
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-[15px] font-black"
                style={{ fontFamily: "var(--font-nav)", color: "var(--color-ink-soft)" }}
              >
                VS
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <motion.div
          animate={shake ? { y: [0, -16, 0] } : { y: 0 }}
          transition={shake ? { duration: 0.5, repeat: Infinity, ease: "easeInOut", delay: 0.08 } : { duration: 0.2 }}
        >
          <RisoHand gesture={shownB} tone={SIDE_TONE.b} size={120} dimmed={dimB} />
        </motion.div>

        <RisoBurst active={revealed && roundWinner !== null} size={240} />
      </div>

      {revealed && choiceA && choiceB && (
        <motion.div
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center"
          data-testid="rps-headline"
        >
          <p className="text-[20px] font-extrabold" style={{ fontFamily: "var(--font-display)", color: "var(--color-ink)" }}>
            {roundWinner === null ? "It's a tie" : throwHeadline(choiceA, choiceB)}
          </p>
        </motion.div>
      )}
    </div>
  )
}

function SetupStep({
  options,
  nameA,
  nameB,
  optionAId,
  optionBId,
  stake,
  bestOf,
  onNameA,
  onNameB,
  onOptionA,
  onOptionB,
  onStake,
  onBestOf,
  onStart,
  canStart,
}: {
  options: DecideOption[]
  nameA: string
  nameB: string
  optionAId: string
  optionBId: string
  stake: string
  bestOf: number
  onNameA: (v: string) => void
  onNameB: (v: string) => void
  onOptionA: (v: string) => void
  onOptionB: (v: string) => void
  onStake: (v: string) => void
  onBestOf: (v: number) => void
  onStart: () => void
  canStart: boolean
}) {
  return (
    <div className="flex flex-col gap-4" data-testid="rps-setup">
      <div className="flex items-center gap-2">
        <Swords size={18} strokeWidth={2.25} style={{ color: "var(--color-terracotta)" }} />
        <p className="text-[15px] font-extrabold" style={{ fontFamily: "var(--font-display)", color: "var(--color-ink)" }}>
          Set the stakes
        </p>
      </div>

      <SideSetup
        label="Side 1"
        color="var(--color-coral)"
        name={nameA}
        optionId={optionAId}
        options={options}
        onName={onNameA}
        onOption={onOptionA}
        nameTestId="rps-name-a"
        bindTestId="rps-bind-a"
      />
      <SideSetup
        label="Side 2"
        color="var(--color-teal)"
        name={nameB}
        optionId={optionBId}
        options={options}
        onName={onNameB}
        onOption={onOptionB}
        nameTestId="rps-name-b"
        bindTestId="rps-bind-b"
      />

      <label className="flex flex-col gap-1.5">
        <span className="text-[12px] font-bold uppercase tracking-wider" style={{ fontFamily: "var(--font-nav)", color: "var(--color-ink-soft)" }}>
          What&apos;s on the line? (optional)
        </span>
        <input
          value={stake}
          onChange={(e) => onStake(e.target.value)}
          placeholder="loser does the dishes"
          className="rounded-xl border px-3 py-2.5 text-[14px] outline-none"
          style={{ borderColor: "var(--border)", background: "var(--color-paper)", color: "var(--color-ink)", fontFamily: "var(--font-body)" }}
          data-testid="rps-stake"
        />
      </label>

      <div className="flex flex-col gap-1.5">
        <span className="text-[12px] font-bold uppercase tracking-wider" style={{ fontFamily: "var(--font-nav)", color: "var(--color-ink-soft)" }}>
          Match length
        </span>
        <div className="grid grid-cols-3 gap-2">
          {BEST_OF_OPTIONS.map((n) => {
            const active = bestOf === n
            return (
              <button
                key={n}
                type="button"
                onClick={() => onBestOf(n)}
                aria-pressed={active}
                className="rounded-xl border py-2.5 text-[14px] font-bold"
                style={{
                  borderColor: active ? "var(--color-terracotta)" : "var(--border)",
                  background: active ? "var(--color-terracotta)" : "var(--color-paper)",
                  color: active ? PAPER : "var(--color-ink)",
                  fontFamily: "var(--font-nav)",
                }}
                data-testid={`rps-bestof-${n}`}
              >
                Best of {n}
              </button>
            )
          })}
        </div>
      </div>

      <PillButton onClick={onStart} disabled={!canStart} bg="var(--color-terracotta)" testId="rps-start">
        <Swords size={18} strokeWidth={2.25} /> Start the match
      </PillButton>
    </div>
  )
}

function SideSetup({
  label,
  color,
  name,
  optionId,
  options,
  onName,
  onOption,
  nameTestId,
  bindTestId,
}: {
  label: string
  color: string
  name: string
  optionId: string
  options: DecideOption[]
  onName: (v: string) => void
  onOption: (v: string) => void
  nameTestId: string
  bindTestId: string
}) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border p-3" style={{ borderColor: "var(--border)", background: "var(--color-sand)" }}>
      <span className="text-[11px] font-bold uppercase tracking-wider" style={{ fontFamily: "var(--font-nav)", color }}>
        {label}
      </span>
      <input
        value={name}
        onChange={(e) => onName(e.target.value)}
        className="rounded-xl border px-3 py-2 text-[14px] font-semibold outline-none"
        style={{ borderColor: "var(--border)", background: "var(--color-paper)", color: "var(--color-ink)", fontFamily: "var(--font-nav)" }}
        aria-label={`${label} name`}
        data-testid={nameTestId}
      />
      <label className="flex items-center gap-2">
        <span className="text-[13px]" style={{ fontFamily: "var(--font-body)", color: "var(--color-ink-soft)" }}>
          plays for
        </span>
        <select
          value={optionId}
          onChange={(e) => onOption(e.target.value)}
          className="min-w-0 flex-1 rounded-xl border px-2 py-2 text-[14px] font-semibold outline-none"
          style={{ borderColor: "var(--border)", background: "var(--color-paper)", color: "var(--color-ink)", fontFamily: "var(--font-body)" }}
          aria-label={`${label} option`}
          data-testid={bindTestId}
        >
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}

// ── Suite export ────────────────────────────────────────────────────────────

const rps: SelectorGame = {
  id: "rps",
  label: "Rock Paper Scissors",
  arabicLabel: "حجر ورقة مقص",
  whenToUse: "Just the two of you, one pick — settle it hand to hand.",
  kind: "binary",
  asset: "/assets/objects/object-03.png",
  Component: RockPaperScissors,
}

export default rps

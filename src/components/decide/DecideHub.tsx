"use client"

import { useCallback, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Dice5, Sparkles, X } from "lucide-react"
import { PosterCard } from "@/components/shared/PosterCard"
import { Celebration } from "@/components/shared/Celebration"
import type { DecideOption, DecideResult, SelectorGame, SelectorKind } from "./contract"
import type { Decision, SaveDecisionInput } from "@/lib/types/decisions.types"
import { GAMES } from "./registry"
import { OptionInput } from "./OptionInput"
import { Result } from "./Result"
import { DecisionHistory } from "./DecisionHistory"
import { TheDecider } from "./TheDecider"
import { makeOption, shuffle } from "./shared/random"

const ACCENT_BY_KIND: Record<SelectorKind, "coral" | "terracotta" | "teal" | "amber"> = {
  binary: "coral",
  many: "terracotta",
  weigh: "teal",
  playful: "amber",
}

const EASE_OUT: [number, number, number, number] = [0.25, 0.1, 0.25, 1]

type Phase = "setup" | "play" | "result"

type DecideHubProps = {
  games?: SelectorGame[]
  decisions: Decision[]
  isLoading?: boolean
  currentUserId?: string | null
  partnerName?: string | null
  onSaveDecision?: (input: SaveDecisionInput) => void | Promise<unknown>
  onClearDecision?: (id: string) => void
}

/**
 * DecideHub — the props-driven Decide Together surface. The (main) page wires
 * it to `useDecisions`; the preview renders it with `DECIDE_MOCK`. Hosts the
 * selector grid, "Let fate decide", The Decider, recent decisions, and the
 * setup → play → result game runner.
 */
export function DecideHub({
  games = GAMES,
  decisions,
  isLoading = false,
  currentUserId,
  partnerName,
  onSaveDecision,
  onClearDecision,
}: DecideHubProps) {
  const [active, setActive] = useState<SelectorGame | null>(null)
  const [phase, setPhase] = useState<Phase>("setup")
  const [options, setOptions] = useState<DecideOption[]>([])
  const [playOptions, setPlayOptions] = useState<DecideOption[]>([])
  const [result, setResult] = useState<DecideResult | null>(null)
  const [runId, setRunId] = useState(0)
  const [celebrate, setCelebrate] = useState(false)
  const [saved, setSaved] = useState(false)

  const open = useCallback(
    (game: SelectorGame, initial?: DecideOption[], opts?: { autoRun?: boolean }) => {
      const base =
        initial && initial.length >= 2 ? initial.map((o) => ({ ...o })) : [makeOption(""), makeOption("")]
      setActive(game)
      setOptions(base)
      setResult(null)
      setSaved(false)
      const ready = base.filter((o) => o.label.trim().length > 0).length >= 2
      if (opts?.autoRun && ready) {
        setPlayOptions(base.filter((o) => o.label.trim().length > 0))
        setRunId((n) => n + 1)
        setPhase("play")
      } else {
        setPhase("setup")
      }
    },
    [],
  )

  const close = useCallback(() => {
    setActive(null)
    setPhase("setup")
    setResult(null)
    setSaved(false)
  }, [])

  const startPlay = useCallback(() => {
    const filled = options.filter((o) => o.label.trim().length > 0)
    if (filled.length < 2) return
    setPlayOptions(filled)
    setResult(null)
    setSaved(false)
    setRunId((n) => n + 1)
    setPhase("play")
  }, [options])

  const handleResult = useCallback(
    (r: DecideResult) => {
      if (!active) return
      setResult(r)
      setPhase("result")
      setCelebrate(true)
      const payload: SaveDecisionInput = {
        kind: active.kind,
        toolId: active.id,
        options: playOptions,
        result: r,
      }
      Promise.resolve(onSaveDecision?.(payload))
        .then(() => setSaved(true))
        .catch(() => setSaved(false))
    },
    [active, playOptions, onSaveDecision],
  )

  const replay = useCallback(() => {
    setResult(null)
    setSaved(false)
    setRunId((n) => n + 1)
    setPhase("play")
  }, [])

  const surprise = useCallback(() => {
    if (games.length === 0) return
    const pick = shuffle(games)[0]
    open(pick)
  }, [games, open])

  const canStart = options.filter((o) => o.label.trim().length > 0).length >= 2

  return (
    <div className="min-h-[100dvh]">
      {/* Hero */}
      <header className="px-5 pb-2 pt-6">
        <p
          className="text-[12px] font-bold uppercase tracking-[0.28em]"
          style={{ fontFamily: "var(--font-nav)", color: "var(--color-terracotta)" }}
        >
          Decide Together
        </p>
        <div className="mt-1 flex items-baseline gap-3">
          <h1
            className="text-[clamp(30px,8vw,42px)] font-extrabold leading-[0.98] tracking-tight"
            style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}
          >
            Can&apos;t decide?
          </h1>
          <span
            className="text-[22px]"
            style={{ fontFamily: "var(--font-arabic)", color: "var(--color-ink-soft)" }}
            dir="rtl"
          >
            نقرر معًا
          </span>
        </div>
        <p
          className="mt-2 max-w-[42ch] text-[15px]"
          style={{ fontFamily: "var(--font-serif)", color: "var(--color-ink-soft)" }}
        >
          Pick a tool and let it choose — or let fate surprise you.
        </p>
      </header>

      <div className="flex flex-col gap-6 px-5 pb-28 pt-3">
        {/* Let fate decide */}
        <motion.button
          type="button"
          onClick={surprise}
          whileTap={{ scale: 0.98 }}
          className="flex items-center justify-center gap-2 rounded-2xl px-5 py-4 text-[16px] font-extrabold"
          style={{ background: "var(--color-terracotta)", color: "#FFF7EF", fontFamily: "var(--font-nav)", boxShadow: "var(--shadow-warm-md)" }}
          data-testid="surprise-btn"
        >
          <Sparkles size={20} strokeWidth={2.25} />
          Let fate decide
        </motion.button>

        {/* Selector grid */}
        <section>
          <h2
            className="mb-3 text-[13px] font-bold uppercase tracking-wider"
            style={{ fontFamily: "var(--font-nav)", color: "var(--color-ink-soft)" }}
          >
            Choose a tool
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {games.map((game) => (
              <PosterCard
                key={game.id}
                accent={ACCENT_BY_KIND[game.kind]}
                interactive
                onClick={() => open(game)}
                className="!p-4"
              >
                <button type="button" className="flex w-full flex-col gap-2 text-left" data-testid={`tool-${game.id}`}>
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className="text-[16px] font-extrabold leading-tight"
                      style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}
                    >
                      {game.label}
                    </span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={game.asset}
                      alt=""
                      aria-hidden
                      onError={(e) => (e.currentTarget.style.display = "none")}
                      className="h-9 w-9 shrink-0 object-contain"
                    />
                  </div>
                  <span
                    className="text-[14px]"
                    style={{ fontFamily: "var(--font-arabic)", color: "var(--color-ink-soft)" }}
                    dir="rtl"
                  >
                    {game.arabicLabel}
                  </span>
                  <span
                    className="text-[12px] leading-snug"
                    style={{ fontFamily: "var(--font-body)", color: "var(--color-ink-soft)" }}
                  >
                    {game.whenToUse}
                  </span>
                </button>
              </PosterCard>
            ))}
          </div>
        </section>

        {/* The Decider */}
        <section>
          <PosterCard accent="indigo">
            <TheDecider games={games} onLaunch={open} />
          </PosterCard>
        </section>

        {/* Recent decisions */}
        <section>
          <h2
            className="mb-3 text-[13px] font-bold uppercase tracking-wider"
            style={{ fontFamily: "var(--font-nav)", color: "var(--color-ink-soft)" }}
          >
            Recent decisions
          </h2>
          <DecisionHistory
            decisions={decisions}
            isLoading={isLoading}
            currentUserId={currentUserId}
            partnerName={partnerName}
            onClear={onClearDecision}
          />
        </section>
      </div>

      {/* Game runner modal */}
      <AnimatePresence>
        {active && (
          <motion.div
            className="fixed inset-0 z-[110] flex items-end justify-center sm:items-center"
            style={{ background: "rgba(25,26,44,0.45)", backdropFilter: "blur(2px)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={close}
            role="dialog"
            aria-modal="true"
            aria-label={`${active.label} decision`}
          >
            <motion.div
              className="relative w-full max-w-[460px] rounded-t-3xl border p-5 sm:rounded-3xl"
              style={{ background: "var(--card)", borderColor: "var(--border)", boxShadow: "var(--shadow-warm-xl)" }}
              initial={{ y: 40, opacity: 0.6 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ duration: 0.24, ease: EASE_OUT }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-3 flex items-center justify-between">
                <h3
                  className="text-[20px] font-extrabold"
                  style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}
                >
                  {active.label}
                </h3>
                <button
                  type="button"
                  onClick={close}
                  aria-label="Close"
                  className="grid h-9 w-9 place-items-center rounded-full"
                  style={{ background: "var(--color-sand)", color: "var(--color-ink-soft)" }}
                  data-testid="game-close"
                >
                  <X size={18} strokeWidth={2} />
                </button>
              </div>

              {phase === "setup" && (
                <div className="flex flex-col gap-4">
                  <p className="text-[14px]" style={{ fontFamily: "var(--font-body)", color: "var(--color-ink-soft)" }}>
                    {active.whenToUse}
                  </p>
                  <OptionInput
                    options={options}
                    onChange={setOptions}
                    showWeights={active.kind === "weigh"}
                  />
                  <button
                    type="button"
                    onClick={startPlay}
                    disabled={!canStart}
                    className="flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-[15px] font-bold disabled:opacity-40"
                    style={{ background: "var(--color-terracotta)", color: "#FFF7EF", fontFamily: "var(--font-nav)" }}
                    data-testid="game-start"
                  >
                    <Dice5 size={18} strokeWidth={2} />
                    {canStart ? `Start ${active.label}` : "Add at least 2 options"}
                  </button>
                </div>
              )}

              {phase === "play" && (() => {
                const ActiveComponent = active.Component
                return (
                <div className="relative">
                  <ActiveComponent key={runId} options={playOptions} onResult={handleResult} />
                  <button
                    type="button"
                    onClick={() => setPhase("setup")}
                    className="mx-auto mt-2 block text-[13px] font-semibold"
                    style={{ fontFamily: "var(--font-nav)", color: "var(--color-ink-soft)" }}
                    data-testid="game-edit-options"
                  >
                    Edit options
                  </button>
                </div>
                )
              })()}

              {phase === "result" && result && (
                <Result result={result} game={active} saved={saved} onReplay={replay} onDone={close} />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Celebration
        open={celebrate}
        tone={result?.winner ? "big" : "quiet"}
        title={result?.winner?.label ?? "Decided"}
        subtitle={active ? active.label : undefined}
        onDone={() => setCelebrate(false)}
        autoMs={2200}
      />
    </div>
  )
}

// ── Preview mock ────────────────────────────────────────────────────────────

function ago(mins: number): string {
  return new Date(Date.now() - mins * 60_000).toISOString()
}

export const DECIDE_MOCK: Decision[] = [
  {
    id: "mock-1",
    created_by: "me",
    kind: "many",
    tool_id: "wheel",
    options: [
      { id: "a", label: "Pizza" },
      { id: "b", label: "Shawarma" },
      { id: "c", label: "Sushi" },
    ],
    result: { winner: { id: "b", label: "Shawarma" }, summary: "Shawarma wins" },
    created_at: ago(8),
  },
  {
    id: "mock-2",
    created_by: "partner",
    kind: "binary",
    tool_id: "rps",
    options: [
      { id: "y", label: "Yes" },
      { id: "n", label: "No" },
    ],
    result: { winner: { id: "y", label: "Yes" }, summary: "Yes wins" },
    created_at: ago(95),
  },
  {
    id: "mock-3",
    created_by: "me",
    kind: "playful",
    tool_id: "dice",
    options: [
      { id: "1", label: "Movie" },
      { id: "2", label: "Walk" },
      { id: "3", label: "Game night" },
    ],
    result: { winner: { id: "2", label: "Walk" }, summary: "Walk wins" },
    created_at: ago(1500),
  },
]

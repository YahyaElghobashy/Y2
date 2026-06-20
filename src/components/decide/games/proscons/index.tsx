"use client"

import { useCallback, useMemo, useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { ChevronLeft, Minus, Plus, Scale, Trophy, X } from "lucide-react"
import type { DecideOption, DecideResult, SelectorGame, SelectorGameProps } from "../../contract"
import { uid, winnerSummary } from "../../shared/random"
import { haptic, playDecideSound, RisoBurst } from "../../shared/primitives"

/**
 * Pros & Cons — "PRO MAX". A deliberate *weigh* tool, not a coin flip. For each
 * option the couple lists pros and cons, every one carrying a 1–5 importance.
 * Each option scores `Σ pro weights − Σ con weights`; the heaviest net wins. The
 * verdict reveal tilts a diverging teal/coral scale toward the winner and shows
 * the full breakdown before the user locks it in (which is when `onResult` fires
 * exactly once, with the breakdown in `result.detail`).
 */

// ── Scoring (pure + exported for tests) ──────────────────────────────────────

export type WeighItem = { id: string; text: string; weight: number }
export type WeighSide = { pros: WeighItem[]; cons: WeighItem[] }
export type WeighBoard = Record<string, WeighSide>

export type OptionScore = {
  id: string
  label: string
  /** Weighted sum of pros with non-empty text. */
  pros: number
  /** Weighted sum of cons with non-empty text. */
  cons: number
  /** pros − cons. */
  net: number
  proCount: number
  conCount: number
  /** The option's own importance weight (DecideOption.weight, default 1). */
  weight: number
}

const WEIGHT_MIN = 1
const WEIGHT_MAX = 5
const DEFAULT_ITEM_WEIGHT = 3
const MAX_ITEMS_PER_SIDE = 8

export function clampWeight(w: number): number {
  if (!Number.isFinite(w)) return WEIGHT_MIN
  return Math.min(WEIGHT_MAX, Math.max(WEIGHT_MIN, Math.round(w)))
}

function sumSide(items: WeighItem[]): { sum: number; count: number } {
  return items.reduce(
    (acc, it) => {
      if (it.text.trim().length === 0) return acc
      return { sum: acc.sum + clampWeight(it.weight), count: acc.count + 1 }
    },
    { sum: 0, count: 0 },
  )
}

/** Score every option from its board entries, preserving original option order. */
export function scoreOptions(options: DecideOption[], board: WeighBoard): OptionScore[] {
  return options.map((o) => {
    const side = board[o.id] ?? { pros: [], cons: [] }
    const p = sumSide(side.pros)
    const c = sumSide(side.cons)
    return {
      id: o.id,
      label: o.label,
      pros: p.sum,
      cons: c.sum,
      net: p.sum - c.sum,
      proCount: p.count,
      conCount: c.count,
      weight: Math.max(0, o.weight ?? 1),
    }
  })
}

/**
 * Rank scores best-first. Primary key is `net` (pros − cons) descending; ties
 * break by more pros, then by the option's own importance weight, then stable
 * input order — so an all-empty board still degrades to the heaviest option.
 */
export function rankScores(scores: OptionScore[]): OptionScore[] {
  return scores
    .map((s, i) => ({ s, i }))
    .sort((a, b) => {
      if (b.s.net !== a.s.net) return b.s.net - a.s.net
      if (b.s.proCount !== a.s.proCount) return b.s.proCount - a.s.proCount
      if (b.s.weight !== a.s.weight) return b.s.weight - a.s.weight
      return a.i - b.i
    })
    .map((x) => x.s)
}

/** Build the persisted DecideResult from ranked scores. */
export function buildResult(options: DecideOption[], ranked: OptionScore[]): DecideResult {
  const top = ranked[0] ?? null
  const winner = top ? options.find((o) => o.id === top.id) ?? null : null
  const winners = ranked
    .map((s) => options.find((o) => o.id === s.id))
    .filter((o): o is DecideOption => Boolean(o))
  const runnerUp = ranked[1]
  const margin = top ? top.net - (runnerUp?.net ?? 0) : 0
  const tie = Boolean(top && runnerUp && top.net === runnerUp.net)
  return {
    winner,
    winners,
    summary: winnerSummary(winner),
    detail: {
      tool: "proscons",
      scores: ranked,
      winnerId: top?.id ?? null,
      winnerNet: top?.net ?? 0,
      margin,
      tie,
    },
  }
}

// ── Small UI atoms ───────────────────────────────────────────────────────────

const SPRING = { type: "spring" as const, damping: 16, stiffness: 170 }

function emptyItem(): WeighItem {
  return { id: uid(), text: "", weight: DEFAULT_ITEM_WEIGHT }
}

function netColor(net: number): string {
  if (net > 0) return "var(--color-teal)"
  if (net < 0) return "var(--color-coral)"
  return "var(--color-ink-soft)"
}

function netLabel(net: number): string {
  return net > 0 ? `+${net}` : `${net}`
}

function WeightStepper({
  value,
  onChange,
  label,
}: {
  value: number
  onChange: (n: number) => void
  label: string
}) {
  return (
    <div
      className="flex items-center gap-1 rounded-[10px] border px-1"
      style={{ borderColor: "var(--border)" }}
    >
      <button
        type="button"
        aria-label={`Lower importance of ${label}`}
        disabled={value <= WEIGHT_MIN}
        onClick={() => onChange(clampWeight(value - 1))}
        className="grid h-7 w-7 place-items-center rounded-md disabled:opacity-30"
        style={{ color: "var(--color-ink-soft)" }}
      >
        <Minus size={13} strokeWidth={2} />
      </button>
      <span
        className="w-4 text-center text-[13px] font-bold tabular-nums"
        style={{ fontFamily: "var(--font-mono)", color: "var(--foreground)" }}
      >
        {value}
      </span>
      <button
        type="button"
        aria-label={`Raise importance of ${label}`}
        disabled={value >= WEIGHT_MAX}
        onClick={() => onChange(clampWeight(value + 1))}
        className="grid h-7 w-7 place-items-center rounded-md disabled:opacity-30"
        style={{ color: "var(--color-ink-soft)" }}
      >
        <Plus size={13} strokeWidth={2} />
      </button>
    </div>
  )
}

/** Diverging scale: cons grow left (coral), pros grow right (teal), from center. */
function ScaleBar({
  pros,
  cons,
  scale,
  reduce,
}: {
  pros: number
  cons: number
  scale: number
  reduce: boolean
}) {
  const proPct = (pros / scale) * 50
  const conPct = (cons / scale) * 50
  return (
    <div
      className="relative h-3 w-full overflow-hidden rounded-full"
      style={{ background: "var(--color-sand)" }}
      aria-hidden
    >
      <div className="absolute left-1/2 top-0 h-full w-px" style={{ background: "var(--border)" }} />
      <motion.div
        className="absolute top-0 h-full rounded-s-full"
        style={{ right: "50%", background: "var(--color-coral)" }}
        initial={{ width: 0 }}
        animate={{ width: `${conPct}%` }}
        transition={reduce ? { duration: 0 } : SPRING}
      />
      <motion.div
        className="absolute top-0 h-full rounded-e-full"
        style={{ left: "50%", background: "var(--color-teal)" }}
        initial={{ width: 0 }}
        animate={{ width: `${proPct}%` }}
        transition={reduce ? { duration: 0 } : SPRING}
      />
    </div>
  )
}

// ── The game ─────────────────────────────────────────────────────────────────

function initBoard(options: DecideOption[]): WeighBoard {
  const board: WeighBoard = {}
  for (const o of options) board[o.id] = { pros: [emptyItem()], cons: [emptyItem()] }
  return board
}

function ProsConsGame({ options, onResult }: SelectorGameProps) {
  const reduce = useReducedMotion() ?? false
  const [board, setBoard] = useState<WeighBoard>(() => initBoard(options))
  const [activeIndex, setActiveIndex] = useState(0)
  const [ranked, setRanked] = useState<OptionScore[] | null>(null)
  const [committed, setCommitted] = useState(false)

  const liveScores = useMemo(() => scoreOptions(options, board), [options, board])

  const safeIndex = Math.min(activeIndex, Math.max(0, options.length - 1))
  const activeOption = options[safeIndex]
  const activeSide: WeighSide = (activeOption && board[activeOption.id]) || { pros: [], cons: [] }

  // ── Board mutations (always target the active option) ──
  const mutateSide = useCallback(
    (kind: "pros" | "cons", fn: (items: WeighItem[]) => WeighItem[]) => {
      if (!activeOption) return
      setBoard((prev) => {
        const side = prev[activeOption.id] ?? { pros: [], cons: [] }
        return { ...prev, [activeOption.id]: { ...side, [kind]: fn(side[kind]) } }
      })
    },
    [activeOption],
  )

  const addItem = useCallback(
    (kind: "pros" | "cons") =>
      mutateSide(kind, (items) => (items.length >= MAX_ITEMS_PER_SIDE ? items : [...items, emptyItem()])),
    [mutateSide],
  )
  const updateItem = useCallback(
    (kind: "pros" | "cons", id: string, patch: Partial<WeighItem>) =>
      mutateSide(kind, (items) => items.map((it) => (it.id === id ? { ...it, ...patch } : it))),
    [mutateSide],
  )
  const removeItem = useCallback(
    (kind: "pros" | "cons", id: string) =>
      mutateSide(kind, (items) => items.filter((it) => it.id !== id)),
    [mutateSide],
  )

  // ── Compute the verdict (reveal only — does NOT persist yet) ──
  const weigh = useCallback(() => {
    const next = rankScores(scoreOptions(options, board))
    setRanked(next)
    setCommitted(false)
    playDecideSound("win")
    haptic([10, 30, 10])
  }, [options, board])

  // ── Lock it in → the single onResult call ──
  const commit = useCallback(() => {
    if (committed) return
    const finalRanked = ranked ?? rankScores(scoreOptions(options, board))
    setCommitted(true)
    playDecideSound("tick")
    haptic()
    onResult(buildResult(options, finalRanked))
  }, [committed, ranked, options, board, onResult])

  const reweigh = useCallback(() => setRanked(null), [])

  // ── Empty guard (options is normally ≥2 via the hub, but support 1–N / 0) ──
  if (options.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <p className="text-[14px]" style={{ fontFamily: "var(--font-body)", color: "var(--color-ink-soft)" }}>
          Nothing to weigh yet.
        </p>
        <motion.button
          type="button"
          onClick={() => onResult({ winner: null, summary: winnerSummary(null), detail: { tool: "proscons" } })}
          whileTap={{ scale: 0.96 }}
          className="rounded-xl px-6 py-3 text-[15px] font-bold"
          style={{ background: "var(--color-teal)", color: "var(--color-bg-warm-white)", fontFamily: "var(--font-nav)" }}
          data-testid="decide-game-run"
        >
          Skip
        </motion.button>
      </div>
    )
  }

  // ── REVEAL ──
  if (ranked) {
    const winner = ranked[0]
    const runnerUp = ranked[1]
    const single = options.length === 1
    const tie = Boolean(winner && runnerUp && winner.net === runnerUp.net)
    const scale = Math.max(1, ...liveScores.flatMap((s) => [s.pros, s.cons]))
    const winnerLabel = winner?.label ?? "—"

    const verdictLine = single
      ? winner.net > 0
        ? "Worth it — the pros carry it."
        : winner.net < 0
          ? "Lean no — the cons weigh more."
          : "Too close to call."
      : tie
        ? `A dead heat — leaning toward ${winnerLabel}.`
        : `${winnerLabel} comes out ahead by ${winner.net - (runnerUp?.net ?? 0)}.`

    return (
      <div className="flex flex-col gap-4 py-1">
        {/* Verdict hero */}
        <div className="relative flex flex-col items-center gap-1 pb-1 pt-2 text-center">
          <RisoBurst active size={200} />
          <span
            className="relative z-10 text-[11px] font-bold uppercase tracking-[0.22em]"
            style={{ fontFamily: "var(--font-nav)", color: "var(--color-ink-soft)" }}
          >
            The verdict
          </span>
          <motion.div
            className="relative z-10 flex items-center gap-2"
            initial={{ scale: 0.7, y: 6, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            transition={reduce ? { duration: 0 } : { type: "spring", damping: 13, stiffness: 190 }}
          >
            <Trophy size={22} strokeWidth={2.25} style={{ color: "var(--color-amber)" }} aria-hidden />
            <p
              className="text-[30px] font-extrabold leading-tight"
              style={{ fontFamily: "var(--font-display)", color: "var(--color-terracotta)" }}
              data-testid="proscons-winner"
            >
              {winnerLabel}
            </p>
          </motion.div>
          <p
            className="relative z-10 text-[14px]"
            style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", color: "var(--color-ink-soft)" }}
            data-testid="proscons-verdict"
          >
            {verdictLine}
          </p>
        </div>

        {/* Diverging scale per option */}
        <div className="flex flex-col gap-3">
          {ranked.map((s, i) => {
            const isWinner = i === 0
            return (
              <div
                key={s.id}
                className="flex flex-col gap-1.5 rounded-2xl border p-3"
                style={{
                  borderColor: isWinner ? "var(--color-amber)" : "var(--border)",
                  background: isWinner ? "var(--color-sand)" : "var(--card)",
                  boxShadow: isWinner ? "var(--shadow-warm-sm)" : "none",
                }}
                data-testid={`proscons-score-${i}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className="truncate text-[15px] font-extrabold"
                    style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}
                  >
                    {s.label}
                  </span>
                  <span
                    className="shrink-0 rounded-full px-2 py-0.5 text-[13px] font-bold tabular-nums"
                    style={{
                      fontFamily: "var(--font-mono)",
                      color: "var(--color-bg-warm-white)",
                      background: netColor(s.net),
                    }}
                    data-testid={`proscons-score-net-${i}`}
                  >
                    {netLabel(s.net)}
                  </span>
                </div>
                <ScaleBar pros={s.pros} cons={s.cons} scale={scale} reduce={reduce} />
                <p
                  className="text-[12px]"
                  style={{ fontFamily: "var(--font-body)", color: "var(--color-ink-soft)" }}
                >
                  <span style={{ color: "var(--color-teal)" }}>
                    {s.proCount} {s.proCount === 1 ? "pro" : "pros"} (+{s.pros})
                  </span>
                  {"  ·  "}
                  <span style={{ color: "var(--color-coral)" }}>
                    {s.conCount} {s.conCount === 1 ? "con" : "cons"} (−{s.cons})
                  </span>
                </p>
              </div>
            )
          })}
        </div>

        {/* Commit / re-weigh */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={reweigh}
            className="flex items-center gap-1.5 rounded-xl border px-4 py-3 text-[14px] font-bold"
            style={{ borderColor: "var(--border)", color: "var(--foreground)", fontFamily: "var(--font-nav)" }}
            data-testid="proscons-reweigh"
          >
            <ChevronLeft size={16} strokeWidth={2} />
            Re-weigh
          </button>
          <motion.button
            type="button"
            onClick={commit}
            disabled={committed}
            whileTap={{ scale: 0.97 }}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl px-5 py-3 text-[15px] font-bold disabled:opacity-50"
            style={{ background: "var(--color-teal)", color: "var(--color-bg-warm-white)", fontFamily: "var(--font-nav)" }}
            data-testid="proscons-commit"
          >
            <Trophy size={18} strokeWidth={2.25} />
            {single ? "Lock it in" : `Lock in ${winnerLabel}`}
          </motion.button>
        </div>
      </div>
    )
  }

  // ── EDIT ──
  const activeScore = liveScores[safeIndex]
  return (
    <div className="flex flex-col gap-4 py-1">
      <p className="text-[13px]" style={{ fontFamily: "var(--font-body)", color: "var(--color-ink-soft)" }}>
        List what pulls each way, then rate how much it matters (1–5).
      </p>

      {/* Option switcher (only when weighing more than one) */}
      {options.length > 1 && (
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {options.map((o, i) => {
            const net = liveScores[i]?.net ?? 0
            const active = i === safeIndex
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => setActiveIndex(i)}
                className="flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-bold"
                style={{
                  borderColor: active ? "var(--color-teal)" : "var(--border)",
                  background: active ? "var(--color-teal)" : "transparent",
                  color: active ? "var(--color-bg-warm-white)" : "var(--foreground)",
                  fontFamily: "var(--font-nav)",
                }}
                data-testid={`proscons-tab-${i}`}
                aria-pressed={active}
              >
                <span className="max-w-[10ch] truncate">{o.label}</span>
                <span
                  className="rounded-full px-1.5 text-[11px] tabular-nums"
                  style={{
                    fontFamily: "var(--font-mono)",
                    background: active ? "color-mix(in srgb, var(--color-bg-warm-white) 22%, transparent)" : "var(--color-sand)",
                    color: active ? "var(--color-bg-warm-white)" : netColor(net),
                  }}
                  data-testid={`proscons-tab-net-${i}`}
                >
                  {netLabel(net)}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* Active option header */}
      <div className="flex items-center justify-between gap-2">
        <h4
          className="truncate text-[18px] font-extrabold"
          style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}
          data-testid="proscons-active-label"
        >
          {activeOption?.label}
        </h4>
        <span
          className="shrink-0 rounded-full px-2.5 py-0.5 text-[13px] font-bold tabular-nums"
          style={{
            fontFamily: "var(--font-mono)",
            color: "var(--color-bg-warm-white)",
            background: netColor(activeScore?.net ?? 0),
          }}
          data-testid="proscons-active-net"
        >
          {netLabel(activeScore?.net ?? 0)}
        </span>
      </div>

      {/* Pros + Cons editors */}
      <div className="flex flex-col gap-4">
        <SideEditor
          kind="pros"
          title="Pros"
          accent="var(--color-teal)"
          items={activeSide.pros}
          subtotal={activeScore?.pros ?? 0}
          onAdd={() => addItem("pros")}
          onText={(id, text) => updateItem("pros", id, { text })}
          onWeight={(id, weight) => updateItem("pros", id, { weight })}
          onRemove={(id) => removeItem("pros", id)}
        />
        <SideEditor
          kind="cons"
          title="Cons"
          accent="var(--color-coral)"
          items={activeSide.cons}
          subtotal={activeScore?.cons ?? 0}
          onAdd={() => addItem("cons")}
          onText={(id, text) => updateItem("cons", id, { text })}
          onWeight={(id, weight) => updateItem("cons", id, { weight })}
          onRemove={(id) => removeItem("cons", id)}
        />
      </div>

      {/* Weigh */}
      <motion.button
        type="button"
        onClick={weigh}
        whileTap={{ scale: 0.97 }}
        className="flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-[15px] font-extrabold"
        style={{ background: "var(--color-teal)", color: "var(--color-bg-warm-white)", fontFamily: "var(--font-nav)", boxShadow: "var(--shadow-warm-md)" }}
        data-testid="decide-game-run"
      >
        <Scale size={18} strokeWidth={2.25} />
        Weigh the verdict
      </motion.button>
    </div>
  )
}

// ── Side editor (pros or cons) ───────────────────────────────────────────────

function SideEditor({
  kind,
  title,
  accent,
  items,
  subtotal,
  onAdd,
  onText,
  onWeight,
  onRemove,
}: {
  kind: "pros" | "cons"
  title: string
  accent: string
  items: WeighItem[]
  subtotal: number
  onAdd: () => void
  onText: (id: string, text: string) => void
  onWeight: (id: string, weight: number) => void
  onRemove: (id: string) => void
}) {
  const sign = kind === "pros" ? "+" : "−"
  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: accent }} aria-hidden />
          <h5
            className="text-[13px] font-bold uppercase tracking-wider"
            style={{ fontFamily: "var(--font-nav)", color: "var(--foreground)" }}
          >
            {title}
          </h5>
        </div>
        <span
          className="text-[13px] font-bold tabular-nums"
          style={{ fontFamily: "var(--font-mono)", color: accent }}
          data-testid={`proscons-${kind}-subtotal`}
        >
          {sign}
          {subtotal}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <AnimatePresence initial={false}>
          {items.map((it, i) => (
            <motion.div
              key={it.id}
              layout
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={it.text}
                onChange={(e) => onText(it.id, e.target.value)}
                placeholder={kind === "pros" ? `Pro ${i + 1}` : `Con ${i + 1}`}
                aria-label={`${title} ${i + 1}`}
                className="min-w-0 flex-1 rounded-[10px] border px-3 py-2 text-[14px] outline-none"
                style={{
                  borderColor: "var(--border)",
                  background: "var(--background)",
                  color: "var(--foreground)",
                  fontFamily: "var(--font-body)",
                }}
                data-testid={`proscons-${kind}-input-${i}`}
              />
              <WeightStepper
                value={clampWeight(it.weight)}
                onChange={(w) => onWeight(it.id, w)}
                label={`${title} ${i + 1}`}
              />
              <button
                type="button"
                onClick={() => onRemove(it.id)}
                aria-label={`Remove ${title} ${i + 1}`}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full"
                style={{ color: "var(--color-ink-soft)" }}
                data-testid={`proscons-${kind}-remove-${i}`}
              >
                <X size={16} strokeWidth={2} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <button
        type="button"
        onClick={onAdd}
        disabled={items.length >= MAX_ITEMS_PER_SIDE}
        className="flex items-center justify-center gap-1.5 rounded-xl border border-dashed py-2 text-[13px] font-semibold disabled:opacity-40"
        style={{ borderColor: "var(--border)", color: accent, fontFamily: "var(--font-nav)" }}
        data-testid={`proscons-add-${kind === "pros" ? "pro" : "con"}`}
      >
        <Plus size={15} strokeWidth={2.25} />
        Add {kind === "pros" ? "pro" : "con"}
      </button>
    </section>
  )
}

const proscons: SelectorGame = {
  id: "proscons",
  label: "Pros & Cons",
  arabicLabel: "إيجابيات وسلبيات",
  whenToUse: "A real decision worth thinking through, not just chance.",
  kind: "weigh",
  asset: "/assets/objects/object-04.png",
  Component: ProsConsGame,
}

export default proscons

"use client"

import { useEffect, useMemo, useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { Crown, Shuffle, Swords } from "lucide-react"
import { shuffle, weightedPick, winnerSummary } from "../../shared/random"
import { haptic, playDecideSound } from "../../shared/primitives"
import { SubToolFrame, useDecideOnce, type SubToolProps } from "./shared"
import type { DecideOption } from "../../contract"

const ACCENT = "var(--color-terracotta)"

type Round = { pairs: [DecideOption, DecideOption][]; bye: DecideOption | null }

/** Pair up the contenders; an odd one out gets a bye to the next round. */
function buildRound(contenders: DecideOption[]): Round {
  const list = [...contenders]
  const bye = list.length % 2 === 1 ? list.pop()! : null
  const pairs: [DecideOption, DecideOption][] = []
  for (let i = 0; i < list.length; i += 2) pairs.push([list[i], list[i + 1]])
  return { pairs, bye }
}

/**
 * KNOCKOUT — head-to-head rounds until one option is left standing. Tap the side
 * you favor, or let the round break ties at random. Great for "where to eat".
 */
export default function Bracket({ options, onResult, onBack }: SubToolProps) {
  const reduce = useReducedMotion()
  const commit = useDecideOnce(onResult)
  // Shuffle once so seeding (and any byes) are fair, not input-order biased.
  const seeded = useMemo(() => shuffle(options), [options])

  const [round, setRound] = useState<Round>(() => buildRound(seeded))
  const [pairIdx, setPairIdx] = useState(0)
  const [winners, setWinners] = useState<DecideOption[]>([])
  const [roundNo, setRoundNo] = useState(1)
  const [champion, setChampion] = useState<DecideOption | null>(null)

  // The hub guarantees >= 2 options; this only guards a direct/degenerate mount
  // (an empty round would otherwise render nothing forever, never committing).
  useEffect(() => {
    if (seeded.length >= 2) return
    const lone = seeded[0] ?? null
    commit(
      {
        winner: lone,
        winners: lone ? [lone] : undefined,
        summary: winnerSummary(lone),
        detail: { tool: "bonus", subTool: "knockout", rounds: 0, contenders: options.length },
      },
      0,
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function pick(winner: DecideOption) {
    if (champion) return
    const nextWinners = [...winners, winner]
    const nextIdx = pairIdx + 1

    if (nextIdx < round.pairs.length) {
      playDecideSound("tick")
      haptic(10)
      setWinners(nextWinners)
      setPairIdx(nextIdx)
      return
    }

    // Round complete — fold in the bye and either crown a champion or play on.
    const advancing = [...nextWinners, ...(round.bye ? [round.bye] : [])]
    if (advancing.length === 1) {
      const champ = advancing[0]
      setChampion(champ)
      playDecideSound("win")
      haptic([10, 40, 10, 40, 18])
      commit({
        winner: champ,
        winners: [champ],
        summary: winnerSummary(champ),
        detail: { tool: "bonus", subTool: "knockout", rounds: roundNo, contenders: options.length },
      })
      return
    }

    playDecideSound("tick")
    haptic(10)
    setRound(buildRound(advancing))
    setWinners([])
    setPairIdx(0)
    setRoundNo((r) => r + 1)
  }

  if (champion) {
    return (
      <SubToolFrame title="Knockout" accent={ACCENT} onBack={onBack}>
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <Crown size={30} strokeWidth={2} style={{ color: "var(--color-amber)" }} />
          <motion.p
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 220, damping: 14 }}
            className="text-[26px] font-extrabold leading-tight"
            style={{ fontFamily: "var(--font-display)", color: ACCENT }}
          >
            {champion.label}
          </motion.p>
          <span
            className="text-[13px]"
            style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", color: "var(--color-ink-soft)" }}
          >
            takes the crown
          </span>
        </div>
      </SubToolFrame>
    )
  }

  const pair = round.pairs[pairIdx]
  if (!pair) return null

  return (
    <SubToolFrame title="Knockout" accent={ACCENT} onBack={onBack}>
      <p
        className="-mt-1 text-center text-[12px] font-bold uppercase tracking-wider"
        style={{ fontFamily: "var(--font-nav)", color: "var(--color-ink-soft)" }}
      >
        Round {roundNo} · Match {pairIdx + 1}/{round.pairs.length}
      </p>

      <AnimatePresence mode="wait">
        <motion.div
          key={`${roundNo}-${pairIdx}`}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={reduce ? { duration: 0 } : { duration: 0.22 }}
          className="flex items-stretch gap-2"
        >
          {pair.map((opt, side) => (
            <motion.button
              key={opt.id}
              type="button"
              onClick={() => pick(opt)}
              whileTap={{ scale: 0.95 }}
              className="flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-2xl border-2 px-3 py-6 text-center"
              style={{
                borderColor: "var(--border)",
                background: "var(--color-paper)",
                boxShadow: "var(--shadow-warm-sm)",
              }}
              data-testid={`bracket-pick-${side}`}
            >
              <span
                className="max-w-full truncate text-[16px] font-extrabold"
                style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}
              >
                {opt.label}
              </span>
            </motion.button>
          ))}
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center justify-center gap-2">
        <span
          className="grid h-7 w-7 place-items-center rounded-full text-[12px] font-black"
          style={{ background: ACCENT, color: "var(--primary-foreground)", fontFamily: "var(--font-display)" }}
        >
          <Swords size={14} strokeWidth={2.4} />
        </span>
        <button
          type="button"
          onClick={() => pick(weightedPick(pair) ?? pair[0])}
          className="flex items-center gap-1.5 rounded-xl border px-4 py-2 text-[13px] font-bold"
          style={{ borderColor: "var(--border)", color: "var(--foreground)", fontFamily: "var(--font-nav)" }}
          data-testid="bracket-random"
        >
          <Shuffle size={15} strokeWidth={2.2} />
          Decide at random
        </button>
      </div>
    </SubToolFrame>
  )
}

"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { PosterCard } from "@/components/shared/PosterCard"
import { PillTabBar } from "@/components/shared/PillTabBar"
import { Coin } from "@/components/shared/Coin"
import { Celebration } from "@/components/shared/Celebration"

/**
 * ChallengesView — Treasury's stakes room (docs/DESIGN_BLUEPRINT.md §5.3).
 * Two halves behind a PillTab:
 *  · Challenges — a dare with CoYYns on the line: pending (accept/decline) →
 *    live (claim victory) → past (who won). Claiming fires the big celebration
 *    and pays out double stakes.
 *  · Bounties — standing rewards that trigger on an action; claim → quiet glow.
 * Presentational; real status transitions + payout land in the functional pass
 * (use-challenges / use-bounties).
 */

type Accent = "terracotta" | "amber" | "coral" | "teal" | "indigo" | "rose"

export type ChallengeItem = {
  id: string
  title: string
  emoji: string
  stakes: number
  accent: Accent
  /** present on incoming challenges awaiting your yes */
  from?: string
  /** present on live challenges */
  deadline?: string
  /** present on resolved challenges */
  winner?: string
}

export type BountyItem = {
  id: string
  title: string
  trigger: string
  reward: number
  emoji: string
  recurring?: boolean
}

const ACCENT_VAR: Record<Accent, string> = {
  terracotta: "var(--color-terracotta)",
  amber: "var(--color-amber)",
  coral: "var(--color-coral)",
  teal: "var(--color-teal)",
  indigo: "var(--color-indigo)",
  rose: "var(--color-dusty-rose)",
}

export function ChallengesView({
  pending: pendingInit,
  active: activeInit,
  past,
  bounties: bountiesInit,
  initialBalance,
  partnerName = "Yara",
  onAccept,
  onDecline,
  onClaim,
  onClaimBounty,
}: {
  pending: ChallengeItem[]
  active: ChallengeItem[]
  past: ChallengeItem[]
  bounties: BountyItem[]
  initialBalance: number
  partnerName?: string
  /** Authed real mutations; preview leaves them undefined (demo-only). */
  onAccept?: (id: string) => void
  onDecline?: (id: string) => void
  onClaim?: (id: string) => void
  onClaimBounty?: (id: string) => void
}) {
  const [tab, setTab] = useState("challenges")
  const [balance, setBalance] = useState(initialBalance)
  const [pending, setPending] = useState(pendingInit)
  const [active, setActive] = useState(activeInit)
  const [bounties, setBounties] = useState(bountiesInit)

  // Re-sync local lists/balance when the parent's props change. The parent
  // memoizes these from realtime hook state, so these effects fire only on a
  // real data change (realtime event / mutation refetch), reconciling optimistic
  // edits rather than clobbering them every render. Without this, a challenge
  // accepted/resolved by the partner never appeared.
  useEffect(() => { setPending(pendingInit) }, [pendingInit])
  useEffect(() => { setActive(activeInit) }, [activeInit])
  useEffect(() => { setBounties(bountiesInit) }, [bountiesInit])
  useEffect(() => { setBalance(initialBalance) }, [initialBalance])
  const [celebrate, setCelebrate] = useState<{ open: boolean; tone: "big" | "quiet"; title: string; subtitle: string }>({
    open: false,
    tone: "quiet",
    title: "",
    subtitle: "",
  })

  const accept = (c: ChallengeItem) => {
    setPending((list) => list.filter((x) => x.id !== c.id))
    setActive((list) => [{ ...c, from: undefined, deadline: "this week" }, ...list])
    setCelebrate({ open: true, tone: "quiet", title: "Challenge on ✦", subtitle: `"${c.title}" is live — ${c.stakes} CoYYns on the line` })
    onAccept?.(c.id)
  }

  const decline = (c: ChallengeItem) => {
    setPending((list) => list.filter((x) => x.id !== c.id))
    onDecline?.(c.id)
  }

  const claim = (c: ChallengeItem) => {
    const payout = c.stakes * 2
    setActive((list) => list.filter((x) => x.id !== c.id))
    setBalance((b) => b + payout)
    setCelebrate({ open: true, tone: "big", title: "Mabrouk! 🎉", subtitle: `You won "${c.title}" — ${payout} CoYYns to your pot` })
    onClaim?.(c.id)
  }

  const claimBounty = (b: BountyItem) => {
    setBalance((bal) => bal + b.reward)
    if (!b.recurring) setBounties((list) => list.filter((x) => x.id !== b.id))
    setCelebrate({ open: true, tone: "quiet", title: "Bounty claimed ✦", subtitle: `+${b.reward} CoYYns — "${b.title}"` })
    onClaimBounty?.(b.id)
  }

  return (
    <div className="skin-aware min-h-[100dvh] px-5 pb-28 pt-6" style={{ background: "var(--background)" }}>
      <header className="mb-4 flex items-end justify-between">
        <div>
          <h1 className="text-[30px] font-extrabold tracking-tight" style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}>
            Challenges
          </h1>
          <p className="mt-0.5 text-[15px]" style={{ fontFamily: "var(--font-serif)", color: "var(--color-ink-soft)" }}>
            Dares & bounties, with CoYYns on the line.
          </p>
        </div>
        <span className="rounded-full px-3 py-1.5" style={{ background: "var(--color-sand)" }}>
          <Coin amount={balance} size={22} />
        </span>
      </header>

      <PillTabBar
        tabs={[
          { id: "challenges", label: "Challenges" },
          { id: "bounties", label: "Bounties" },
        ]}
        activeTab={tab}
        onTabChange={setTab}
        className="mb-5"
      />

      <AnimatePresence mode="wait">
        {tab === "challenges" ? (
          <motion.div key="challenges" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="space-y-6">
            {/* Awaiting you */}
            {pending.length > 0 && (
              <Section label="Awaiting your yes" accent="coral">
                {pending.map((c, i) => (
                  <ChallengeRow key={c.id} c={c} index={i}>
                    <div className="mt-3 grid grid-cols-2 gap-2.5">
                      <button type="button" onClick={() => decline(c)} className="rounded-full py-2.5 text-[13px] font-bold" style={{ background: "var(--color-sand)", color: "var(--foreground)", fontFamily: "var(--font-body)" }}>
                        Pass
                      </button>
                      <button type="button" onClick={() => accept(c)} className="rounded-full py-2.5 text-[13px] font-bold" style={{ background: "var(--color-coral)", color: "#FFF7EF", fontFamily: "var(--font-body)" }}>
                        Accept ✦
                      </button>
                    </div>
                  </ChallengeRow>
                ))}
              </Section>
            )}

            {/* Live now */}
            <Section label="Live now" accent="amber">
              {active.length === 0 ? (
                <Empty line="No live challenges. Dare each other." />
              ) : (
                active.map((c, i) => (
                  <ChallengeRow key={c.id} c={c} index={i}>
                    <button
                      type="button"
                      onClick={() => claim(c)}
                      className="mt-3 w-full rounded-full py-2.5 text-[13px] font-bold"
                      style={{ background: "var(--color-terracotta)", color: "#FFF7EF", fontFamily: "var(--font-body)" }}
                    >
                      I won it — claim {c.stakes * 2} ✦
                    </button>
                  </ChallengeRow>
                ))
              )}
            </Section>

            {/* Past */}
            {past.length > 0 && (
              <Section label="Settled" accent="teal">
                {past.map((c, i) => (
                  <ChallengeRow key={c.id} c={c} index={i} muted>
                    <p className="mt-2 text-[13px] font-bold" style={{ fontFamily: "var(--font-body)", color: ACCENT_VAR[c.accent] }}>
                      {c.winner} won · {c.stakes * 2} CoYYns
                    </p>
                  </ChallengeRow>
                ))}
              </Section>
            )}
          </motion.div>
        ) : (
          <motion.div key="bounties" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="space-y-3">
            {bounties.length === 0 ? (
              <Empty line="No standing bounties. Set a reward for a kind act." />
            ) : (
              bounties.map((b, i) => (
                <motion.div key={b.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.32, delay: i * 0.05 }}>
                  <PosterCard accent="indigo" grain={false} className="flex items-center gap-3.5 !p-4">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-2xl" style={{ background: "var(--color-sand)" }}>
                      {b.emoji}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-[15px] font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}>
                          {b.title}
                        </p>
                        {b.recurring && (
                          <span className="shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide" style={{ background: "var(--color-sand)", color: "var(--color-ink-soft)", fontFamily: "var(--font-nav)" }}>
                            repeats
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-[13px]" style={{ fontFamily: "var(--font-serif)", color: "var(--color-ink-soft)" }}>
                        when {b.trigger}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => claimBounty(b)}
                      className="flex shrink-0 items-center gap-1 rounded-full px-3 py-2 text-[13px] font-bold"
                      style={{ background: "var(--color-indigo)", color: "#FFF7EF", fontFamily: "var(--font-body)" }}
                    >
                      <Coin amount={b.reward} size={15} />
                    </button>
                  </PosterCard>
                </motion.div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <Celebration
        open={celebrate.open}
        tone={celebrate.tone}
        title={celebrate.title}
        subtitle={celebrate.subtitle}
        onDone={() => setCelebrate((s) => ({ ...s, open: false }))}
      />
    </div>
  )
}

function Section({ label, accent, children }: { label: string; accent: Accent; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-2.5 flex items-center gap-2">
        <span className="h-2 w-2 rounded-full" style={{ background: ACCENT_VAR[accent] }} />
        <h2 className="text-[12px] font-bold uppercase tracking-[0.18em]" style={{ fontFamily: "var(--font-nav)", color: "var(--color-ink-soft)" }}>
          {label}
        </h2>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  )
}

function ChallengeRow({ c, index, muted, children }: { c: ChallengeItem; index: number; muted?: boolean; children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.32, delay: index * 0.05 }}>
      <PosterCard accent={c.accent} grain={false} className={muted ? "!p-4 opacity-80" : "!p-4"}>
        <div className="flex items-start gap-3.5">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-2xl" style={{ background: "var(--color-sand)" }}>
            {c.emoji}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[16px] font-bold leading-snug" style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}>
              {c.title}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[12px]" style={{ fontFamily: "var(--font-body)", color: "var(--color-ink-soft)" }}>
              <span className="inline-flex items-center gap-1">
                <Coin amount={c.stakes} size={14} /> each
              </span>
              {c.from && <span>· from {c.from}</span>}
              {c.deadline && <span>· {c.deadline}</span>}
            </div>
          </div>
        </div>
        {children}
      </PosterCard>
    </motion.div>
  )
}

function Empty({ line }: { line: string }) {
  return (
    <PosterCard grain={false} className="!p-6 text-center">
      <p className="text-[14px]" style={{ fontFamily: "var(--font-serif)", color: "var(--color-ink-soft)" }}>
        {line}
      </p>
    </PosterCard>
  )
}

export const CHALLENGES_PENDING_MOCK: ChallengeItem[] = [
  { id: "p1", title: "First to 10k steps tomorrow", emoji: "👟", stakes: 40, accent: "coral", from: "Yara" },
  { id: "p2", title: "No phone at dinner all week", emoji: "📵", stakes: 60, accent: "rose", from: "Yara" },
]

export const CHALLENGES_ACTIVE_MOCK: ChallengeItem[] = [
  { id: "a1", title: "Plank longer by Friday", emoji: "🧘", stakes: 50, accent: "amber", deadline: "ends Friday" },
]

export const CHALLENGES_PAST_MOCK: ChallengeItem[] = [
  { id: "h1", title: "Cook without a recipe", emoji: "🍳", stakes: 30, accent: "teal", winner: "You" },
  { id: "h2", title: "Wake before Fajr 3 days", emoji: "🌅", stakes: 45, accent: "indigo", winner: "Yara" },
]

export const BOUNTIES_MOCK: BountyItem[] = [
  { id: "b1", title: "Surprise me with coffee", trigger: "you bring me a flat white", reward: 25, emoji: "☕", recurring: true },
  { id: "b2", title: "Fold the laundry", trigger: "the basket is empty", reward: 35, emoji: "🧺" },
  { id: "b3", title: "Plan a date night", trigger: "you book us something", reward: 80, emoji: "🌙" },
]

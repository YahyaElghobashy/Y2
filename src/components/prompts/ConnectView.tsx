"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Flame } from "lucide-react"
import { PosterCard } from "@/components/shared/PosterCard"

/**
 * ConnectView — the daily prompt (docs/DESIGN_BLUEPRINT.md §4.1). The intimate
 * register: a Fraunces question on warm paper, a handwritten answer, reveal-both
 * on submit, a streak. The "subtle deep connection" north star. Presentational.
 */
export type ConnectData = {
  streak: number
  category: string
  question: string
  partnerName: string
  partnerAnswer: string
  /** True once the partner has also answered (both_answered). When false, the reveal shows a waiting state instead of an empty card. */
  partnerAnswered: boolean
  history: { question: string; mine: string; hers: string; date: string }[]
}

export function ConnectView({
  data,
  onSubmit,
  initialAnswer = "",
  initialRevealed = false,
}: {
  data: ConnectData
  /** Authed page injects the real "submit answer" mutation; preview leaves it undefined (reveal stays demo-only). */
  onSubmit?: (text: string) => void | Promise<void>
  /** Seed the composer when the user has already answered today (authed page); preview leaves it empty. */
  initialAnswer?: string
  /** Show the reveal state immediately when both have answered (authed page); preview starts in compose. */
  initialRevealed?: boolean
}) {
  const [answer, setAnswer] = useState(initialAnswer)
  const [revealed, setRevealed] = useState(initialRevealed)

  return (
    <div className="skin-aware min-h-[100dvh] px-5 pb-28 pt-6" style={{ background: "var(--background)" }}>
      <header className="mb-4 flex items-end justify-between">
        <div>
          <p className="text-[19px] leading-none" style={{ fontFamily: "var(--font-arabic)", color: "var(--color-coral)" }}>نتواصل</p>
          <h1 className="mt-1 text-[30px] font-extrabold tracking-tight" style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}>Connect</h1>
        </div>
        <span className="flex items-center gap-1.5 rounded-full px-3 py-1.5" style={{ background: "var(--color-sand)" }}>
          <Flame size={16} style={{ color: "var(--color-coral)" }} />
          <span className="text-[13px] font-bold tabular-nums" style={{ fontFamily: "var(--font-body)", color: "var(--foreground)" }}>{data.streak}</span>
        </span>
      </header>

      {/* ── Today's prompt ── */}
      <PosterCard accent="coral" className="relative">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ fontFamily: "var(--font-nav)", color: "var(--color-terracotta)" }}>
          Today · {data.category}
        </p>
        <p className="mt-2 text-[24px] leading-snug" style={{ fontFamily: "var(--font-serif)", color: "var(--foreground)" }}>
          {data.question}
        </p>

        <AnimatePresence mode="wait">
          {!revealed ? (
            <motion.div key="compose" exit={{ opacity: 0 }} className="mt-4">
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                rows={3}
                placeholder="write it the way you'd say it…"
                className="textarea-lined w-full text-[20px]"
                style={{ color: "var(--color-ink)" }}
              />
              <button
                type="button"
                disabled={!answer.trim()}
                onClick={() => {
                  setRevealed(true)
                  // Authed page persists via onSubmit; preview leaves it undefined → reveal stays local/demo-only.
                  void onSubmit?.(answer)
                }}
                className="mt-3 w-full rounded-full py-3 text-[14px] font-bold disabled:opacity-45"
                style={{ background: "var(--color-coral)", color: "#FFF7EF", fontFamily: "var(--font-body)" }}
              >
                Share &amp; reveal {data.partnerName}&apos;s
              </button>
            </motion.div>
          ) : (
            <motion.div key="reveal" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4 grid gap-3">
              <Answer who="You" tint="var(--color-preference-me)" text={answer} />
              {data.partnerAnswered ? (
                <Answer who={data.partnerName} tint="var(--color-preference-partner)" text={data.partnerAnswer} />
              ) : (
                <WaitingForPartner name={data.partnerName} />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </PosterCard>

      {/* ── Lately ── */}
      <h2 className="mb-2 mt-6 text-[17px] font-bold tracking-tight" style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}>Lately</h2>
      <div className="grid gap-3">
        {data.history.map((h, i) => (
          <PosterCard key={i} grain={false} className="!p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ fontFamily: "var(--font-nav)", color: "var(--color-ink-soft)" }}>{h.date}</p>
            <p className="mt-1 text-[16px] leading-snug" style={{ fontFamily: "var(--font-serif)", color: "var(--foreground)" }}>{h.question}</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <MiniAnswer tint="var(--color-preference-me)" text={h.mine} />
              <MiniAnswer tint="var(--color-preference-partner)" text={h.hers} />
            </div>
          </PosterCard>
        ))}
      </div>
    </div>
  )
}

function Answer({ who, tint, text }: { who: string; tint: string; text: string }) {
  return (
    <div className="rounded-2xl p-3.5" style={{ background: "var(--color-sand)" }}>
      <span className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full" style={{ background: tint }} />
        <span className="text-[12px] font-bold" style={{ fontFamily: "var(--font-body)", color: "var(--foreground)" }}>{who}</span>
      </span>
      <p className="mt-1 text-[19px] leading-snug" style={{ fontFamily: "var(--font-handwritten)", color: "var(--color-ink)" }}>{text}</p>
    </div>
  )
}

/** Shown after you reveal but before your partner has answered — keeps their answer a surprise. */
function WaitingForPartner({ name }: { name: string }) {
  return (
    <div className="rounded-2xl p-3.5" style={{ background: "var(--color-sand)" }} data-testid="connect-waiting-partner">
      <span className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full" style={{ background: "var(--color-preference-partner)" }} />
        <span className="text-[12px] font-bold" style={{ fontFamily: "var(--font-body)", color: "var(--foreground)" }}>{name}</span>
      </span>
      <p className="mt-1 text-[15px] leading-snug" style={{ fontFamily: "var(--font-body)", color: "var(--color-ink-soft)" }}>
        Waiting for {name}&apos;s answer… you&apos;ll both see it here once they reply.
      </p>
    </div>
  )
}

function MiniAnswer({ tint, text }: { tint: string; text: string }) {
  return (
    <div className="rounded-xl p-2.5" style={{ background: "var(--color-sand)" }}>
      <span className="mb-0.5 block h-1.5 w-1.5 rounded-full" style={{ background: tint }} />
      <p className="line-clamp-3 text-[15px] leading-snug" style={{ fontFamily: "var(--font-handwritten)", color: "var(--color-ink-soft)" }}>{text}</p>
    </div>
  )
}

export const CONNECT_MOCK: ConnectData = {
  streak: 12,
  category: "Deep Dive",
  question: "What did you think of me, the very first time?",
  partnerName: "Yara",
  partnerAnswer: "Honestly? That you were trouble — the good kind. I couldn't look away.",
  partnerAnswered: true,
  history: [
    {
      date: "Yesterday",
      question: "A small thing I do that you secretly love?",
      mine: "The way you hum when you're cooking.",
      hers: "How you always steal the window seat, then give it to me.",
    },
    {
      date: "2 days ago",
      question: "Where do you feel most like us?",
      mine: "The rooftop, after maghrib.",
      hers: "Anywhere your laugh is too loud.",
    },
  ],
}

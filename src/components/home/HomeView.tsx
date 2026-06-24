"use client"

import Link from "next/link"
import { motion } from "framer-motion"

const hideOnError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  e.currentTarget.style.display = "none"
}
import { Settings, ChevronRight, Plane } from "lucide-react"
import { PosterCard } from "@/components/shared/PosterCard"
import { Coin } from "@/components/shared/Coin"
import { cn } from "@/lib/utils"

/**
 * HomeView — the calm living-room (docs/DESIGN_BLUEPRINT.md §3). Presentational
 * & props-driven so it renders identically in the authed page (real hook data)
 * and the /preview harness (mock data). Replaces the 23-widget firehose with a
 * few curated, connective blocks.
 */
export type Mood = { emoji: string; label: string } | null

export type HomeViewData = {
  userName: string
  partnerName: string
  greeting: string // "Good evening"
  subNote: string // "3 new keepsakes this week"
  userMood: Mood
  partnerMood: Mood
  today: { kind: string; title: string; body: string; href: string } | null
  keepsakes: { thumb: string; line: string; tag: string }[]
  balance: number
  coupon: { title: string; from: string } | null
  rooms: { label: string; icon: string; href: string; accent: string }[]
  avatarUrl?: string | null
}

const EASE: [number, number, number, number] = [0.25, 0.1, 0.25, 1]
const fadeUp = (i: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: EASE, delay: i * 0.06 },
})

export function HomeView({ data }: { data: HomeViewData }) {
  return (
    <div className="skin-aware min-h-[100dvh] pb-28" style={{ background: "var(--background)" }}>
      {/* ── Top bar ── */}
      <header className="flex items-center justify-between px-5 pt-4">
        <Link href="/me" aria-label="You" className="flex items-center gap-2">
          <span
            className="grid h-9 w-9 place-items-center overflow-hidden rounded-full border"
            style={{ borderColor: "var(--border)", background: "var(--color-sand)" }}
          >
            {data.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={data.avatarUrl} alt="" onError={hideOnError} width={36} height={36} className="h-full w-full object-cover" />
            ) : (
              <span style={{ fontFamily: "var(--font-display)", color: "var(--color-terracotta)" }} className="text-sm font-extrabold">
                {data.userName.slice(0, 1)}
              </span>
            )}
          </span>
        </Link>
        <span
          className="text-[13px] font-extrabold tracking-tight"
          style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}
        >
          Ha<span style={{ color: "var(--color-terracotta)" }}>YY</span>ah
        </span>
        <Link
          href="/settings"
          aria-label="Settings"
          className="grid h-9 w-9 place-items-center rounded-full"
          style={{ color: "var(--color-ink-soft)" }}
        >
          <Settings size={20} strokeWidth={1.75} />
        </Link>
      </header>

      {/* ── Greeting hero (the time of day, literally) ── */}
      <motion.section {...fadeUp(0)} className="px-5 pt-3">
        <div className="relative overflow-hidden rounded-[26px]" style={{ boxShadow: "var(--shadow-warm-lg)" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/scenes/scene-home-rooftop-iftar.webp"
            alt=""
            aria-hidden
            onError={hideOnError}
            className="h-[230px] w-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(180deg, rgba(25,26,44,0) 30%, rgba(25,26,44,0.55) 100%)" }}
          />
          <div className="absolute inset-x-0 bottom-0 p-5">
            <p
              className="text-[12px] font-semibold uppercase tracking-[0.18em]"
              style={{ fontFamily: "var(--font-nav)", color: "#F4E3C8" }}
            >
              {data.greeting}
            </p>
            <h1
              className="mt-1 text-[30px] leading-[1.02] font-extrabold tracking-tight"
              style={{ fontFamily: "var(--font-display)", color: "#FFF7EF" }}
            >
              Welcome home,
              <br />
              <span style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 400, color: "#F2C99B" }}>
                you two.
              </span>
            </h1>
          </div>
        </div>
        <p
          className="mt-2 px-1 text-[18px]"
          style={{ fontFamily: "var(--font-handwritten)", color: "var(--color-ink-soft)" }}
        >
          {data.subNote}
        </p>
      </motion.section>

      {/* ── The two of you ── */}
      <motion.section {...fadeUp(1)} className="px-5 pt-4">
        <PosterCard accent="coral" className="!p-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              { who: data.userName, mood: data.userMood, dot: "var(--color-preference-me)" },
              { who: data.partnerName, mood: data.partnerMood, dot: "var(--color-preference-partner)" },
            ].map((m) => (
              <Link key={m.who} href="/us/prompts" className="flex items-center gap-3">
                <span className="text-2xl leading-none">{m.mood?.emoji ?? "·"}</span>
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ background: m.dot }} />
                    <span className="truncate text-[13px] font-bold" style={{ fontFamily: "var(--font-body)", color: "var(--foreground)" }}>
                      {m.who}
                    </span>
                  </span>
                  <span className="block truncate text-[12px]" style={{ color: "var(--color-ink-soft)" }}>
                    {m.mood?.label ?? "tap to share"}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </PosterCard>
      </motion.section>

      {/* ── Today's one thing ── */}
      {data.today && (
        <motion.section {...fadeUp(2)} className="px-5 pt-3">
          <Link href={data.today.href}>
            <PosterCard accent="amber" interactive>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ fontFamily: "var(--font-nav)", color: "var(--color-terracotta)" }}>
                {data.today.kind}
              </p>
              <p className="mt-1.5 text-[19px] leading-snug" style={{ fontFamily: "var(--font-serif)", color: "var(--foreground)" }}>
                {data.today.title}
              </p>
              <p className="mt-1 text-[14px]" style={{ color: "var(--color-ink-soft)" }}>{data.today.body}</p>
            </PosterCard>
          </Link>
        </motion.section>
      )}

      {/* ── Keepsake peek ── */}
      {data.keepsakes.length > 0 && (
      <motion.section {...fadeUp(3)} className="px-5 pt-3">
        <SectionHeader title="Your keepsake" href="/keepsake" />
        <div className="mt-2 flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {data.keepsakes.map((k, i) => (
            <Link key={i} href="/keepsake" className="shrink-0">
              <div className="w-[132px] overflow-hidden rounded-2xl border" style={{ borderColor: "var(--border)", boxShadow: "var(--shadow-warm-sm)" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={k.thumb} alt="" onError={hideOnError} className="h-[96px] w-[132px] object-cover" />
                <div className="px-2.5 py-2" style={{ background: "var(--card)" }}>
                  <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--color-ink-soft)" }}>{k.tag}</p>
                  <p className="mt-0.5 line-clamp-2 text-[12px] leading-snug" style={{ fontFamily: "var(--font-serif)", color: "var(--foreground)" }}>{k.line}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </motion.section>
      )}

      <motion.section {...fadeUp(4)} className="px-5 pt-3">
        <Link href="/treasury">
          <PosterCard accent="terracotta" interactive className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Coin amount={data.balance} size={34} />
              <span className="text-[12px]" style={{ color: "var(--color-ink-soft)" }}>our joy pot</span>
            </div>
            {data.coupon ? (
              <span className="max-w-[44%] truncate rounded-full px-3 py-1.5 text-[12px] font-semibold" style={{ background: "var(--color-coral)", color: "#FFF7EF", fontFamily: "var(--font-body)" }}>
                🎟 {data.coupon.title}
              </span>
            ) : (
              <ChevronRight size={18} style={{ color: "var(--color-ink-soft)" }} />
            )}
          </PosterCard>
        </Link>
      </motion.section>

      {/* ── Travels ── */}
      <motion.section {...fadeUp(5)} className="px-5 pt-3">
        <Link href="/travels" aria-label="Travels">
          <PosterCard accent="teal" interactive className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span
                className="grid h-10 w-10 place-items-center rounded-xl"
                style={{ background: "var(--color-sand)", color: "var(--color-teal-deep)" }}
              >
                <Plane size={20} strokeWidth={2} />
              </span>
              <span>
                <span
                  className="block text-[15px] font-bold"
                  style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}
                >
                  Travels
                </span>
                <span className="block text-[12px]" style={{ color: "var(--color-ink-soft)" }}>
                  everywhere you&apos;ve wandered
                </span>
              </span>
            </div>
            <ChevronRight size={18} style={{ color: "var(--color-ink-soft)" }} />
          </PosterCard>
        </Link>
      </motion.section>

      {/* ── Quick rooms ── */}
      <motion.section {...fadeUp(6)} className="px-5 pt-4">
        <div className="grid grid-cols-2 gap-3">
          {data.rooms.map((r) => (
            <Link key={r.href} href={r.href}>
              <PosterCard interactive grain={false} className="!p-4 flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-xl text-xl" style={{ background: "var(--color-sand)" }}>{r.icon}</span>
                <span className="text-[14px] font-bold" style={{ fontFamily: "var(--font-body)", color: "var(--foreground)" }}>{r.label}</span>
              </PosterCard>
            </Link>
          ))}
        </div>
      </motion.section>
    </div>
  )
}

function SectionHeader({ title, href }: { title: string; href: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <h2 className="text-[17px] font-bold tracking-tight" style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}>{title}</h2>
      <Link href={href} className={cn("flex items-center gap-0.5 text-[12px] font-semibold")} style={{ color: "var(--color-terracotta)" }}>
        all <ChevronRight size={13} />
      </Link>
    </div>
  )
}

/** Mock data for /preview + as a shape reference. */
export const HOME_MOCK: HomeViewData = {
  userName: "Yahya",
  partnerName: "Yara",
  greeting: "Thursday · golden hour",
  subNote: "3 new keepsakes this week ♡",
  userMood: { emoji: "🙂", label: "content" },
  partnerMood: { emoji: "🥰", label: "in love" },
  today: {
    kind: "A gentle prompt",
    title: "What did you think of me, the very first time?",
    body: "Answer to unlock hers · Deep Dive",
    href: "/us/connect",
  },
  keepsakes: [
    { thumb: "/assets/scenes/scene-keepsake-open.webp", line: "You laughed so hard you forgot your own joke.", tag: "14 Jun" },
    { thumb: "/assets/scenes/scene-rooftop-cups.webp", line: "Coffee on the roof, no phones.", tag: "12 Jun" },
    { thumb: "/assets/scenes/scene-garden-rooftop.webp", line: "The jasmine finally bloomed.", tag: "9 Jun" },
  ],
  balance: 248,
  coupon: { title: "One movie night", from: "Yara" },
  rooms: [
    { label: "Play", icon: "🎲", href: "/wheel", accent: "coral" },
    { label: "Soul", icon: "🌙", href: "/me/soul", accent: "teal" },
    { label: "Snap", icon: "📷", href: "/snap", accent: "amber" },
    { label: "Plan", icon: "🗓", href: "/us/calendar", accent: "indigo" },
  ],
  avatarUrl: null,
}

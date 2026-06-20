import React from "react"
import { render, screen, within } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"

/**
 * Home Page (calm living-room redesign).
 *
 * The old test asserted a 23-widget firehose (SharedGarden compact,
 * DaysTogetherCounter, QuickActionCards, MoodStrip, HomeSnapWidget, CoyynsWidget,
 * HomeMarketplaceRow, HomeCouponInbox, FeelingGenerousCTA, prayer/cycle/calendar/
 * rituals widgets, active-purchase cards, …). That markup is GONE — the page now
 * renders the props-driven HomeView (greeting hero, "two of you" moods, today's
 * one thing, keepsake peek, treasury peek with Coin, quick rooms). Those legacy
 * assertions were deleted (see "deleted" notes at the bottom of this file).
 *
 * Here we render the REAL HomeView (not a stub) so we can assert that real
 * profile name / wallet balance flow through the page's derivation, and that the
 * redesigned surface is present. Only the hooks the page reads (useAuth,
 * useCoyyns, useGarden) are mocked.
 */

// ── Hoisted hook mocks (factories reference these) ──────────────
const { useAuth, useCoyyns, recordOpened, useMood, useSnap, useCoupons } = vi.hoisted(() => ({
  useAuth: vi.fn(),
  useCoyyns: vi.fn(),
  recordOpened: vi.fn(),
  useMood: vi.fn(),
  useSnap: vi.fn(),
  useCoupons: vi.fn(),
}))

// ── framer-motion — Proxy passthrough for any motion.* tag ──────
vi.mock("framer-motion", () => {
  const passthrough = (tag: string) =>
    React.forwardRef(
      (
        { children, ...props }: { children?: React.ReactNode; [key: string]: unknown },
        ref: React.Ref<HTMLElement>,
      ) => {
        const {
          initial, animate, exit, transition, whileHover, whileTap,
          whileInView, layout, layoutId, variants, drag, ...rest
        } = props
        void initial; void animate; void exit; void transition; void whileHover
        void whileTap; void whileInView; void layout; void layoutId; void variants; void drag
        return React.createElement(tag, { ref, ...rest }, children as React.ReactNode)
      },
    )
  const motion = new Proxy({}, { get: (_t, tag: string) => passthrough(tag) })
  return {
    motion,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  }
})

// next/link → plain anchor so we can assert hrefs (rooms, treasury, settings).
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

// The three hooks the page reads directly.
vi.mock("@/lib/providers/AuthProvider", () => ({ useAuth: () => useAuth() }))
vi.mock("@/lib/hooks/use-coyyns", () => ({ useCoyyns: () => useCoyyns() }))
vi.mock("@/lib/hooks/use-garden", () => ({
  useGarden: () => ({
    gardenDays: [],
    recentFlowers: [],
    isLoading: false,
    error: null,
    recordOpened,
  }),
}))
// Mood / snap / coupon feed the home peeks; default to empty (overridable per test).
vi.mock("@/lib/hooks/use-mood", () => ({ useMood: () => useMood() }))
vi.mock("@/lib/hooks/use-snap", () => ({ useSnap: () => useSnap() }))
vi.mock("@/lib/hooks/use-coupons", () => ({ useCoupons: () => useCoupons() }))

import Home from "@/app/(main)/page"

// ── Fixtures ────────────────────────────────────────────────────
const PROFILE = {
  id: "user-1",
  display_name: "Yahya Elghobashy",
  email: "yahya@test.com",
  avatar_url: null,
  partner_id: "user-2",
  role: "user",
  created_at: "",
  updated_at: "",
}
const PARTNER = {
  id: "user-2",
  display_name: "Yara Mostafa",
  email: "yara@test.com",
  avatar_url: null,
  partner_id: "user-1",
  role: "user",
  created_at: "",
  updated_at: "",
}

function setAuth(over: Partial<{ profile: unknown; partner: unknown }> = {}) {
  useAuth.mockReturnValue({
    user: { id: "user-1", email: "yahya@test.com" },
    profile: "profile" in over ? over.profile : PROFILE,
    partner: "partner" in over ? over.partner : PARTNER,
    isLoading: false,
    profileNeedsSetup: false,
    signOut: vi.fn(),
    refreshProfile: vi.fn(),
  })
}

function setWallet(balance: number | null) {
  useCoyyns.mockReturnValue({
    wallet: balance === null ? null : { id: "w-1", user_id: "user-1", balance },
    partnerWallet: null,
    transactions: [],
    isLoading: false,
    error: null,
    addCoyyns: vi.fn(),
    spendCoyyns: vi.fn(),
    refreshWallet: vi.fn(),
  })
}

function setMood(today: string | null, partnerM: string | null = null) {
  useMood.mockReturnValue({
    todayMood: today ? { mood: today } : null,
    partnerMood: partnerM ? { mood: partnerM } : null,
    setMood: vi.fn(),
  })
}
function setSnaps(feed: unknown[]) {
  useSnap.mockReturnValue({ snapFeed: feed })
}
function setCoupons(received: unknown[]) {
  useCoupons.mockReturnValue({ receivedCoupons: received, myCoupons: [] })
}

describe("Home Page (calm living-room)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setAuth()
    setWallet(248)
    setMood(null)
    setSnaps([])
    setCoupons([])
  })

  // ── Wiring: real mood / keepsake / coupon flow into the page ──
  it("renders the user's real mood emoji + label from useMood", () => {
    setMood("loving")
    render(<Home />)
    expect(screen.getByText("🥰")).toBeInTheDocument()
    expect(screen.getByText("Loving")).toBeInTheDocument()
  })

  it("shows a snap from the feed as a keepsake peek", () => {
    setSnaps([{ id: "s1", user_id: "user-2", snap_date: "2026-06-19", photo_url: "/x.jpg", caption: "sunset walk", reaction_emoji: null }])
    render(<Home />)
    expect(screen.getByText("sunset walk")).toBeInTheDocument()
  })

  it("shows the partner's active coupon in the treasury peek", () => {
    setCoupons([{ id: "c1", title: "Breakfast in bed", status: "active" }])
    render(<Home />)
    expect(screen.getByText(/Breakfast in bed/)).toBeInTheDocument()
  })

  // ── Surface: the redesigned hero renders ──────────────────────

  it("renders the greeting hero ('Welcome home, you two.')", () => {
    render(<Home />)
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/Welcome home/i)
    expect(screen.getByText("you two.")).toBeInTheDocument()
  })

  it("renders the Hayah wordmark and the Settings link", () => {
    render(<Home />)
    expect(screen.getByText(/Ha/).closest("span")).toBeInTheDocument()
    expect(screen.getByLabelText("Settings")).toHaveAttribute("href", "/settings")
    expect(screen.getByLabelText("You")).toHaveAttribute("href", "/me")
  })

  // ── Unit: real profile names flow through the derivation ──────

  it("derives the user's FIRST name from profile.display_name", () => {
    // "Yahya Elghobashy" → "Yahya"
    render(<Home />)
    expect(screen.getByText("Yahya")).toBeInTheDocument()
    expect(screen.queryByText("Yahya Elghobashy")).not.toBeInTheDocument()
  })

  it("derives the partner's FIRST name from partner.display_name", () => {
    // "Yara Mostafa" → "Yara"
    render(<Home />)
    expect(screen.getByText("Yara")).toBeInTheDocument()
    expect(screen.queryByText("Yara Mostafa")).not.toBeInTheDocument()
  })

  it("renders the avatar fallback initial when avatar_url is null", () => {
    render(<Home />)
    // First letter of the user's first name, inside the /me avatar link.
    const youLink = screen.getByLabelText("You")
    expect(within(youLink).getByText("Y")).toBeInTheDocument()
  })

  it("falls back to 'You' / 'your love' when profile + partner are null", () => {
    setAuth({ profile: null, partner: null })
    render(<Home />)
    expect(screen.getByText("You")).toBeInTheDocument()
    expect(screen.getByText("your love")).toBeInTheDocument()
  })

  // ── Unit: wallet balance flows into the treasury Coin ─────────

  it("renders the wallet balance (locale-formatted) in the treasury peek", () => {
    setWallet(1248)
    render(<Home />)
    expect(screen.getByText("1,248")).toBeInTheDocument()
    expect(screen.getByText("our joy pot")).toBeInTheDocument()
  })

  it("renders balance 0 when there is no wallet", () => {
    setWallet(null)
    render(<Home />)
    const treasury = screen.getByText("our joy pot").closest("a")
    expect(treasury).toHaveAttribute("href", "/treasury")
    expect(within(treasury as HTMLElement).getByText("0")).toBeInTheDocument()
  })

  // ── Surface: today's one thing card (from the page's data) ────

  it("renders today's one thing card linking to /keepsake", () => {
    render(<Home />)
    const today = screen.getByText(/Add a little something to your keepsake/i)
    expect(today).toBeInTheDocument()
    expect(today.closest("a")).toHaveAttribute("href", "/keepsake")
  })

  // ── Interaction / integration: quick rooms link to the right routes ──

  it("renders the four quick rooms with correct hrefs", () => {
    render(<Home />)
    const expected: [string, string][] = [
      ["Play", "/wheel"],
      ["Soul", "/me/soul"],
      ["Snap", "/snap"],
      ["Plan", "/us/calendar"],
    ]
    for (const [label, href] of expected) {
      const room = screen.getByText(label)
      expect(room.closest("a")).toHaveAttribute("href", href)
    }
  })

  it("links the 'two of you' moods to /us/prompts", () => {
    render(<Home />)
    // Both mood rows (Yahya + Yara) link to the connect/prompts surface.
    const yahyaRow = screen.getByText("Yahya").closest("a")
    const yaraRow = screen.getByText("Yara").closest("a")
    expect(yahyaRow).toHaveAttribute("href", "/us/prompts")
    expect(yaraRow).toHaveAttribute("href", "/us/prompts")
  })

  it("shows 'tap to share' placeholders since no moods are wired yet", () => {
    render(<Home />)
    // page passes userMood/partnerMood = null → both fall back to "tap to share".
    expect(screen.getAllByText("tap to share")).toHaveLength(2)
  })

  // ── Integration: recordOpened fires on mount (preserved garden behaviour) ──

  it("calls useGarden().recordOpened() exactly once on mount", () => {
    render(<Home />)
    expect(recordOpened).toHaveBeenCalledTimes(1)
  })

  // ── Regression: the removed 23-widget firehose is GONE ────────

  it("does NOT render the removed legacy widgets / copy", () => {
    render(<Home />)
    // QuickActionCards heading (removed) + a few representative widgets.
    expect(screen.queryByText("Your shared space")).not.toBeInTheDocument()
    expect(screen.queryByText("DaysTogetherCounter")).not.toBeInTheDocument()
    expect(screen.queryByText("SharedGarden")).not.toBeInTheDocument()
    expect(screen.queryByText("MoodStrip")).not.toBeInTheDocument()
    expect(screen.queryByTestId("shared-garden")).not.toBeInTheDocument()
    expect(screen.queryByTestId("days-together-counter")).not.toBeInTheDocument()
  })
})

/*
 * DELETED (legacy assertions, with reasons):
 * - "renders without crashing" → forbidden render-only assertion.
 * - HomeGreeting / MoodPicker / PartnerMoodIndicator / MoodStrip / HomeSnapWidget /
 *   CoyynsWidget / HomeMarketplaceRow / HomeCouponInbox / FeelingGenerousCTA /
 *   HomeRitualsWidget / HomeCalendarPeek / HomeCycleWidget / HomePrayerWidget /
 *   HomeLetterPrompt / HomeEvaluationPrompt / HomeCountdownWidget →
 *   none of these components are rendered by the redesigned page anymore.
 * - Active purchases (ActivePurchaseCard, useActivePurchases) → the page no longer
 *   reads use-active-purchases or renders purchase cards.
 * - SharedGarden (compact) + DaysTogetherCounter → removed from the Home surface
 *   (the garden hook is still read only for recordOpened()).
 * - "QuickActionCards removed (T1016)" → kept the intent as a regression check
 *   ("Your shared space" must not appear) folded into the GONE test above.
 */

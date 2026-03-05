import React from "react"
import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"

// ── Mock child components to avoid deep import chains (OOM) ────
vi.mock("@/components/animations", () => ({
  PageTransition: ({ children }: { children: React.ReactNode }) => <div data-testid="page-transition">{children}</div>,
}))

vi.mock("@/components/home/HomeGreeting", () => ({
  HomeGreeting: () => <div data-testid="home-greeting">Hello, Yahya — Monday, March 2</div>,
}))

vi.mock("@/components/mood/MoodPicker", () => ({
  MoodPicker: ({ className }: { className?: string }) => <div data-testid="mood-picker" className={className}>MoodPicker</div>,
}))

vi.mock("@/components/home/PartnerMoodIndicator", () => ({
  PartnerMoodIndicator: () => <div data-testid="partner-mood-indicator">PartnerMoodIndicator</div>,
}))

vi.mock("@/components/home/MoodStrip", () => ({
  MoodStrip: ({ className }: { className?: string }) => <div data-testid="mood-strip" className={className}>MoodStrip</div>,
}))

vi.mock("@/components/home/HomeSnapWidget", () => ({
  HomeSnapWidget: ({ className }: { className?: string }) => <div data-testid="home-snap-widget" className={className}>HomeSnapWidget</div>,
}))

vi.mock("@/components/home/CoyynsWidget", () => ({
  CoyynsWidget: () => <div data-testid="coyyns-widget">CoYYns</div>,
}))

vi.mock("@/components/home/HomeMarketplaceRow", () => ({
  HomeMarketplaceRow: ({ className }: { className?: string }) => <div data-testid="marketplace-row" className={className}>MarketplaceRow</div>,
}))

vi.mock("@/components/marketplace/ActivePurchaseCard", () => ({
  ActivePurchaseCard: ({ purchase }: { purchase: { id: string } }) => <div data-testid={`purchase-${purchase.id}`}>ActivePurchase</div>,
}))

vi.mock("@/components/home/HomeCouponInbox", () => ({
  HomeCouponInbox: () => <div data-testid="coupon-inbox">CouponInbox</div>,
}))

vi.mock("@/components/home/FeelingGenerousCTA", () => ({
  FeelingGenerousCTA: () => <div data-testid="generous-cta">GenerousCTA</div>,
}))

vi.mock("@/components/home/HomeRitualsWidget", () => ({
  HomeRitualsWidget: () => <div data-testid="rituals-widget">RitualsWidget</div>,
}))

vi.mock("@/components/home/HomeCalendarPeek", () => ({
  HomeCalendarPeek: () => <div data-testid="calendar-peek">CalendarPeek</div>,
}))

vi.mock("@/components/home/HomeCycleWidget", () => ({
  HomeCycleWidget: () => <div data-testid="cycle-widget">CycleWidget</div>,
}))

vi.mock("@/components/home/HomePrayerWidget", () => ({
  HomePrayerWidget: () => <div data-testid="prayer-widget">PrayerWidget</div>,
}))

vi.mock("@/components/garden/SharedGarden", () => ({
  SharedGarden: ({ compact }: { compact?: boolean }) => <div data-testid="shared-garden" data-compact={compact}>SharedGarden</div>,
}))

vi.mock("@/components/shared/DaysTogetherCounter", () => ({
  DaysTogetherCounter: () => <div data-testid="days-together-counter">DaysTogetherCounter</div>,
}))

vi.mock("@/components/home/HomeLetterPrompt", () => ({
  HomeLetterPrompt: () => <div data-testid="letter-prompt">LetterPrompt</div>,
}))

vi.mock("@/components/home/HomeEvaluationPrompt", () => ({
  HomeEvaluationPrompt: () => <div data-testid="evaluation-prompt">EvaluationPrompt</div>,
}))

vi.mock("@/components/home/HomeCountdownWidget", () => ({
  HomeCountdownWidget: () => <div data-testid="countdown-widget">CountdownWidget</div>,
}))

// ── Mock hooks used directly by the page ──────────────────────

const mockRecordOpened = vi.fn()
vi.mock("@/lib/hooks/use-garden", () => ({
  useGarden: () => ({
    gardenDays: [],
    recentFlowers: [],
    isLoading: false,
    error: null,
    recordOpened: mockRecordOpened,
  }),
}))

const MOCK_PURCHASES = [
  { id: "p-1", item_name: "Test Purchase" },
]

let mockActivePurchases: unknown[] = []
vi.mock("@/lib/hooks/use-active-purchases", () => ({
  useActivePurchases: () => ({
    activePurchases: mockActivePurchases,
    acknowledgePurchase: vi.fn(),
    completePurchase: vi.fn(),
    declinePurchase: vi.fn(),
  }),
}))

import Home from "@/app/(main)/page"

describe("Home Page", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockActivePurchases = []
  })

  // ── Renders at all ──────────────────────────────────────────

  it("renders without crashing", () => {
    render(<Home />)
    expect(screen.getByTestId("page-transition")).toBeInTheDocument()
  })

  // ── Section 1: Greeting + MoodPicker ────────────────────────

  it("renders HomeGreeting", () => {
    render(<Home />)
    expect(screen.getByTestId("home-greeting")).toBeInTheDocument()
  })

  it("renders MoodPicker", () => {
    render(<Home />)
    expect(screen.getByTestId("mood-picker")).toBeInTheDocument()
  })

  // ── Section 2: PartnerMoodIndicator ─────────────────────────

  it("renders PartnerMoodIndicator", () => {
    render(<Home />)
    expect(screen.getByTestId("partner-mood-indicator")).toBeInTheDocument()
  })

  // ── Section 3: MoodStrip ────────────────────────────────────

  it("renders MoodStrip", () => {
    render(<Home />)
    expect(screen.getByTestId("mood-strip")).toBeInTheDocument()
  })

  // ── Section 4: HomeSnapWidget ───────────────────────────────

  it("renders HomeSnapWidget", () => {
    render(<Home />)
    expect(screen.getByTestId("home-snap-widget")).toBeInTheDocument()
  })

  // ── Section 5: CoYYns Hero ──────────────────────────────────

  it("renders CoyynsWidget", () => {
    render(<Home />)
    expect(screen.getByTestId("coyyns-widget")).toBeInTheDocument()
  })

  // ── Section 6: HomeMarketplaceRow ───────────────────────────

  it("renders HomeMarketplaceRow", () => {
    render(<Home />)
    expect(screen.getByTestId("marketplace-row")).toBeInTheDocument()
  })

  // ── Section 7: Active Purchases ─────────────────────────────

  it("renders active purchases when present", () => {
    mockActivePurchases = MOCK_PURCHASES
    render(<Home />)
    expect(screen.getByTestId("purchase-p-1")).toBeInTheDocument()
  })

  it("hides active purchases when empty", () => {
    mockActivePurchases = []
    render(<Home />)
    expect(screen.queryByTestId("purchase-p-1")).not.toBeInTheDocument()
  })

  // ── Section 8: HomeCouponInbox ──────────────────────────────

  it("renders HomeCouponInbox", () => {
    render(<Home />)
    expect(screen.getByTestId("coupon-inbox")).toBeInTheDocument()
  })

  // ── Section 9: FeelingGenerousCTA ───────────────────────────

  it("renders FeelingGenerousCTA", () => {
    render(<Home />)
    expect(screen.getByTestId("generous-cta")).toBeInTheDocument()
  })

  // ── Section 10: HomeRitualsWidget ───────────────────────────

  it("renders HomeRitualsWidget", () => {
    render(<Home />)
    expect(screen.getByTestId("rituals-widget")).toBeInTheDocument()
  })

  // ── Section 11: HomeCalendarPeek ────────────────────────────

  it("renders HomeCalendarPeek", () => {
    render(<Home />)
    expect(screen.getByTestId("calendar-peek")).toBeInTheDocument()
  })

  // ── Section 12: HomeCycleWidget ─────────────────────────────

  it("renders HomeCycleWidget", () => {
    render(<Home />)
    expect(screen.getByTestId("cycle-widget")).toBeInTheDocument()
  })

  // ── Section 13: HomePrayerWidget ────────────────────────────

  it("renders HomePrayerWidget", () => {
    render(<Home />)
    expect(screen.getByTestId("prayer-widget")).toBeInTheDocument()
  })

  // ── Section 14: SharedGarden (compact) ──────────────────────

  it("renders SharedGarden in compact mode", () => {
    render(<Home />)
    const garden = screen.getByTestId("shared-garden")
    expect(garden).toBeInTheDocument()
    expect(garden).toHaveAttribute("data-compact", "true")
  })

  // ── Section 15: DaysTogetherCounter ─────────────────────────

  it("renders DaysTogetherCounter", () => {
    render(<Home />)
    expect(screen.getByTestId("days-together-counter")).toBeInTheDocument()
  })

  // ── recordOpened called on mount ────────────────────────────

  it("calls recordOpened on mount for shared garden", () => {
    render(<Home />)
    expect(mockRecordOpened).toHaveBeenCalled()
  })

  // ── QuickActionCards removed ────────────────────────────────

  it("does not render QuickActionCards (removed in T1016)", () => {
    render(<Home />)
    expect(screen.queryByText("Your shared space")).not.toBeInTheDocument()
  })
})

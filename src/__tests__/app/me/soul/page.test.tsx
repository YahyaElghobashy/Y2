import React from "react"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach } from "vitest"

// ── Domain hook mocks (controlled data) ───────────────────────
//
// The page was redesigned to render the presentational <SoulView> fed by the
// real hooks usePrayer / useQuran / useAzkar (+ useAuth, indirectly). The old
// test asserted child trackers (PrayerTracker/QuranTracker/AzkarCounter/
// DailyAyah) that the page no longer renders — those assertions are deleted.
// We mock each hook to return controlled state so the page renders
// deterministically, then assert the real derived output + callbacks.

const mockTogglePrayer = vi.fn()
const mockIncrement = vi.fn()

type PrayerReturn = {
  today: Record<string, boolean> | null
  togglePrayer: typeof mockTogglePrayer
  completedCount: number
  isLoading: boolean
  error: string | null
}

function buildPrayerReturn(overrides: Partial<PrayerReturn> = {}): PrayerReturn {
  return {
    today: { fajr: true, dhuhr: true, asr: false, maghrib: false, isha: false },
    togglePrayer: mockTogglePrayer,
    completedCount: 2,
    isLoading: false,
    error: null,
    ...overrides,
  }
}

function buildQuranReturn(overrides: Record<string, unknown> = {}) {
  return {
    today: null,
    logPages: vi.fn(),
    monthlyTotal: 30, // 30 / (dailyGoal 2 × 30 = 60) → 50%
    dailyGoal: 2,
    setDailyGoal: vi.fn(),
    isLoading: false,
    error: null,
    ...overrides,
  }
}

function buildAzkarReturn(overrides: Record<string, unknown> = {}) {
  return {
    session: { target: 33, count: 7 },
    sessionType: "morning",
    increment: mockIncrement,
    reset: vi.fn(),
    setTarget: vi.fn(),
    switchType: vi.fn(),
    isLoading: false,
    error: null,
    justCompleted: false,
    ...overrides,
  }
}

const mockUsePrayer = vi.fn(() => buildPrayerReturn())
const mockUseQuran = vi.fn(() => buildQuranReturn())
const mockUseAzkar = vi.fn(() => buildAzkarReturn())

vi.mock("@/lib/hooks/use-prayer", () => ({
  usePrayer: () => mockUsePrayer(),
}))
vi.mock("@/lib/hooks/use-quran", () => ({
  useQuran: () => mockUseQuran(),
}))
vi.mock("@/lib/hooks/use-azkar", () => ({
  useAzkar: () => mockUseAzkar(),
}))

// Prayer TIMES hook (location-based). Default here: NO location set, so the
// times card (which would render prayer-name labels and collide with the
// prayer-tracker name assertions below) is not shown. Times rendering is
// covered separately in SoulView.prayer-times.test.tsx.
const mockDetectLocation = vi.fn().mockResolvedValue(true)
const mockUsePrayerTimes = vi.fn(() => ({
  times: null,
  rows: [],
  next: null,
  countdown: null,
  needsLocation: true,
  detectLocation: mockDetectLocation,
  setLocation: vi.fn(),
  isSaving: false,
  error: null,
}))
vi.mock("@/lib/hooks/use-prayer-times", () => ({
  usePrayerTimes: () => mockUsePrayerTimes(),
}))

vi.mock("@/lib/providers/AuthProvider", () => ({
  useAuth: () => ({
    user: { id: "u1" },
    profile: { id: "u1", display_name: "Yahya" },
    partner: { id: "p1", display_name: "Yara" },
    isLoading: false,
  }),
}))

// The daily ayah is deterministic-by-date in production; mock it to a fixed
// verse so attribution + verse assertions are stable regardless of run date.
// Defined inside the (hoisted) factory; re-imported below for the assertions.
vi.mock("@/lib/quran/daily-ayah", () => ({
  getDailyAyah: () => ({
    surah: 94,
    ayah: 6,
    ref: "94:6",
    surahNameAr: "الشرح",
    surahNameEn: "Ash-Sharh",
    arabic: "إِنَّ مَعَ ٱلْعُسْرِ يُسْرًا",
    translation: "Indeed, with hardship [will be] ease.",
  }),
}))

// ── Presentational / animation mocks ──────────────────────────

vi.mock("framer-motion", () => ({
  motion: {
    div: React.forwardRef(
      ({ children, whileTap, whileHover, ...rest }: { children?: React.ReactNode; [k: string]: unknown }, ref: React.Ref<HTMLDivElement>) => (
        <div ref={ref} {...rest}>{children}</div>
      )
    ),
    button: React.forwardRef(
      ({ children, whileTap, whileHover, ...rest }: { children?: React.ReactNode; [k: string]: unknown }, ref: React.Ref<HTMLButtonElement>) => (
        <button ref={ref} {...rest}>{children}</button>
      )
    ),
    span: React.forwardRef(
      ({ children, whileTap, whileHover, ...rest }: { children?: React.ReactNode; [k: string]: unknown }, ref: React.Ref<HTMLSpanElement>) => (
        <span ref={ref} {...rest}>{children}</span>
      )
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock("@/components/animations", () => ({
  PageTransition: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="page-transition">{children}</div>
  ),
}))

vi.mock("@/components/shared/PageHeader", () => ({
  PageHeader: ({ title, backHref }: { title: string; backHref?: string }) => (
    <div data-testid="page-header" data-title={title} data-back={backHref}>{title}</div>
  ),
}))

vi.mock("@/components/shared/LoadingSkeleton", () => ({
  LoadingSkeleton: ({ count, variant }: { count?: number; variant?: string }) => (
    <div data-testid="soul-loading" data-count={count} data-variant={variant}>loading</div>
  ),
}))

import SoulPage from "@/app/(main)/me/soul/page"
import { getDailyAyah } from "@/lib/quran/daily-ayah"

// The verse the page will render (sourced from the mocked getDailyAyah above).
const MOCK_AYAH = getDailyAyah()

const PRAYER_LABELS = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"]

/** The tappable prayer button wraps the icon + the prayer label. */
function prayerButton(label: string): HTMLElement {
  return screen.getByText(label).closest("button") as HTMLElement
}

beforeEach(() => {
  vi.clearAllMocks()
  mockUsePrayer.mockReturnValue(buildPrayerReturn())
  mockUseQuran.mockReturnValue(buildQuranReturn())
  mockUseAzkar.mockReturnValue(buildAzkarReturn())
})

describe("SoulPage", () => {
  // ── Unit: derived state renders correctly from mocked data ──
  describe("unit", () => {
    it("renders the loading skeleton (3 cards) while prayer data is loading", () => {
      mockUsePrayer.mockReturnValue(buildPrayerReturn({ today: null, isLoading: true }))
      render(<SoulPage />)
      const skeleton = screen.getByTestId("soul-loading")
      expect(skeleton).toBeInTheDocument()
      expect(skeleton).toHaveAttribute("data-count", "3")
      // While loading, the SoulView centerpiece is not yet rendered.
      expect(screen.queryByText(MOCK_AYAH.translation, { exact: false })).not.toBeInTheDocument()
    })

    it("renders the loading skeleton while quran data is loading", () => {
      mockUseQuran.mockReturnValue(buildQuranReturn({ isLoading: true }))
      render(<SoulPage />)
      expect(screen.getByTestId("soul-loading")).toBeInTheDocument()
    })

    it("renders the Soul hero heading once loaded", () => {
      render(<SoulPage />)
      expect(screen.getByRole("heading", { name: "Soul", level: 1 })).toBeInTheDocument()
    })

    it("renders all five prayer names as tappable controls", () => {
      render(<SoulPage />)
      for (const label of PRAYER_LABELS) {
        expect(prayerButton(label)).toBeInTheDocument()
      }
    })

    it("marks prayers that are done in the prayer log with a check (no mosque emoji)", () => {
      render(<SoulPage />)
      // fajr + dhuhr are true → the check icon (lucide renders an <svg>) is shown,
      // and the 🕌 placeholder is not.
      const fajr = prayerButton("Fajr")
      expect(fajr.querySelector("svg")).toBeInTheDocument()
      expect(within(fajr).queryByText("🕌")).not.toBeInTheDocument()
    })

    it("shows the mosque placeholder for prayers that are not yet done", () => {
      render(<SoulPage />)
      // asr / maghrib / isha are false → placeholder emoji, no check svg.
      const asr = prayerButton("Asr")
      expect(within(asr).getByText("🕌")).toBeInTheDocument()
      expect(asr.querySelector("svg")).not.toBeInTheDocument()
    })

    it("renders the daily ayah arabic + translation + attribution from getDailyAyah", () => {
      render(<SoulPage />)
      expect(screen.getByText(MOCK_AYAH.arabic)).toBeInTheDocument()
      // Translation is wrapped in curly quotes by the view → match loosely.
      expect(screen.getByText(MOCK_AYAH.translation, { exact: false })).toBeInTheDocument()
      // Reference is "<surahNameEn> <ref>" → "Ash-Sharh 94:6"
      expect(screen.getByText(`${MOCK_AYAH.surahNameEn} ${MOCK_AYAH.ref}`)).toBeInTheDocument()
      expect(screen.getByText("Saheeh International")).toBeInTheDocument()
    })

    it("derives the Qur'an monthly percent from monthlyTotal / (dailyGoal × 30)", () => {
      // 30 / (2 × 30 = 60) = 50%
      render(<SoulPage />)
      expect(screen.getByText("50% this month")).toBeInTheDocument()
    })

    it("clamps the Qur'an percent at 100 when the monthly total exceeds the goal", () => {
      mockUseQuran.mockReturnValue(buildQuranReturn({ monthlyTotal: 500, dailyGoal: 2 }))
      render(<SoulPage />)
      expect(screen.getByText("100% this month")).toBeInTheDocument()
    })

    it("renders the azkar current count and target from the azkar session", () => {
      render(<SoulPage />)
      // count 7 / target 33
      expect(screen.getByText("7")).toBeInTheDocument()
      expect(screen.getByText("/ 33")).toBeInTheDocument()
    })

    it("falls back to a default azkar goal of 33 when the session has no target", () => {
      mockUseAzkar.mockReturnValue(buildAzkarReturn({ session: null }))
      render(<SoulPage />)
      expect(screen.getByText("/ 33")).toBeInTheDocument()
      // No session → current defaults to 0
      expect(screen.getByText("0")).toBeInTheDocument()
    })
  })

  // ── Interaction: user flows within the rendered view ─────────
  describe("interaction", () => {
    it("flips a pending prayer to done (check appears) when tapped", async () => {
      const user = userEvent.setup()
      render(<SoulPage />)
      const asr = prayerButton("Asr")
      // starts pending (placeholder, no check)
      expect(within(asr).getByText("🕌")).toBeInTheDocument()
      await user.click(asr)
      // local view state flips → check svg replaces the placeholder
      expect(prayerButton("Asr").querySelector("svg")).toBeInTheDocument()
      expect(within(prayerButton("Asr")).queryByText("🕌")).not.toBeInTheDocument()
    })

    it("increments the displayed azkar count when the counter is tapped", async () => {
      const user = userEvent.setup()
      render(<SoulPage />)
      // count button shows "7"; clicking the "tap to count" button bumps it to 8
      const counter = screen.getByText("7").closest("button") as HTMLElement
      await user.click(counter)
      expect(screen.getByText("8")).toBeInTheDocument()
    })

    it("caps the displayed azkar count at the goal", async () => {
      const user = userEvent.setup()
      mockUseAzkar.mockReturnValue(buildAzkarReturn({ session: { target: 3, count: 2 } }))
      render(<SoulPage />)
      const counter = screen.getByText("2").closest("button") as HTMLElement
      await user.click(counter) // 2 → 3
      await user.click(counter) // stays at 3 (goal)
      expect(screen.getByText("3")).toBeInTheDocument()
      expect(screen.getByText("/ 3")).toBeInTheDocument()
    })
  })

  // ── Integration: mocked hooks receive the correct calls ──────
  describe("integration", () => {
    it("consumes the prayer, quran and azkar hooks", () => {
      render(<SoulPage />)
      expect(mockUsePrayer).toHaveBeenCalled()
      expect(mockUseQuran).toHaveBeenCalled()
      expect(mockUseAzkar).toHaveBeenCalled()
    })

    it("calls togglePrayer with the prayer key when a prayer control is tapped", async () => {
      const user = userEvent.setup()
      render(<SoulPage />)
      await user.click(prayerButton("Fajr"))
      expect(mockTogglePrayer).toHaveBeenCalledTimes(1)
      expect(mockTogglePrayer).toHaveBeenCalledWith("fajr")
    })

    it("calls togglePrayer with the right key for a different prayer", async () => {
      const user = userEvent.setup()
      render(<SoulPage />)
      await user.click(prayerButton("Maghrib"))
      expect(mockTogglePrayer).toHaveBeenCalledTimes(1)
      expect(mockTogglePrayer).toHaveBeenCalledWith("maghrib")
    })

    it("calls increment on the azkar hook when the counter is tapped", async () => {
      const user = userEvent.setup()
      render(<SoulPage />)
      const counter = screen.getByText("7").closest("button") as HTMLElement
      await user.click(counter)
      expect(mockIncrement).toHaveBeenCalledTimes(1)
    })

    it("consumes usePrayerTimes and wires detectLocation to the location prompt", async () => {
      const user = userEvent.setup()
      render(<SoulPage />)
      expect(mockUsePrayerTimes).toHaveBeenCalled()
      // needsLocation=true in the default mock → the prompt is shown.
      await user.click(screen.getByTestId("set-location-button"))
      expect(mockDetectLocation).toHaveBeenCalledTimes(1)
    })
  })
})

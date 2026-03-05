import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"

// ── useSnap mock ──────────────────────────────────────────────

let mockSnapReturn = {
  todaySnap: null as null | { photo_url: string | null },
  partnerTodaySnap: null,
  snapFeed: [],
  isLoading: false,
  error: null,
  isWindowOpen: false,
  windowTimeRemaining: null as number | null,
  submitSnap: vi.fn(),
  reactToSnap: vi.fn(),
  loadMore: vi.fn(),
  hasMore: false,
}

vi.mock("@/lib/hooks/use-snap", () => ({
  useSnap: () => mockSnapReturn,
}))

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => {
      const safeProps: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(props)) {
        if (typeof v !== "object" || v === null) safeProps[k] = v
        else if (k === "className" || k === "style") safeProps[k] = v
        if (k.startsWith("data-")) safeProps[k] = v
      }
      return <div {...safeProps}>{children}</div>
    },
  },
}))

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

import { HomeSnapWidget } from "@/components/home/HomeSnapWidget"

describe("HomeSnapWidget", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSnapReturn = {
      todaySnap: null,
      partnerTodaySnap: null,
      snapFeed: [],
      isLoading: false,
      error: null,
      isWindowOpen: false,
      windowTimeRemaining: null,
      submitSnap: vi.fn(),
      reactToSnap: vi.fn(),
      loadMore: vi.fn(),
      hasMore: false,
    }
  })

  // ── State 1: Window open, not snapped ───────────────────────

  it("renders prominent CTA when window is open and not snapped", () => {
    mockSnapReturn = {
      ...mockSnapReturn,
      isWindowOpen: true,
      windowTimeRemaining: 180,
    }
    render(<HomeSnapWidget />)
    expect(screen.getByTestId("home-snap-widget")).toBeInTheDocument()
    expect(screen.getByText("Snap Time!")).toBeInTheDocument()
  })

  it("shows timer when window is open", () => {
    mockSnapReturn = {
      ...mockSnapReturn,
      isWindowOpen: true,
      windowTimeRemaining: 125, // 2:05
    }
    render(<HomeSnapWidget />)
    expect(screen.getByTestId("snap-timer")).toHaveTextContent("2:05 remaining")
  })

  it("links to /snap/capture when window is open", () => {
    mockSnapReturn = {
      ...mockSnapReturn,
      isWindowOpen: true,
      windowTimeRemaining: 300,
    }
    render(<HomeSnapWidget />)
    const link = screen.getByRole("link")
    expect(link).toHaveAttribute("href", "/snap/capture")
  })

  it("formats timer correctly for exact minutes", () => {
    mockSnapReturn = {
      ...mockSnapReturn,
      isWindowOpen: true,
      windowTimeRemaining: 60,
    }
    render(<HomeSnapWidget />)
    expect(screen.getByTestId("snap-timer")).toHaveTextContent("1:00 remaining")
  })

  it("formats timer correctly for zero seconds", () => {
    mockSnapReturn = {
      ...mockSnapReturn,
      isWindowOpen: true,
      windowTimeRemaining: 0,
    }
    render(<HomeSnapWidget />)
    expect(screen.getByTestId("snap-timer")).toHaveTextContent("0:00 remaining")
  })

  // ── State 2: Already snapped ────────────────────────────────

  it("renders 'Snapped!' when user has already taken snap", () => {
    mockSnapReturn = {
      ...mockSnapReturn,
      todaySnap: { photo_url: "https://example.com/photo.webp" },
    }
    render(<HomeSnapWidget />)
    expect(screen.getByTestId("home-snap-widget")).toBeInTheDocument()
    expect(screen.getByText("Snapped!")).toBeInTheDocument()
  })

  it("links to /snap feed when already snapped", () => {
    mockSnapReturn = {
      ...mockSnapReturn,
      todaySnap: { photo_url: "https://example.com/photo.webp" },
    }
    render(<HomeSnapWidget />)
    const link = screen.getByRole("link")
    expect(link).toHaveAttribute("href", "/snap")
  })

  // ── State 3: No window / nothing actionable ─────────────────

  it("returns null when no window and no snap", () => {
    const { container } = render(<HomeSnapWidget />)
    expect(container.innerHTML).toBe("")
  })

  it("returns null when loading", () => {
    mockSnapReturn = { ...mockSnapReturn, isLoading: true }
    const { container } = render(<HomeSnapWidget />)
    expect(container.innerHTML).toBe("")
  })

  // ── Window open but already snapped ─────────────────────────

  it("shows 'Snapped!' even if window is still open but user already snapped", () => {
    mockSnapReturn = {
      ...mockSnapReturn,
      isWindowOpen: true,
      windowTimeRemaining: 100,
      todaySnap: { photo_url: "https://example.com/photo.webp" },
    }
    render(<HomeSnapWidget />)
    expect(screen.getByText("Snapped!")).toBeInTheDocument()
  })

  // ── className pass-through ─────────────────────────────────

  it("accepts className prop", () => {
    mockSnapReturn = {
      ...mockSnapReturn,
      isWindowOpen: true,
      windowTimeRemaining: 300,
    }
    render(<HomeSnapWidget className="mt-4" />)
    const widget = screen.getByTestId("home-snap-widget")
    expect(widget.className).toContain("mt-4")
  })

  // ── Snap with null photo_url (placeholder) ─────────────────

  it("treats todaySnap with null photo_url as not yet snapped", () => {
    mockSnapReturn = {
      ...mockSnapReturn,
      isWindowOpen: true,
      windowTimeRemaining: 200,
      todaySnap: { photo_url: null },
    }
    render(<HomeSnapWidget />)
    expect(screen.getByText("Snap Time!")).toBeInTheDocument()
  })
})

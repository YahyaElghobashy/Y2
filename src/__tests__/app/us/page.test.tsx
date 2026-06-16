import { render, screen, within } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"

// ── Mock framer-motion ──────────────────────────────────────────
// Strip animation-only props so motion.div/header render as plain DOM.
vi.mock("framer-motion", () => ({
  motion: new Proxy(
    {},
    {
      get: (_target, tag: string) => {
        const Tag = tag as keyof React.JSX.IntrinsicElements
        return ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
          const {
            initial,
            animate,
            exit,
            transition,
            whileTap,
            whileHover,
            whileInView,
            viewport,
            layoutId,
            ...domProps
          } = props as Record<string, unknown>
          void initial
          void animate
          void exit
          void transition
          void whileTap
          void whileHover
          void whileInView
          void viewport
          void layoutId
          return <Tag {...(domProps as Record<string, unknown>)}>{children}</Tag>
        }
      },
    },
  ),
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}))

// next/link → plain anchor so we can assert hrefs the rooms link to.
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string
    children: React.ReactNode
    [key: string]: unknown
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

import UsPage from "@/app/(main)/us/page"

// The 5 rooms the hub must surface, in order, with their migration hrefs.
const EXPECTED_ROOMS = [
  { label: "Connect", line: "today's question", href: "/us/prompts" },
  { label: "Play", line: "games & the wheel", href: "/game/check-in" },
  { label: "Plan", line: "calendar & lists", href: "/us/calendar" },
  { label: "Watch", line: "what's next, together", href: "/us/watch" },
  { label: "Table", line: "places you love", href: "/our-table" },
]

describe("Us Page (WorldHub — Together)", () => {
  // ── UNIT: world identity (title + arabic + intro) renders ────────
  it("renders the world title 'Together' as the page heading", () => {
    render(<UsPage />)
    expect(screen.getByRole("heading", { name: "Together" })).toBeInTheDocument()
  })

  it("renders the Arabic world name (نحن)", () => {
    render(<UsPage />)
    expect(screen.getByText("نحن")).toBeInTheDocument()
  })

  it("renders the world intro line", () => {
    render(<UsPage />)
    expect(
      screen.getByText("Everything you do together — talk, play, plan, watch, taste."),
    ).toBeInTheDocument()
  })

  // ── UNIT: exactly five room links, no more ───────────────────────
  it("renders exactly five room links", () => {
    render(<UsPage />)
    expect(screen.getAllByRole("link")).toHaveLength(5)
  })

  // ── UNIT/INTEGRATION: each room renders with its label, line, href ──
  it.each(EXPECTED_ROOMS)(
    "renders the $label room linking to $href with its descriptive line",
    ({ label, line, href }) => {
      render(<UsPage />)
      // The label is the room's bold title text.
      const labelEl = screen.getByText(label)
      // It lives inside the anchor that points at the room's route.
      const link = labelEl.closest("a")
      expect(link).not.toBeNull()
      expect(link).toHaveAttribute("href", href)
      // The supporting line is rendered within the same room card.
      expect(within(link as HTMLElement).getByText(line)).toBeInTheDocument()
    },
  )

  // ── INTEGRATION: the full set of hrefs is present and correct ─────
  it("links every room to its expected route (no stale /us/coyyns redirect target)", () => {
    render(<UsPage />)
    const hrefs = screen.getAllByRole("link").map((a) => a.getAttribute("href"))
    expect(hrefs).toEqual(EXPECTED_ROOMS.map((r) => r.href))
    // The page no longer routes anything to the retired coyyns screen.
    expect(hrefs).not.toContain("/us/coyyns")
  })

  // ── UNIT: rooms appear in the authored order ─────────────────────
  it("renders the rooms in the authored order", () => {
    render(<UsPage />)
    // Read each room's label (the bold title in its card) in DOM order by
    // matching the label text within each anchor.
    const orderedLabels = screen.getAllByRole("link").map((link) => {
      const match = EXPECTED_ROOMS.find(
        (r) => within(link as HTMLElement).queryByText(r.label) !== null,
      )
      return match?.label
    })
    expect(orderedLabels).toEqual(EXPECTED_ROOMS.map((r) => r.label))
  })
})

/*
 * DELETED (no longer valid behavior):
 *   - "redirects to /us/coyyns"
 *   - "calls redirect exactly once"
 * WHY: the redesign replaced the /us redirect with WorldHub. The page now
 * renders the "Together" world hub (5 room links) instead of calling
 * next/navigation `redirect("/us/coyyns")`. The redirect codepath — and the
 * /us/coyyns destination — no longer exist in src/app/(main)/us/page.tsx, so
 * asserting the redirect would test removed behavior.
 */

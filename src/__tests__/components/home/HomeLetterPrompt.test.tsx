import React from "react"
import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

// ── Mocks ─────────────────────────────────────────────────────

const mockPartner = { id: "p1", display_name: "Yara" }

vi.mock("@/lib/providers/AuthProvider", () => ({
  useAuth: () => ({ partner: mockPartner }),
}))

vi.mock("framer-motion", () => ({
  motion: {
    div: React.forwardRef(
      ({ children, ...rest }: { children?: React.ReactNode; [k: string]: unknown }, ref: React.Ref<HTMLDivElement>) => (
        <div ref={ref} {...rest}>{children}</div>
      )
    ),
  },
}))

vi.mock("next/link", () => ({
  default: ({ children, href, ...rest }: { children: React.ReactNode; href: string; [k: string]: unknown }) => (
    <a href={href} {...rest}>{children}</a>
  ),
}))

import { HomeLetterPrompt } from "@/components/home/HomeLetterPrompt"

describe("HomeLetterPrompt", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // ── Unit Tests ──────────────────────────────────────────────

  describe("unit", () => {
    it("renders on 1st of month", () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date(2026, 2, 1, 10, 0, 0)) // March 1st
      render(<HomeLetterPrompt />)
      expect(screen.getByTestId("home-letter-prompt")).toBeInTheDocument()
      vi.useRealTimers()
    })

    it("returns null on non-1st day", () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date(2026, 2, 15, 10, 0, 0)) // March 15th
      const { container } = render(<HomeLetterPrompt />)
      expect(container.firstChild).toBeNull()
      vi.useRealTimers()
    })

    it("shows partner name", () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date(2026, 2, 1, 10, 0, 0))
      render(<HomeLetterPrompt />)
      expect(screen.getByText("Write a note to Yara")).toBeInTheDocument()
      vi.useRealTimers()
    })

    it("shows letter day text", () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date(2026, 2, 1, 10, 0, 0))
      render(<HomeLetterPrompt />)
      expect(screen.getByText("It's letter day!")).toBeInTheDocument()
      vi.useRealTimers()
    })
  })

  // ── Integration Tests ───────────────────────────────────────

  describe("integration", () => {
    it("links to /me/rituals", () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date(2026, 2, 1, 10, 0, 0))
      render(<HomeLetterPrompt />)
      const link = screen.getByTestId("home-letter-prompt").closest("a")
      expect(link).toHaveAttribute("href", "/me/rituals")
      vi.useRealTimers()
    })
  })
})

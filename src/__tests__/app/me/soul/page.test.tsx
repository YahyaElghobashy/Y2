import React from "react"
import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"

// Mock child components
vi.mock("@/components/animations", () => ({
  PageTransition: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="page-transition">{children}</div>
  ),
}))

vi.mock("@/components/shared/PageHeader", () => ({
  PageHeader: ({ title, backHref }: { title: string; backHref: string }) => (
    <div data-testid="page-header" data-title={title} data-back={backHref}>
      {title}
    </div>
  ),
}))

vi.mock("@/components/spiritual/PrayerTracker", () => ({
  PrayerTracker: () => <div data-testid="prayer-tracker">PrayerTracker</div>,
}))

vi.mock("@/components/spiritual/QuranTracker", () => ({
  QuranTracker: () => <div data-testid="quran-tracker">QuranTracker</div>,
}))

vi.mock("@/components/spiritual/AzkarCounter", () => ({
  AzkarCounter: () => <div data-testid="azkar-counter">AzkarCounter</div>,
}))

vi.mock("@/components/spiritual/DailyAyah", () => ({
  DailyAyah: () => <div data-testid="daily-ayah">DailyAyah</div>,
}))

import SoulPage from "@/app/(main)/me/soul/page"

describe("SoulPage (T618)", () => {
  // ── Unit Tests ──────────────────────────────────────────────

  describe("unit", () => {
    it("renders PageTransition wrapper", () => {
      render(<SoulPage />)
      expect(screen.getByTestId("page-transition")).toBeInTheDocument()
    })

    it("renders PageHeader with title Soul and back to /me", () => {
      render(<SoulPage />)
      const header = screen.getByTestId("page-header")
      expect(header).toHaveAttribute("data-title", "Soul")
      expect(header).toHaveAttribute("data-back", "/me")
    })

    it("renders PrayerTracker component", () => {
      render(<SoulPage />)
      expect(screen.getByText("PrayerTracker")).toBeInTheDocument()
    })

    it("renders QuranTracker component", () => {
      render(<SoulPage />)
      expect(screen.getByText("QuranTracker")).toBeInTheDocument()
    })

    it("renders AzkarCounter component", () => {
      render(<SoulPage />)
      expect(screen.getByText("AzkarCounter")).toBeInTheDocument()
    })

    it("renders DailyAyah component", () => {
      render(<SoulPage />)
      expect(screen.getByText("DailyAyah")).toBeInTheDocument()
    })
  })

  // ── Integration Tests ───────────────────────────────────────

  describe("integration", () => {
    it("renders all components in correct order within PageTransition", () => {
      render(<SoulPage />)
      const transition = screen.getByTestId("page-transition")
      // All children should be inside PageTransition
      expect(transition).toContainElement(screen.getByTestId("page-header"))
      expect(transition).toContainElement(screen.getByText("PrayerTracker"))
      expect(transition).toContainElement(screen.getByText("QuranTracker"))
      expect(transition).toContainElement(screen.getByText("AzkarCounter"))
      expect(transition).toContainElement(screen.getByText("DailyAyah"))
    })
  })
})

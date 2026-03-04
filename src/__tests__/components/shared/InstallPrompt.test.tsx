import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, act, waitFor } from "@testing-library/react"

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const htmlProps = Object.fromEntries(
        Object.entries(props).filter(([k]) =>
          /^[a-z]/.test(k) || k.startsWith("data-") || k === "className" || k === "style" || k === "onClick"
        )
      )
      return <div {...htmlProps}>{children}</div>
    },
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}))

import { InstallPrompt } from "@/components/shared/InstallPrompt"

describe("InstallPrompt", () => {
  let originalUserAgent: string

  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    localStorage.clear()
    originalUserAgent = navigator.userAgent

    // Default: not standalone, not iOS
    Object.defineProperty(window, "matchMedia", {
      value: vi.fn((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
      writable: true,
      configurable: true,
    })

    // Reset userAgent to desktop
    Object.defineProperty(navigator, "userAgent", {
      value: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120",
      writable: true,
      configurable: true,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    Object.defineProperty(navigator, "userAgent", {
      value: originalUserAgent,
      writable: true,
      configurable: true,
    })
  })

  function setIOSUserAgent() {
    Object.defineProperty(navigator, "userAgent", {
      value: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
      writable: true,
      configurable: true,
    })
  }

  function setStandalone() {
    Object.defineProperty(window, "matchMedia", {
      value: vi.fn((query: string) => ({
        matches: query.includes("standalone"),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
      writable: true,
      configurable: true,
    })
  }

  // ── Unit tests ──────────────────────────────────────────
  describe("unit", () => {
    it("does not render immediately", () => {
      render(<InstallPrompt />)
      expect(screen.queryByTestId("install-banner")).not.toBeInTheDocument()
    })

    it("does not render when in standalone mode", () => {
      setStandalone()
      render(<InstallPrompt />)
      act(() => { vi.advanceTimersByTime(5000) })
      expect(screen.queryByTestId("install-banner")).not.toBeInTheDocument()
    })

    it("does not render when recently dismissed", () => {
      localStorage.setItem("installPromptDismissedAt", new Date().toISOString())
      setIOSUserAgent()

      render(<InstallPrompt />)
      act(() => { vi.advanceTimersByTime(5000) })
      expect(screen.queryByTestId("install-banner")).not.toBeInTheDocument()
    })

    it("shows after 30-day dismiss expiry", () => {
      const thirtyOneDaysAgo = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString()
      localStorage.setItem("installPromptDismissedAt", thirtyOneDaysAgo)
      setIOSUserAgent()

      render(<InstallPrompt />)
      act(() => { vi.advanceTimersByTime(5000) })
      expect(screen.getByTestId("install-banner")).toBeInTheDocument()
    })

    it("renders install banner with correct content", () => {
      setIOSUserAgent()
      render(<InstallPrompt />)
      act(() => { vi.advanceTimersByTime(3000) })

      expect(screen.getByText("Install Hayah")).toBeInTheDocument()
      expect(screen.getByText(/Add to home screen/)).toBeInTheDocument()
      expect(screen.getByTestId("install-btn")).toBeInTheDocument()
      expect(screen.getByTestId("dismiss-install-btn")).toBeInTheDocument()
    })
  })

  // ── Interaction tests ───────────────────────────────────
  describe("interaction", () => {
    it("shows banner on iOS after 3s delay", () => {
      setIOSUserAgent()
      render(<InstallPrompt />)

      expect(screen.queryByTestId("install-banner")).not.toBeInTheDocument()
      act(() => { vi.advanceTimersByTime(3000) })
      expect(screen.getByTestId("install-banner")).toBeInTheDocument()
    })

    it("dismiss button stores timestamp and hides banner", () => {
      setIOSUserAgent()
      render(<InstallPrompt />)
      act(() => { vi.advanceTimersByTime(3000) })

      act(() => { screen.getByTestId("dismiss-install-btn").click() })
      expect(localStorage.getItem("installPromptDismissedAt")).toBeTruthy()
      expect(screen.queryByTestId("install-banner")).not.toBeInTheDocument()
    })

    it("shows banner when beforeinstallprompt fires", () => {
      render(<InstallPrompt />)

      const event = new Event("beforeinstallprompt", { cancelable: true })
      Object.assign(event, {
        prompt: vi.fn().mockResolvedValue(undefined),
        userChoice: Promise.resolve({ outcome: "dismissed" }),
      })
      act(() => { window.dispatchEvent(event) })
      act(() => { vi.advanceTimersByTime(3000) })

      expect(screen.getByTestId("install-banner")).toBeInTheDocument()
    })

    it("iOS install button opens instructions modal", () => {
      setIOSUserAgent()
      render(<InstallPrompt />)
      act(() => { vi.advanceTimersByTime(3000) })

      act(() => { screen.getByTestId("install-btn").click() })
      expect(screen.getByTestId("ios-instructions")).toBeInTheDocument()
      expect(screen.getByText("Install Hayah on iOS")).toBeInTheDocument()
      expect(screen.getByText(/Share button/)).toBeInTheDocument()
    })

    it("iOS 'Got it' dismisses and stores timestamp", () => {
      setIOSUserAgent()
      render(<InstallPrompt />)
      act(() => { vi.advanceTimersByTime(3000) })

      act(() => { screen.getByTestId("install-btn").click() })
      act(() => { screen.getByTestId("ios-dismiss-btn").click() })

      expect(screen.queryByTestId("ios-instructions")).not.toBeInTheDocument()
      expect(localStorage.getItem("installPromptDismissedAt")).toBeTruthy()
    })
  })

  // ── Integration tests ───────────────────────────────────
  describe("integration", () => {
    it("calls prompt() on Chrome install click", async () => {
      const mockPrompt = vi.fn().mockResolvedValue(undefined)
      const mockUserChoice = Promise.resolve({ outcome: "accepted" as const })

      render(<InstallPrompt />)

      const event = new Event("beforeinstallprompt", { cancelable: true })
      Object.assign(event, { prompt: mockPrompt, userChoice: mockUserChoice })
      act(() => { window.dispatchEvent(event) })
      act(() => { vi.advanceTimersByTime(3000) })

      await act(async () => {
        screen.getByTestId("install-btn").click()
        await mockUserChoice
      })

      expect(mockPrompt).toHaveBeenCalled()
    })

    it("hides banner after accepted install", async () => {
      const mockPrompt = vi.fn().mockResolvedValue(undefined)
      const mockUserChoice = Promise.resolve({ outcome: "accepted" as const })

      render(<InstallPrompt />)

      const event = new Event("beforeinstallprompt", { cancelable: true })
      Object.assign(event, { prompt: mockPrompt, userChoice: mockUserChoice })
      act(() => { window.dispatchEvent(event) })
      act(() => { vi.advanceTimersByTime(3000) })

      await act(async () => {
        screen.getByTestId("install-btn").click()
        await mockUserChoice
      })

      expect(screen.queryByTestId("install-banner")).not.toBeInTheDocument()
    })

    it("respects 30-day dismiss cooldown (29 days = still hidden)", () => {
      const twentyNineDaysAgo = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString()
      localStorage.setItem("installPromptDismissedAt", twentyNineDaysAgo)
      setIOSUserAgent()

      render(<InstallPrompt />)
      act(() => { vi.advanceTimersByTime(5000) })
      expect(screen.queryByTestId("install-banner")).not.toBeInTheDocument()
    })
  })
})

import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { initial, animate, exit, transition, ...rest } = props
      return <div {...rest}>{children}</div>
    },
    p: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { initial, animate, transition, ...rest } = props
      return <p {...rest}>{children}</p>
    },
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => children,
}))

// Mock pairing-link
vi.mock("@/lib/pairing-link", () => ({
  parsePairingCode: (url: string) => {
    try {
      const parsed = new URL(url)
      const match = parsed.pathname.match(/^\/pair\/([A-Z0-9]{6})$/i)
      return match?.[1]?.toUpperCase() ?? null
    } catch {
      return null
    }
  },
}))

import { QRCodeScanner } from "@/components/pairing/QRCodeScanner"

describe("QRCodeScanner", () => {
  const mockOnScan = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ── Unit Tests ──────────────────────────────────────────────

  describe("unit: initial state", () => {
    it("renders the Scan QR Code button", () => {
      render(<QRCodeScanner onScan={mockOnScan} />)
      expect(screen.getByTestId("scan-qr-btn")).toBeInTheDocument()
      expect(screen.getByText("Scan QR Code")).toBeInTheDocument()
    })

    it("does not show scanner overlay initially", () => {
      render(<QRCodeScanner onScan={mockOnScan} />)
      expect(screen.queryByTestId("scanner-overlay")).not.toBeInTheDocument()
    })
  })

  // ── Interaction Tests ───────────────────────────────────────

  describe("interaction", () => {
    it("opens scanner overlay when button is clicked", async () => {
      // Mock getUserMedia to succeed
      const mockStream = {
        getTracks: () => [{ stop: vi.fn() }],
      }
      vi.stubGlobal("navigator", {
        ...navigator,
        mediaDevices: {
          getUserMedia: vi.fn().mockResolvedValue(mockStream),
        },
      })

      render(<QRCodeScanner onScan={mockOnScan} />)
      fireEvent.click(screen.getByTestId("scan-qr-btn"))

      await waitFor(() => {
        expect(screen.getByTestId("scanner-overlay")).toBeInTheDocument()
      })

      vi.unstubAllGlobals()
    })

    it("shows error when camera access is denied", async () => {
      vi.stubGlobal("navigator", {
        ...navigator,
        mediaDevices: {
          getUserMedia: vi.fn().mockRejectedValue(new Error("Permission denied")),
        },
      })

      render(<QRCodeScanner onScan={mockOnScan} />)
      fireEvent.click(screen.getByTestId("scan-qr-btn"))

      await waitFor(() => {
        expect(screen.getByTestId("scanner-error")).toBeInTheDocument()
        expect(screen.getByText(/Camera access denied/)).toBeInTheDocument()
      })

      vi.unstubAllGlobals()
    })

    it("shows close button in scanner overlay", async () => {
      const mockStream = {
        getTracks: () => [{ stop: vi.fn() }],
      }
      vi.stubGlobal("navigator", {
        ...navigator,
        mediaDevices: {
          getUserMedia: vi.fn().mockResolvedValue(mockStream),
        },
      })

      render(<QRCodeScanner onScan={mockOnScan} />)
      fireEvent.click(screen.getByTestId("scan-qr-btn"))

      await waitFor(() => {
        expect(screen.getByTestId("scanner-close")).toBeInTheDocument()
      })

      vi.unstubAllGlobals()
    })

    it("closes scanner overlay when close button is clicked", async () => {
      const stopFn = vi.fn()
      const mockStream = {
        getTracks: () => [{ stop: stopFn }],
      }
      vi.stubGlobal("navigator", {
        ...navigator,
        mediaDevices: {
          getUserMedia: vi.fn().mockResolvedValue(mockStream),
        },
      })

      render(<QRCodeScanner onScan={mockOnScan} />)
      fireEvent.click(screen.getByTestId("scan-qr-btn"))

      await waitFor(() => {
        expect(screen.getByTestId("scanner-overlay")).toBeInTheDocument()
      })

      fireEvent.click(screen.getByTestId("scanner-close"))

      await waitFor(() => {
        expect(screen.queryByTestId("scanner-overlay")).not.toBeInTheDocument()
      })

      // Camera stream should be stopped
      expect(stopFn).toHaveBeenCalled()

      vi.unstubAllGlobals()
    })

    it("requests camera with environment facing mode", async () => {
      const getUserMedia = vi.fn().mockResolvedValue({
        getTracks: () => [{ stop: vi.fn() }],
      })
      vi.stubGlobal("navigator", {
        ...navigator,
        mediaDevices: { getUserMedia },
      })

      render(<QRCodeScanner onScan={mockOnScan} />)
      fireEvent.click(screen.getByTestId("scan-qr-btn"))

      await waitFor(() => {
        expect(getUserMedia).toHaveBeenCalledWith({
          video: { facingMode: "environment" },
        })
      })

      vi.unstubAllGlobals()
    })
  })

  // ── Integration Tests ───────────────────────────────────────

  describe("integration", () => {
    it("shows video element for camera feed", async () => {
      const mockStream = {
        getTracks: () => [{ stop: vi.fn() }],
      }
      vi.stubGlobal("navigator", {
        ...navigator,
        mediaDevices: {
          getUserMedia: vi.fn().mockResolvedValue(mockStream),
        },
      })

      render(<QRCodeScanner onScan={mockOnScan} />)
      fireEvent.click(screen.getByTestId("scan-qr-btn"))

      await waitFor(() => {
        expect(screen.getByTestId("scanner-video")).toBeInTheDocument()
      })

      vi.unstubAllGlobals()
    })

    it("shows viewfinder with corner markers", async () => {
      const mockStream = {
        getTracks: () => [{ stop: vi.fn() }],
      }
      vi.stubGlobal("navigator", {
        ...navigator,
        mediaDevices: {
          getUserMedia: vi.fn().mockResolvedValue(mockStream),
        },
      })

      render(<QRCodeScanner onScan={mockOnScan} />)
      fireEvent.click(screen.getByTestId("scan-qr-btn"))

      await waitFor(() => {
        expect(screen.getByTestId("scanner-viewfinder")).toBeInTheDocument()
      })

      vi.unstubAllGlobals()
    })
  })
})

import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { initial, animate, transition, ...rest } = props
      return <div {...rest}>{children}</div>
    },
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => children,
}))

// Mock qrcode module
const mockToDataURL = vi.fn()
vi.mock("qrcode", () => ({
  default: { toDataURL: (...args: unknown[]) => mockToDataURL(...args) },
  toDataURL: (...args: unknown[]) => mockToDataURL(...args),
}))

// Mock pairing-link
vi.mock("@/lib/pairing-link", () => ({
  generatePairingLink: (code: string) => `https://hayah.app/pair/${code}`,
}))

import { QRCodeDisplay } from "@/components/pairing/QRCodeDisplay"

describe("QRCodeDisplay", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockToDataURL.mockResolvedValue("data:image/png;base64,fake-qr-data")
  })

  // ── Unit Tests ──────────────────────────────────────────────

  describe("unit: loading state", () => {
    it("shows loading skeleton when code is null", () => {
      render(<QRCodeDisplay code={null} />)
      expect(screen.getByTestId("qr-display-loading")).toBeInTheDocument()
    })
  })

  describe("unit: display state", () => {
    it("renders the QR display container when code is provided", async () => {
      render(<QRCodeDisplay code="ABC123" />)
      await waitFor(() => {
        expect(screen.getByTestId("qr-display")).toBeInTheDocument()
      })
    })

    it("shows the invite code text", async () => {
      render(<QRCodeDisplay code="ABC123" />)
      await waitFor(() => {
        expect(screen.getByTestId("qr-code-text")).toHaveTextContent("ABC123")
      })
    })

    it("renders QR image after generation", async () => {
      render(<QRCodeDisplay code="ABC123" />)
      await waitFor(() => {
        expect(screen.getByTestId("qr-image")).toBeInTheDocument()
      })
    })

    it("calls QRCode.toDataURL with correct options", async () => {
      render(<QRCodeDisplay code="XYZ789" />)
      await waitFor(() => {
        expect(mockToDataURL).toHaveBeenCalledWith(
          "https://hayah.app/pair/XYZ789",
          expect.objectContaining({
            width: 200,
            color: { dark: "#C4956A", light: "#FBF8F4" },
          })
        )
      })
    })

    it("shows Copy Link and Share buttons", async () => {
      render(<QRCodeDisplay code="ABC123" />)
      await waitFor(() => {
        expect(screen.getByTestId("qr-copy-btn")).toBeInTheDocument()
        expect(screen.getByTestId("qr-share-btn")).toBeInTheDocument()
      })
    })
  })

  // ── Interaction Tests ───────────────────────────────────────

  describe("interaction", () => {
    it("copies pairing link to clipboard on Copy click", async () => {
      const writeText = vi.fn().mockResolvedValue(undefined)
      Object.assign(navigator, { clipboard: { writeText } })

      render(<QRCodeDisplay code="ABC123" />)
      await waitFor(() => screen.getByTestId("qr-copy-btn"))
      fireEvent.click(screen.getByTestId("qr-copy-btn"))

      expect(writeText).toHaveBeenCalledWith("https://hayah.app/pair/ABC123")
    })

    it("shows Copied! feedback after copying", async () => {
      const writeText = vi.fn().mockResolvedValue(undefined)
      Object.assign(navigator, { clipboard: { writeText } })

      render(<QRCodeDisplay code="ABC123" />)
      await waitFor(() => screen.getByTestId("qr-copy-btn"))
      fireEvent.click(screen.getByTestId("qr-copy-btn"))

      await waitFor(() => {
        expect(screen.getByText("Copied!")).toBeInTheDocument()
      })
    })

    it("calls navigator.share with pairing link on Share click", async () => {
      const share = vi.fn().mockResolvedValue(undefined)
      Object.assign(navigator, { share })

      render(<QRCodeDisplay code="ABC123" />)
      await waitFor(() => screen.getByTestId("qr-share-btn"))
      fireEvent.click(screen.getByTestId("qr-share-btn"))

      expect(share).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "https://hayah.app/pair/ABC123",
        })
      )
    })

    it("falls back to copy when navigator.share is unavailable", async () => {
      const writeText = vi.fn().mockResolvedValue(undefined)
      Object.assign(navigator, { clipboard: { writeText }, share: undefined })

      render(<QRCodeDisplay code="ABC123" />)
      await waitFor(() => screen.getByTestId("qr-share-btn"))
      fireEvent.click(screen.getByTestId("qr-share-btn"))

      expect(writeText).toHaveBeenCalledWith("https://hayah.app/pair/ABC123")
    })
  })

  // ── Integration Tests ───────────────────────────────────────

  describe("integration", () => {
    it("generates QR from the correct pairing URL", async () => {
      render(<QRCodeDisplay code="TEST99" />)
      await waitFor(() => {
        expect(mockToDataURL).toHaveBeenCalledWith(
          "https://hayah.app/pair/TEST99",
          expect.any(Object)
        )
      })
    })

    it("uses copper on cream color scheme", async () => {
      render(<QRCodeDisplay code="ABC123" />)
      await waitFor(() => {
        expect(mockToDataURL).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            color: { dark: "#C4956A", light: "#FBF8F4" },
          })
        )
      })
    })
  })
})

import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

// ── Mocks ──

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: { children?: React.ReactNode; [k: string]: unknown }) => {
      const safe: Record<string, unknown> = {}
      Object.keys(props).forEach((k) => {
        if (k === "style" || k === "className" || k.startsWith("data-") || k === "onClick") safe[k] = props[k]
      })
      return <div {...safe}>{children}</div>
    },
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

const mockToDataURL = vi.fn(() => Promise.resolve("data:image/png;base64,FAKE_QR"))
vi.mock("qrcode", () => ({
  default: { toDataURL: (...args: unknown[]) => mockToDataURL(...args) },
  toDataURL: (...args: unknown[]) => mockToDataURL(...args),
}))

// ── Imports ──

import { ShareModal } from "@/components/events/admin/ShareModal"

// ── Tests ──

describe("ShareModal", () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    portalTitle: "Wedding Portal",
    portalSlug: "wedding-abc1",
  }

  const mockWriteText = vi.fn(() => Promise.resolve())
  const mockShare = vi.fn(() => Promise.resolve())

  function setupClipboardMock() {
    Object.defineProperty(navigator, "clipboard", {
      get: () => ({ writeText: mockWriteText }),
      configurable: true,
    })
  }

  beforeEach(() => {
    vi.clearAllMocks()
    setupClipboardMock()
    Object.defineProperty(navigator, "share", {
      value: mockShare,
      writable: true,
      configurable: true,
    })
  })

  it("renders nothing when closed", () => {
    const { container } = render(<ShareModal {...defaultProps} isOpen={false} />)
    expect(container.innerHTML).toBe("")
  })

  it("renders modal when open", () => {
    render(<ShareModal {...defaultProps} />)
    expect(screen.getByTestId("share-modal")).toBeInTheDocument()
    expect(screen.getByText("Share Portal")).toBeInTheDocument()
  })

  it("displays the share URL", () => {
    render(<ShareModal {...defaultProps} />)
    const urlEl = screen.getByTestId("share-url")
    expect(urlEl.textContent).toContain("/e/wedding-abc1")
  })

  it("renders backdrop that calls onClose", async () => {
    const user = userEvent.setup()
    render(<ShareModal {...defaultProps} />)

    await user.click(screen.getByTestId("share-backdrop"))
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
  })

  it("renders close button that calls onClose", async () => {
    const user = userEvent.setup()
    render(<ShareModal {...defaultProps} />)

    await user.click(screen.getByTestId("share-close"))
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
  })

  it("copies URL to clipboard on copy click", async () => {
    const user = userEvent.setup()
    render(<ShareModal {...defaultProps} />)
    setupClipboardMock() // Re-apply after render (render may reset navigator)

    await user.click(screen.getByTestId("share-copy"))

    await waitFor(() => {
      expect(mockWriteText).toHaveBeenCalledWith(
        expect.stringContaining("/e/wedding-abc1")
      )
    })
  })

  it("shows 'Copied!' after copy", async () => {
    const user = userEvent.setup()
    render(<ShareModal {...defaultProps} />)
    setupClipboardMock()

    await user.click(screen.getByTestId("share-copy"))

    await waitFor(() => {
      expect(screen.getByText("Copied!")).toBeInTheDocument()
    })
  })

  it("opens WhatsApp share link", async () => {
    const origOpen = window.open
    const mockOpen = vi.fn()
    window.open = mockOpen

    const user = userEvent.setup()
    render(<ShareModal {...defaultProps} />)

    await user.click(screen.getByTestId("share-whatsapp"))

    expect(mockOpen).toHaveBeenCalledWith(
      expect.stringContaining("wa.me"),
      "_blank",
      "noopener,noreferrer"
    )
    // Should include portal title in the message
    expect(mockOpen.mock.calls[0][0]).toContain("Wedding%20Portal")

    window.open = origOpen
  })

  it("triggers navigator.share on native share click", async () => {
    const user = userEvent.setup()
    render(<ShareModal {...defaultProps} />)

    await user.click(screen.getByTestId("share-native"))

    expect(mockShare).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Wedding Portal",
        url: expect.stringContaining("/e/wedding-abc1"),
      })
    )
  })

  it("falls back to clipboard copy when navigator.share is undefined", async () => {
    // Set share=undefined BEFORE render
    Object.defineProperty(navigator, "share", {
      value: undefined,
      writable: true,
      configurable: true,
    })

    const user = userEvent.setup()
    render(<ShareModal {...defaultProps} />)
    setupClipboardMock() // Re-apply after render

    await user.click(screen.getByTestId("share-native"))

    await waitFor(() => {
      expect(mockWriteText).toHaveBeenCalledWith(
        expect.stringContaining("/e/wedding-abc1")
      )
    })
  })

  it("renders QR code toggle button", () => {
    render(<ShareModal {...defaultProps} />)
    expect(screen.getByTestId("share-qr-toggle")).toBeInTheDocument()
  })

  it("shows QR code section on toggle click", async () => {
    const user = userEvent.setup()
    render(<ShareModal {...defaultProps} />)

    expect(screen.queryByTestId("share-qr-section")).not.toBeInTheDocument()

    await user.click(screen.getByTestId("share-qr-toggle"))

    await waitFor(() => {
      expect(screen.getByTestId("share-qr-section")).toBeInTheDocument()
    })
  })

  it("generates QR code image when section is visible", async () => {
    const user = userEvent.setup()
    render(<ShareModal {...defaultProps} />)

    await user.click(screen.getByTestId("share-qr-toggle"))

    await waitFor(() => {
      expect(screen.getByTestId("share-qr-image")).toBeInTheDocument()
    })

    const img = screen.getByTestId("share-qr-image") as HTMLImageElement
    expect(img.src).toBe("data:image/png;base64,FAKE_QR")
    expect(mockToDataURL).toHaveBeenCalledWith(
      expect.stringContaining("/e/wedding-abc1"),
      expect.objectContaining({ width: 200 })
    )
  })

  it("hides QR section on second toggle click", async () => {
    const user = userEvent.setup()
    render(<ShareModal {...defaultProps} />)

    await user.click(screen.getByTestId("share-qr-toggle"))
    await waitFor(() => {
      expect(screen.getByTestId("share-qr-section")).toBeInTheDocument()
    })

    await user.click(screen.getByTestId("share-qr-toggle"))
    expect(screen.queryByTestId("share-qr-section")).not.toBeInTheDocument()
  })

  it("renders all three share option buttons", () => {
    render(<ShareModal {...defaultProps} />)
    expect(screen.getByTestId("share-whatsapp")).toBeInTheDocument()
    expect(screen.getByTestId("share-native")).toBeInTheDocument()
    expect(screen.getByTestId("share-qr-toggle")).toBeInTheDocument()
  })

  it("renders WhatsApp button text", () => {
    render(<ShareModal {...defaultProps} />)
    expect(screen.getByText("WhatsApp")).toBeInTheDocument()
  })
})

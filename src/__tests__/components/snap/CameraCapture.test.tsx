import React from "react"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach } from "vitest"

// ── useSnap mock ──────────────────────────────────────────────

const mockSubmitSnap = vi.fn()
const mockUseSnap: any = vi.fn(() => ({
  todaySnap: null,
  isWindowOpen: true,
  windowTimeRemaining: 250,
  submitSnap: mockSubmitSnap,
  error: null,
}))

vi.mock("@/lib/hooks/use-snap", () => ({
  useSnap: () => mockUseSnap(),
}))

// ── Auth mock ─────────────────────────────────────────────────

vi.mock("@/lib/providers/AuthProvider", () => ({
  useAuth: vi.fn(() => ({
    user: { id: "u1" },
    profile: { display_name: "Yahya" },
  })),
}))

// ── Media upload mock ─────────────────────────────────────────

const mockUploadMedia = vi.fn().mockResolvedValue({
  url: "https://test.com/snap.webp",
  mediaId: "m1",
})

vi.mock("@/lib/media-upload", () => ({
  uploadMedia: (...args: unknown[]) => mockUploadMedia(...args),
}))

// ── Snap types mock ───────────────────────────────────────────

vi.mock("@/lib/types/snap.types", () => ({
  MAX_CAPTION_LENGTH: 100,
  SNAP_WINDOW_SECONDS: 300,
}))

// ── Framer Motion mock ────────────────────────────────────────

vi.mock("framer-motion", () => ({
  motion: {
    div: React.forwardRef(
      (
        {
          children,
          initial,
          animate,
          transition,
          whileTap,
          ...rest
        }: {
          children?: React.ReactNode
          initial?: unknown
          animate?: unknown
          transition?: unknown
          whileTap?: unknown
          [key: string]: unknown
        },
        ref: React.Ref<HTMLDivElement>
      ) => {
        void initial
        void animate
        void transition
        void whileTap
        return (
          <div ref={ref} {...rest}>
            {children}
          </div>
        )
      }
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// ── getUserMedia mock ─────────────────────────────────────────

const mockStop = vi.fn()
const mockGetUserMedia = vi.fn().mockResolvedValue({
  getTracks: () => [{ stop: mockStop }],
})

// ── Canvas mocks ──────────────────────────────────────────────

const mockDrawImage = vi.fn()
const testBlob = new Blob(["test-image-data"], { type: "image/jpeg" })

// We need to track canvas instances and their mocks
const mockGetContext = vi.fn(() => ({
  drawImage: mockDrawImage,
}))

const mockToBlob = vi.fn((cb: BlobCallback) => {
  cb(testBlob)
})

// Store original methods
const originalGetContext = HTMLCanvasElement.prototype.getContext
const originalToBlob = HTMLCanvasElement.prototype.toBlob

import { CameraCapture } from "@/components/snap/CameraCapture"

describe("CameraCapture", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseSnap.mockReturnValue({
      todaySnap: null,
      isWindowOpen: true,
      windowTimeRemaining: 250,
      submitSnap: mockSubmitSnap,
      error: null,
    })

    // Setup getUserMedia
    Object.defineProperty(navigator, "mediaDevices", {
      value: { getUserMedia: mockGetUserMedia },
      writable: true,
      configurable: true,
    })

    // Setup canvas mocks
    HTMLCanvasElement.prototype.getContext = mockGetContext as any
    HTMLCanvasElement.prototype.toBlob = mockToBlob as any

    // Mock URL.createObjectURL
    global.URL.createObjectURL = vi.fn(() => "blob:test-preview-url")
    global.URL.revokeObjectURL = vi.fn()
  })

  // ── Unit Tests ──────────────────────────────────────────────

  describe("unit", () => {
    it("renders camera view with capture button", async () => {
      render(<CameraCapture />)

      const captureButton = screen.getByLabelText("Take photo")
      expect(captureButton).toBeInTheDocument()
    })

    it("shows countdown timer when window time remaining", () => {
      render(<CameraCapture />)

      // 250 seconds = 4:10
      expect(screen.getByText("4:10")).toBeInTheDocument()
    })

    it("shows camera toggle button", () => {
      render(<CameraCapture />)

      const toggleButton = screen.getByLabelText("Switch camera")
      expect(toggleButton).toBeInTheDocument()
    })

    it("shows desktop fallback file input when getUserMedia unavailable", () => {
      // Remove getUserMedia
      Object.defineProperty(navigator, "mediaDevices", {
        value: undefined,
        writable: true,
        configurable: true,
      })

      render(<CameraCapture />)

      expect(screen.getByText("Choose Photo")).toBeInTheDocument()
      expect(screen.getByLabelText("Choose photo")).toBeInTheDocument()
    })
  })

  // ── Interaction Tests ───────────────────────────────────────

  describe("interaction", () => {
    it("toggle button switches facing mode", async () => {
      const user = userEvent.setup()
      render(<CameraCapture />)

      const toggleButton = screen.getByLabelText("Switch camera")
      await user.click(toggleButton)

      // getUserMedia should be called again with new facing mode
      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalledTimes(2)
      })
    })

    it("capture button transitions to preview state", async () => {
      const user = userEvent.setup()

      // Mock the video element's dimensions
      Object.defineProperty(HTMLVideoElement.prototype, "videoWidth", {
        get: () => 640,
        configurable: true,
      })
      Object.defineProperty(HTMLVideoElement.prototype, "videoHeight", {
        get: () => 480,
        configurable: true,
      })

      render(<CameraCapture />)

      const captureButton = screen.getByLabelText("Take photo")
      await user.click(captureButton)

      // Should transition to preview state with Use This and Retake buttons
      await waitFor(() => {
        expect(screen.getByText("Use This")).toBeInTheDocument()
        expect(screen.getByText("Retake")).toBeInTheDocument()
      })
    })

    it("preview shows Use This and Retake buttons", async () => {
      const user = userEvent.setup()

      Object.defineProperty(HTMLVideoElement.prototype, "videoWidth", {
        get: () => 640,
        configurable: true,
      })
      Object.defineProperty(HTMLVideoElement.prototype, "videoHeight", {
        get: () => 480,
        configurable: true,
      })

      render(<CameraCapture />)

      // Capture
      await user.click(screen.getByLabelText("Take photo"))

      await waitFor(() => {
        expect(screen.getByText("Use This")).toBeInTheDocument()
        expect(screen.getByText("Retake")).toBeInTheDocument()
      })
    })

    it("caption input enforces 100-char max", async () => {
      const user = userEvent.setup()

      Object.defineProperty(HTMLVideoElement.prototype, "videoWidth", {
        get: () => 640,
        configurable: true,
      })
      Object.defineProperty(HTMLVideoElement.prototype, "videoHeight", {
        get: () => 480,
        configurable: true,
      })

      render(<CameraCapture />)

      // Capture first
      await user.click(screen.getByLabelText("Take photo"))

      await waitFor(() => {
        expect(screen.getByLabelText("Caption")).toBeInTheDocument()
      })

      const captionInput = screen.getByLabelText("Caption")
      expect(captionInput).toHaveAttribute("maxLength", "100")
    })

    it("after retake, retake button is disabled", async () => {
      const user = userEvent.setup()

      Object.defineProperty(HTMLVideoElement.prototype, "videoWidth", {
        get: () => 640,
        configurable: true,
      })
      Object.defineProperty(HTMLVideoElement.prototype, "videoHeight", {
        get: () => 480,
        configurable: true,
      })

      render(<CameraCapture />)

      // First capture
      await user.click(screen.getByLabelText("Take photo"))

      await waitFor(() => {
        expect(screen.getByText("Retake")).toBeInTheDocument()
      })

      // Click retake
      await user.click(screen.getByText("Retake"))

      // Wait for camera state to return
      await waitFor(() => {
        expect(screen.getByLabelText("Take photo")).toBeInTheDocument()
      })

      // Second capture
      await user.click(screen.getByLabelText("Take photo"))

      // Now retake should be disabled
      await waitFor(() => {
        const retakeButton = screen.getByText("Retake")
        expect(retakeButton).toBeDisabled()
      })
    })
  })

  // ── Integration Tests ───────────────────────────────────────

  describe("integration", () => {
    it("submit calls uploadMedia with bucket snap-photos and maxWidth 1200", async () => {
      const user = userEvent.setup()

      Object.defineProperty(HTMLVideoElement.prototype, "videoWidth", {
        get: () => 640,
        configurable: true,
      })
      Object.defineProperty(HTMLVideoElement.prototype, "videoHeight", {
        get: () => 480,
        configurable: true,
      })

      render(<CameraCapture />)

      // Capture
      await user.click(screen.getByLabelText("Take photo"))

      await waitFor(() => {
        expect(screen.getByText("Use This")).toBeInTheDocument()
      })

      // Submit
      await user.click(screen.getByText("Use This"))

      await waitFor(() => {
        expect(mockUploadMedia).toHaveBeenCalledWith(
          expect.objectContaining({
            bucket: "snap-photos",
            maxWidth: 1200,
            maxHeight: 1200,
            sourceTable: "snaps",
            sourceColumn: "photo_url",
            userId: "u1",
          })
        )
      })
    })

    it("submit calls useSnap().submitSnap after upload", async () => {
      const user = userEvent.setup()

      Object.defineProperty(HTMLVideoElement.prototype, "videoWidth", {
        get: () => 640,
        configurable: true,
      })
      Object.defineProperty(HTMLVideoElement.prototype, "videoHeight", {
        get: () => 480,
        configurable: true,
      })

      render(<CameraCapture />)

      // Capture
      await user.click(screen.getByLabelText("Take photo"))

      await waitFor(() => {
        expect(screen.getByText("Use This")).toBeInTheDocument()
      })

      // Submit
      await user.click(screen.getByText("Use This"))

      await waitFor(() => {
        expect(mockSubmitSnap).toHaveBeenCalledWith(
          "https://test.com/snap.webp",
          undefined
        )
      })
    })
  })
})

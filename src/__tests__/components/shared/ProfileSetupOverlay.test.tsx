import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach } from "vitest"

// --- Mocks ---
const mockUpload = vi.fn()
const mockGetPublicUrl = vi.fn()
const mockUpdate = vi.fn()
const mockEq = vi.fn()

const mockSupabase = {
  storage: {
    from: vi.fn(() => ({
      upload: mockUpload,
      getPublicUrl: mockGetPublicUrl,
    })),
  },
  from: vi.fn(() => ({
    update: mockUpdate.mockReturnValue({
      eq: mockEq,
    }),
  })),
}

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => mockSupabase,
}))

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => {
      const { initial, animate, exit, transition, whileHover, whileTap, ...rest } = props
      void initial; void animate; void exit; void transition; void whileHover; void whileTap
      return <div {...rest}>{children}</div>
    },
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

import { ProfileSetupOverlay } from "@/components/shared/ProfileSetupOverlay"

describe("ProfileSetupOverlay", () => {
  const mockOnComplete = vi.fn()
  const defaultProps = {
    userId: "user-1",
    onComplete: mockOnComplete,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockEq.mockResolvedValue({ error: null })
    mockUpload.mockResolvedValue({ error: null })
    mockGetPublicUrl.mockReturnValue({ data: { publicUrl: "https://cdn.test/avatar.jpg" } })
  })

  it("renders heading and subtitle", () => {
    render(<ProfileSetupOverlay {...defaultProps} />)
    expect(screen.getByText("Set up your profile")).toBeInTheDocument()
    expect(screen.getByText("Let your partner know it's you")).toBeInTheDocument()
  })

  it("renders name input and submit button", () => {
    render(<ProfileSetupOverlay {...defaultProps} />)
    expect(screen.getByPlaceholderText("Your name")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Continue" })).toBeInTheDocument()
  })

  it("renders avatar upload button", () => {
    render(<ProfileSetupOverlay {...defaultProps} />)
    expect(screen.getByLabelText("Choose avatar")).toBeInTheDocument()
  })

  it("shows validation error for empty name on submit", async () => {
    const user = userEvent.setup()
    render(<ProfileSetupOverlay {...defaultProps} />)

    await user.click(screen.getByRole("button", { name: "Continue" }))

    await waitFor(() => {
      expect(screen.getByText("Name is required")).toBeInTheDocument()
    })
  })

  it("submits profile update with display_name", async () => {
    const user = userEvent.setup()
    render(<ProfileSetupOverlay {...defaultProps} />)

    await user.type(screen.getByPlaceholderText("Your name"), "Yahya")
    await user.click(screen.getByRole("button", { name: "Continue" }))

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith({ display_name: "Yahya" })
      expect(mockEq).toHaveBeenCalledWith("id", "user-1")
    })
  })

  it("pre-fills name when initialName is provided", () => {
    render(<ProfileSetupOverlay {...defaultProps} initialName="Yara" />)
    expect(screen.getByPlaceholderText("Your name")).toHaveValue("Yara")
  })

  it("ignores initialName 'User' and leaves input empty", () => {
    render(<ProfileSetupOverlay {...defaultProps} initialName="User" />)
    expect(screen.getByPlaceholderText("Your name")).toHaveValue("")
  })

  it("shows file error for oversized file", async () => {
    const user = userEvent.setup()
    render(<ProfileSetupOverlay {...defaultProps} />)

    const bigFile = new File(["x".repeat(6 * 1024 * 1024)], "big.jpg", { type: "image/jpeg" })
    const input = screen.getByTestId("avatar-input")
    await user.upload(input, bigFile)

    expect(screen.getByText("Image must be under 5MB")).toBeInTheDocument()
  })

  it("shows error on profile update failure", async () => {
    mockEq.mockResolvedValueOnce({ error: { message: "db error" } })
    const user = userEvent.setup()
    render(<ProfileSetupOverlay {...defaultProps} />)

    await user.type(screen.getByPlaceholderText("Your name"), "Yahya")
    await user.click(screen.getByRole("button", { name: "Continue" }))

    await waitFor(() => {
      expect(screen.getByText("Failed to save profile")).toBeInTheDocument()
    })
  })

  it("shows loading state during submit", async () => {
    mockEq.mockImplementation(() => new Promise(() => {}))
    const user = userEvent.setup()
    render(<ProfileSetupOverlay {...defaultProps} />)

    await user.type(screen.getByPlaceholderText("Your name"), "Yahya")
    await user.click(screen.getByRole("button", { name: "Continue" }))

    await waitFor(() => {
      expect(screen.getByText("Saving...")).toBeInTheDocument()
    })
  })

  it("calls onComplete after successful submit", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<ProfileSetupOverlay {...defaultProps} />)

    await user.type(screen.getByPlaceholderText("Your name"), "Yahya")
    await user.click(screen.getByRole("button", { name: "Continue" }))

    await waitFor(() => {
      expect(mockEq).toHaveBeenCalled()
    })

    vi.advanceTimersByTime(500)

    await waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalledOnce()
    })

    vi.useRealTimers()
  })

  it("uploads avatar when file is selected", async () => {
    const user = userEvent.setup()
    render(<ProfileSetupOverlay {...defaultProps} />)

    const smallFile = new File(["test"], "avatar.png", { type: "image/png" })
    await user.upload(screen.getByTestId("avatar-input"), smallFile)

    await user.type(screen.getByPlaceholderText("Your name"), "Yahya")
    await user.click(screen.getByRole("button", { name: "Continue" }))

    await waitFor(() => {
      expect(mockUpload).toHaveBeenCalled()
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          display_name: "Yahya",
          avatar_url: "https://cdn.test/avatar.jpg",
        })
      )
    })
  })

  it("shows avatar upload error", async () => {
    mockUpload.mockResolvedValueOnce({ error: { message: "upload failed" } })
    const user = userEvent.setup()
    render(<ProfileSetupOverlay {...defaultProps} />)

    const smallFile = new File(["test"], "avatar.png", { type: "image/png" })
    await user.upload(screen.getByTestId("avatar-input"), smallFile)

    await user.type(screen.getByPlaceholderText("Your name"), "Yahya")
    await user.click(screen.getByRole("button", { name: "Continue" }))

    await waitFor(() => {
      expect(screen.getByText("Failed to upload avatar")).toBeInTheDocument()
    })
  })
})

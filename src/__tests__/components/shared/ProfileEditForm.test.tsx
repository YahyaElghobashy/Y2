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

import { ProfileEditForm } from "@/components/shared/ProfileEditForm"

describe("ProfileEditForm", () => {
  const mockOnSave = vi.fn()
  const mockOnCancel = vi.fn()
  const defaultProps = {
    profile: {
      id: "user-1",
      display_name: "Yahya",
      email: "yahya@test.com",
      avatar_url: null as string | null,
    },
    onSave: mockOnSave,
    onCancel: mockOnCancel,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockEq.mockResolvedValue({ error: null })
    mockUpload.mockResolvedValue({ error: null })
    mockGetPublicUrl.mockReturnValue({ data: { publicUrl: "https://cdn.test/avatar.jpg" } })
  })

  it("renders with pre-filled display name", () => {
    render(<ProfileEditForm {...defaultProps} />)
    expect(screen.getByDisplayValue("Yahya")).toBeInTheDocument()
  })

  it("renders Save and Cancel buttons", () => {
    render(<ProfileEditForm {...defaultProps} />)
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument()
  })

  it("calls onCancel when Cancel is clicked", async () => {
    const user = userEvent.setup()
    render(<ProfileEditForm {...defaultProps} />)

    await user.click(screen.getByRole("button", { name: "Cancel" }))
    expect(mockOnCancel).toHaveBeenCalledOnce()
  })

  it("shows validation error for empty name", async () => {
    const user = userEvent.setup()
    render(<ProfileEditForm {...defaultProps} />)

    await user.clear(screen.getByDisplayValue("Yahya"))
    await user.click(screen.getByRole("button", { name: "Save" }))

    await waitFor(() => {
      expect(screen.getByText("Name is required")).toBeInTheDocument()
    })
  })

  it("submits profile update and calls onSave", async () => {
    const user = userEvent.setup()
    render(<ProfileEditForm {...defaultProps} />)

    await user.clear(screen.getByDisplayValue("Yahya"))
    await user.type(screen.getByPlaceholderText("Display name"), "Yara")
    await user.click(screen.getByRole("button", { name: "Save" }))

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith({ display_name: "Yara" })
      expect(mockOnSave).toHaveBeenCalledOnce()
    })
  })

  it("shows initials fallback when no avatar_url", () => {
    render(<ProfileEditForm {...defaultProps} />)
    expect(screen.getByText("Y")).toBeInTheDocument()
  })

  it("shows avatar image when avatar_url is provided", () => {
    render(
      <ProfileEditForm
        {...defaultProps}
        profile={{ ...defaultProps.profile, avatar_url: "https://cdn.test/existing.jpg" }}
      />
    )
    expect(screen.getByAltText("Avatar")).toBeInTheDocument()
  })

  it("shows error on profile update failure", async () => {
    mockEq.mockResolvedValueOnce({ error: { message: "db error" } })
    const user = userEvent.setup()
    render(<ProfileEditForm {...defaultProps} />)

    await user.click(screen.getByRole("button", { name: "Save" }))

    await waitFor(() => {
      expect(screen.getByText("Failed to save profile")).toBeInTheDocument()
    })
  })
})

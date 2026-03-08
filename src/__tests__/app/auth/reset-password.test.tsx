import { render, waitFor } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"

// --- Mocks ---
const mockReplace = vi.fn()

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace, push: vi.fn() }),
}))

import ResetPasswordPage from "@/app/(auth)/reset-password/page"

describe("ResetPasswordPage", () => {
  it("redirects to /forgot-password on mount", async () => {
    render(<ResetPasswordPage />)

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/forgot-password")
    })
  })
})

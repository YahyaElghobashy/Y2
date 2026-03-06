import { describe, it, expect, vi } from "vitest"

const mockRedirect = vi.fn()
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    mockRedirect(url)
    throw new Error("NEXT_REDIRECT")
  },
}))

import HealthPage from "@/app/(main)/health/page"

describe("Health Page (redirect)", () => {
  it("redirects to /me", () => {
    expect(() => HealthPage()).toThrow("NEXT_REDIRECT")
    expect(mockRedirect).toHaveBeenCalledWith("/me")
  })

  it("calls redirect exactly once", () => {
    mockRedirect.mockClear()
    expect(() => HealthPage()).toThrow("NEXT_REDIRECT")
    expect(mockRedirect).toHaveBeenCalledTimes(1)
  })
})

import { describe, it, expect, vi } from "vitest"

const mockRedirect = vi.fn()
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    mockRedirect(url)
    throw new Error("NEXT_REDIRECT")
  },
}))

import SettingsPage from "@/app/(main)/settings/page"

describe("Settings Page (redirect)", () => {
  it("redirects to /more", () => {
    expect(() => SettingsPage()).toThrow("NEXT_REDIRECT")
    expect(mockRedirect).toHaveBeenCalledWith("/more")
  })

  it("calls redirect exactly once", () => {
    mockRedirect.mockClear()
    expect(() => SettingsPage()).toThrow("NEXT_REDIRECT")
    expect(mockRedirect).toHaveBeenCalledTimes(1)
  })
})

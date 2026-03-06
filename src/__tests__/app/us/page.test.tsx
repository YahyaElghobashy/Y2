import { describe, it, expect, vi } from "vitest"

const mockRedirect = vi.fn()
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    mockRedirect(url)
    throw new Error("NEXT_REDIRECT")
  },
}))

import UsPage from "@/app/(main)/us/page"

describe("Us Page (redirect)", () => {
  it("redirects to /us/coyyns", () => {
    expect(() => UsPage()).toThrow("NEXT_REDIRECT")
    expect(mockRedirect).toHaveBeenCalledWith("/us/coyyns")
  })

  it("calls redirect exactly once", () => {
    mockRedirect.mockClear()
    expect(() => UsPage()).toThrow("NEXT_REDIRECT")
    expect(mockRedirect).toHaveBeenCalledTimes(1)
  })
})

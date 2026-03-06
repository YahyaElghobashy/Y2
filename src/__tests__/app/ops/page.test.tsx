import { describe, it, expect, vi } from "vitest"

const mockRedirect = vi.fn()
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    mockRedirect(url)
    throw new Error("NEXT_REDIRECT")
  },
}))

import OpsPage from "@/app/(main)/ops/page"

describe("Ops Page (redirect)", () => {
  it("redirects to /more", () => {
    expect(() => OpsPage()).toThrow("NEXT_REDIRECT")
    expect(mockRedirect).toHaveBeenCalledWith("/more")
  })

  it("calls redirect exactly once", () => {
    mockRedirect.mockClear()
    expect(() => OpsPage()).toThrow("NEXT_REDIRECT")
    expect(mockRedirect).toHaveBeenCalledTimes(1)
  })
})

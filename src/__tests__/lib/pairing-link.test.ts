import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

// Must set env before importing
process.env.NEXT_PUBLIC_APP_URL = "https://hayah.app"

import {
  generatePairingLink,
  parsePairingCode,
  storePendingPairCode,
  consumePendingPairCode,
} from "@/lib/pairing-link"

describe("pairing-link", () => {
  // ── Unit Tests ──────────────────────────────────────────────

  describe("unit: generatePairingLink", () => {
    it("generates a link with the correct format", () => {
      const link = generatePairingLink("ABC123")
      expect(link).toContain("/pair/ABC123")
    })

    it("preserves the invite code exactly", () => {
      const link = generatePairingLink("XYZ789")
      expect(link).toMatch(/\/pair\/XYZ789$/)
    })
  })

  describe("unit: parsePairingCode", () => {
    it("extracts a 6-char code from a valid pairing URL", () => {
      const code = parsePairingCode("https://hayah.app/pair/ABC123")
      expect(code).toBe("ABC123")
    })

    it("uppercases the extracted code", () => {
      const code = parsePairingCode("https://hayah.app/pair/abc123")
      expect(code).toBe("ABC123")
    })

    it("returns null for non-pair URLs", () => {
      expect(parsePairingCode("https://hayah.app/settings")).toBeNull()
    })

    it("returns null for invalid code length", () => {
      expect(parsePairingCode("https://hayah.app/pair/AB")).toBeNull()
    })

    it("returns null for codes with special characters", () => {
      expect(parsePairingCode("https://hayah.app/pair/ABC!@#")).toBeNull()
    })

    it("returns null for invalid URLs", () => {
      expect(parsePairingCode("not-a-url")).toBeNull()
    })

    it("returns null for empty string", () => {
      expect(parsePairingCode("")).toBeNull()
    })

    it("handles URLs with trailing slashes", () => {
      // The regex requires exact 6-char match after /pair/
      expect(parsePairingCode("https://hayah.app/pair/ABC123/")).toBeNull()
    })
  })

  describe("unit: storePendingPairCode + consumePendingPairCode", () => {
    let store: Record<string, string> = {}

    beforeEach(() => {
      store = {}
      vi.stubGlobal("sessionStorage", {
        getItem: vi.fn((key: string) => store[key] ?? null),
        setItem: vi.fn((key: string, value: string) => { store[key] = value }),
        removeItem: vi.fn((key: string) => { delete store[key] }),
      })
    })

    afterEach(() => {
      vi.unstubAllGlobals()
    })

    it("stores a code in sessionStorage", () => {
      storePendingPairCode("ABC123")
      expect(sessionStorage.setItem).toHaveBeenCalledWith("pending_pair_code", "ABC123")
    })

    it("retrieves and clears a stored code", () => {
      storePendingPairCode("XYZ789")
      const code = consumePendingPairCode()
      expect(code).toBe("XYZ789")
      expect(sessionStorage.removeItem).toHaveBeenCalledWith("pending_pair_code")
    })

    it("returns null when no code is stored", () => {
      const code = consumePendingPairCode()
      expect(code).toBeNull()
    })
  })

  // ── Integration Tests ─────────────────────────────────────

  describe("integration: generate + parse roundtrip", () => {
    it("generates a link that parsePairingCode can extract", () => {
      const link = generatePairingLink("TEST99")
      const parsed = parsePairingCode(link)
      expect(parsed).toBe("TEST99")
    })

    it("roundtrips with different codes", () => {
      const codes = ["AAAAAA", "111111", "AB1234", "ZZZZZ9"]
      for (const code of codes) {
        const link = generatePairingLink(code)
        expect(parsePairingCode(link)).toBe(code)
      }
    })
  })
})

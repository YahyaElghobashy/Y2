import { describe, it, expect } from "vitest"
import { getRouteForNotification } from "@/lib/notification-router"

describe("getRouteForNotification", () => {
  // ── Unit tests ──────────────────────────────────────────
  describe("unit", () => {
    it("routes coupon_received to /us/coupons/:id", () => {
      expect(getRouteForNotification("coupon_received", { coupon_id: "abc" }))
        .toBe("/us/coupons/abc")
    })

    it("routes coupon_redeemed to /us/coupons/:id", () => {
      expect(getRouteForNotification("coupon_redeemed", { coupon_id: "xyz" }))
        .toBe("/us/coupons/xyz")
    })

    it("routes coupon_approved to /us/coupons/:id", () => {
      expect(getRouteForNotification("coupon_approved", { coupon_id: "123" }))
        .toBe("/us/coupons/123")
    })

    it("routes coupon types without coupon_id to /us/coupons", () => {
      expect(getRouteForNotification("coupon_received")).toBe("/us/coupons")
      expect(getRouteForNotification("coupon_received", {})).toBe("/us/coupons")
    })

    it("routes ping to /us/ping", () => {
      expect(getRouteForNotification("ping")).toBe("/us/ping")
    })

    it("routes challenge_created to /us/marketplace", () => {
      expect(getRouteForNotification("challenge_created")).toBe("/us/marketplace")
    })

    it("routes challenge_claimed to /us/marketplace", () => {
      expect(getRouteForNotification("challenge_claimed")).toBe("/us/marketplace")
    })

    it("routes purchase_received to /", () => {
      expect(getRouteForNotification("purchase_received")).toBe("/")
    })

    it("routes daily_bonus to /us/coyyns", () => {
      expect(getRouteForNotification("daily_bonus")).toBe("/us/coyyns")
    })

    it("routes unknown type to /", () => {
      expect(getRouteForNotification("unknown_type")).toBe("/")
    })

    it("routes undefined type to /", () => {
      expect(getRouteForNotification()).toBe("/")
      expect(getRouteForNotification(undefined)).toBe("/")
    })
  })
})

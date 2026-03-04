import { describe, it, expect } from "vitest"
import {
  EVENT_CATEGORY_CONFIG,
  getCategoryColor,
  getCategoryLabel,
} from "@/lib/calendar-constants"

describe("calendar-constants", () => {
  // ── Unit: EVENT_CATEGORY_CONFIG ──

  it("defines all 4 event categories", () => {
    const keys = Object.keys(EVENT_CATEGORY_CONFIG)
    expect(keys).toContain("date_night")
    expect(keys).toContain("milestone")
    expect(keys).toContain("reminder")
    expect(keys).toContain("other")
    expect(keys).toHaveLength(4)
  })

  it("each category has key, label, color, and icon", () => {
    for (const [key, config] of Object.entries(EVENT_CATEGORY_CONFIG)) {
      expect(config.key).toBe(key)
      expect(config.label).toBeTruthy()
      expect(config.color).toMatch(/^#[0-9A-Fa-f]{6}$/)
      expect(config.icon).toBeDefined()
    }
  })

  it("date_night has copper color #B87333", () => {
    expect(EVENT_CATEGORY_CONFIG.date_night.color).toBe("#B87333")
    expect(EVENT_CATEGORY_CONFIG.date_night.label).toBe("Date Night")
  })

  it("milestone has gold color #DAA520", () => {
    expect(EVENT_CATEGORY_CONFIG.milestone.color).toBe("#DAA520")
    expect(EVENT_CATEGORY_CONFIG.milestone.label).toBe("Milestone")
  })

  it("reminder has gray color #9CA3AF", () => {
    expect(EVENT_CATEGORY_CONFIG.reminder.color).toBe("#9CA3AF")
    expect(EVENT_CATEGORY_CONFIG.reminder.label).toBe("Reminder")
  })

  it("other has dark color #4A4543", () => {
    expect(EVENT_CATEGORY_CONFIG.other.color).toBe("#4A4543")
    expect(EVENT_CATEGORY_CONFIG.other.label).toBe("Other")
  })

  // ── Unit: getCategoryColor ──

  it("getCategoryColor returns correct hex for known categories", () => {
    expect(getCategoryColor("date_night")).toBe("#B87333")
    expect(getCategoryColor("milestone")).toBe("#DAA520")
    expect(getCategoryColor("reminder")).toBe("#9CA3AF")
    expect(getCategoryColor("other")).toBe("#4A4543")
  })

  it("getCategoryColor returns 'other' color for unknown category", () => {
    expect(getCategoryColor("nonexistent")).toBe("#4A4543")
  })

  // ── Unit: getCategoryLabel ──

  it("getCategoryLabel returns correct label for known categories", () => {
    expect(getCategoryLabel("date_night")).toBe("Date Night")
    expect(getCategoryLabel("milestone")).toBe("Milestone")
    expect(getCategoryLabel("reminder")).toBe("Reminder")
    expect(getCategoryLabel("other")).toBe("Other")
  })

  it("getCategoryLabel returns 'Other' for unknown category", () => {
    expect(getCategoryLabel("nonexistent")).toBe("Other")
  })
})

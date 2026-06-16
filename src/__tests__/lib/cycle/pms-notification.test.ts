import { describe, it, expect } from "vitest"
import { subDays, format } from "date-fns"
import { planPmsNotification } from "@/lib/cycle/pms-notification"

// Fixed reference "today" keeps calendar math deterministic.
const TODAY = new Date(2026, 5, 16) // 2026-06-16 (local)

function configElapsed(elapsed: number, overrides: Record<string, number> = {}) {
  return {
    pill_start_date: format(subDays(TODAY, elapsed), "yyyy-MM-dd"),
    active_days: 21,
    break_days: 7,
    pms_warning_days: 3,
    ...overrides,
  }
}

const ymd = (d: Date) => format(d, "yyyy-MM-dd")

describe("planPmsNotification", () => {
  it("returns null in the active phase before the PMS window", () => {
    // elapsed 5 → currentDay 6 (active, daysUntilBreak 16)
    expect(planPmsNotification(configElapsed(5), TODAY)).toBeNull()
  })

  it("returns a PMS plan on the first PMS day with windowStart = today", () => {
    // elapsed 18 → currentDay 19 = first PMS day (active_days 21, warning 3)
    const plan = planPmsNotification(configElapsed(18), TODAY)
    expect(plan).not.toBeNull()
    expect(plan!.kind).toBe("pms")
    expect(plan!.windowStart).toBe(ymd(TODAY))
    expect(plan!.title).toBeTruthy()
    expect(plan!.body).toBeTruthy()
    expect(plan!.emoji).toBeTruthy()
  })

  it("keeps the same windowStart on a later PMS day (once-per-window key)", () => {
    // elapsed 20 → currentDay 21 = 2 days into the PMS window
    const plan = planPmsNotification(configElapsed(20), TODAY)
    expect(plan!.kind).toBe("pms")
    expect(plan!.windowStart).toBe(ymd(subDays(TODAY, 2)))
  })

  it("returns a period plan on the first break day with windowStart = today", () => {
    // elapsed 21 → currentDay 22 = first break day
    const plan = planPmsNotification(configElapsed(21), TODAY)
    expect(plan!.kind).toBe("period")
    expect(plan!.windowStart).toBe(ymd(TODAY))
  })

  it("keeps the same windowStart deeper into the break window", () => {
    // elapsed 25 → currentDay 26 = 4 days into the break
    const plan = planPmsNotification(configElapsed(25), TODAY)
    expect(plan!.kind).toBe("period")
    expect(plan!.windowStart).toBe(ymd(subDays(TODAY, 4)))
  })

  it("PMS and period windows yield distinct windowStart keys (two notifications/cycle)", () => {
    // One fixed cycle, evaluated on a PMS day and on a period day.
    const config = {
      pill_start_date: "2026-06-01",
      active_days: 21,
      break_days: 7,
      pms_warning_days: 3,
    }
    const pms = planPmsNotification(config, new Date(2026, 5, 20)) // currentDay 20 → PMS
    const period = planPmsNotification(config, new Date(2026, 5, 24)) // currentDay 24 → break
    expect(pms!.kind).toBe("pms")
    expect(period!.kind).toBe("period")
    expect(pms!.windowStart).toBe("2026-06-19") // first PMS day
    expect(period!.windowStart).toBe("2026-06-22") // first break day
    expect(pms!.windowStart).not.toBe(period!.windowStart)
  })

  it("returns null when pms_warning_days is 0 (no PMS window)", () => {
    // elapsed 20 → currentDay 21, last active day, but no warning window
    expect(planPmsNotification(configElapsed(20, { pms_warning_days: 0 }), TODAY)).toBeNull()
  })

  it("returns null when the pill_start_date is in the future", () => {
    const future = {
      pill_start_date: format(subDays(TODAY, -5), "yyyy-MM-dd"),
      active_days: 21,
      break_days: 7,
      pms_warning_days: 3,
    }
    expect(planPmsNotification(future, TODAY)).toBeNull()
  })

  it("wraps across cycles — PMS detected in the second cycle", () => {
    // elapsed 46 = 28 (full cycle) + 18 → currentDay 19 → first PMS day again
    const plan = planPmsNotification(configElapsed(46), TODAY)
    expect(plan!.kind).toBe("pms")
    expect(plan!.windowStart).toBe(ymd(TODAY))
  })

  it("returns null when total cycle length is zero (degenerate config)", () => {
    expect(
      planPmsNotification(configElapsed(5, { active_days: 0, break_days: 0 }), TODAY)
    ).toBeNull()
  })
})

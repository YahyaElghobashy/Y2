import { describe, it, expect, vi } from "vitest"
import { readFileSync } from "fs"
import { resolve } from "path"

const SRC = readFileSync(
  resolve(__dirname, "../../../app/(main)/us/calendar/page.tsx"),
  "utf-8"
)

describe("Calendar page — swipe gestures & Today button (TC13)", () => {
  // ── Unit Tests — Swipe gestures ──

  it("wraps calendar grid in motion.div with drag='x'", () => {
    expect(SRC).toContain('drag="x"')
    expect(SRC).toContain("calendar-swipe-area")
  })

  it("constrains drag to x-axis (no drift)", () => {
    expect(SRC).toContain("dragConstraints")
    expect(SRC).toContain("left: 0, right: 0")
  })

  it("uses dragElastic for rubber-band feel", () => {
    expect(SRC).toContain("dragElastic")
  })

  it("implements onDragEnd handler for swipe detection", () => {
    expect(SRC).toContain("onDragEnd={handleSwipeEnd}")
    expect(SRC).toContain("handleSwipeEnd")
  })

  it("checks swipe angle (prevents vertical scroll interference)", () => {
    expect(SRC).toContain("absX")
    expect(SRC).toContain("absY")
    expect(SRC).toContain("absY > absX") // angle check
  })

  it("uses 50px threshold for swipe detection", () => {
    expect(SRC).toContain("absX < 50")
    expect(SRC).toContain("info.offset.x < -50")
    expect(SRC).toContain("info.offset.x > 50")
  })

  it("swipe left triggers goToNextMonth", () => {
    expect(SRC).toContain("info.offset.x < -50")
    expect(SRC).toContain("goToNextMonth()")
  })

  it("swipe right triggers goToPrevMonth", () => {
    expect(SRC).toContain("info.offset.x > 50")
    expect(SRC).toContain("goToPrevMonth()")
  })

  it("preserves touchAction pan-y for vertical scroll", () => {
    expect(SRC).toContain('touchAction: "pan-y"')
  })

  // ── Unit Tests — Today button ──

  it("computes isCurrentMonth flag", () => {
    expect(SRC).toContain("isCurrentMonth")
    expect(SRC).toContain("today.getFullYear()")
    expect(SRC).toContain("today.getMonth()")
  })

  it("shows Today button when not on current month", () => {
    expect(SRC).toContain("!isCurrentMonth")
    expect(SRC).toContain("today-button")
  })

  it("Today button uses AnimatePresence for enter/exit", () => {
    expect(SRC).toContain("AnimatePresence")
    expect(SRC).toContain("initial={{ opacity: 0")
    expect(SRC).toContain("animate={{ opacity: 1")
    expect(SRC).toContain("exit={{ opacity: 0")
  })

  it("goToToday resets to current date", () => {
    expect(SRC).toContain("goToToday")
    expect(SRC).toContain("setCurrentYear(today.getFullYear())")
    expect(SRC).toContain("setCurrentMonth(today.getMonth())")
    expect(SRC).toContain("setSelectedDate(today.getDate())")
  })

  it("Today button has copper styling", () => {
    // Check it's styled with copper accent
    expect(SRC).toContain("accent-copper")
    expect(SRC).toContain("Today")
  })

  // ── Integration: DayDetailSheet ──

  it("uses DayDetailSheet component", () => {
    expect(SRC).toContain("DayDetailSheet")
    expect(SRC).toContain("isSheetOpen")
  })

  it("passes userId to DayDetailSheet", () => {
    expect(SRC).toContain("userId={user?.id}")
  })

  // ── Integration: month navigation clears selection ──

  it("goToPrevMonth clears selected date", () => {
    // Check that setSelectedDate(undefined) is called in goToPrevMonth
    const prevSection = SRC.substring(SRC.indexOf("goToPrevMonth"), SRC.indexOf("goToNextMonth"))
    expect(prevSection).toContain("setSelectedDate(undefined)")
  })

  it("goToNextMonth clears selected date", () => {
    const nextSection = SRC.substring(SRC.indexOf("goToNextMonth"), SRC.indexOf("handleSwipeEnd"))
    expect(nextSection).toContain("setSelectedDate(undefined)")
  })
})

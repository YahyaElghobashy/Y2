import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { SoulView, type SoulData } from "@/components/spiritual/SoulView"

// jsdom doesn't implement HTMLMediaElement.play — stub the hero <video> autoPlay.
vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(() => Promise.resolve())

const MOCK_AYAH = { arabic: "ا", translation: "t", ref: "Al-Fatihah 1:1" }

function baseData(overrides: Partial<SoulData> = {}): SoulData {
  return {
    prayed: { fajr: false, dhuhr: false, asr: false, maghrib: false, isha: false },
    ayah: MOCK_AYAH,
    quran: { surah: "This month", pct: 10 },
    azkar: { goal: 33, current: 0 },
    needsLocation: false,
    prayerTimes: null,
    ...overrides,
  }
}

describe("SoulView — re-syncs local state from props (realtime)", () => {
  it("updates the azkar count when data.azkar.current changes after mount", () => {
    const { rerender } = render(<SoulView data={baseData({ azkar: { goal: 33, current: 5 } })} />)
    expect(screen.getByText("5")).toBeInTheDocument()

    // Simulate a realtime/refetch update bumping the count.
    rerender(<SoulView data={baseData({ azkar: { goal: 33, current: 12 } })} />)
    expect(screen.getByText("12")).toBeInTheDocument()
  })

  it("reflects a prayer toggled in the incoming data prop (partner/refetch)", () => {
    const { rerender } = render(<SoulView data={baseData()} />)
    // fajr starts not prayed
    expect(screen.getByTestId("prayer-toggle-fajr").getAttribute("data-prayed")).toBe("false")

    rerender(
      <SoulView
        data={baseData({ prayed: { fajr: true, dhuhr: false, asr: false, maghrib: false, isha: false } })}
      />,
    )
    expect(screen.getByTestId("prayer-toggle-fajr").getAttribute("data-prayed")).toBe("true")
  })
})

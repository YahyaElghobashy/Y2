import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { SoulView, type SoulData, type SoulPrayerTimes } from "@/components/spiritual/SoulView"

// jsdom doesn't implement HTMLMediaElement.play — stub it so the hero <video> autoPlay is a no-op.
vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(() => Promise.resolve())

const MOCK_AYAH = { arabic: "ا", translation: "t", ref: "Al-Fatihah 1:1" }

function baseData(overrides: Partial<SoulData> = {}): SoulData {
  return {
    prayed: { fajr: false, dhuhr: false, asr: false, maghrib: false, isha: false },
    ayah: MOCK_AYAH,
    quran: { surah: "This month", pct: 10 },
    azkar: { goal: 33 },
    ...overrides,
  }
}

const TIMES: SoulPrayerTimes = {
  rows: [
    { key: "fajr", label: "3:09 AM", isNext: false },
    { key: "sunrise", label: "4:53 AM", isNext: false },
    { key: "dhuhr", label: "11:57 AM", isNext: true },
    { key: "asr", label: "3:33 PM", isNext: false },
    { key: "maghrib", label: "6:58 PM", isNext: false },
    { key: "isha", label: "8:29 PM", isNext: false },
  ],
  nextName: "Dhuhr",
  nextLabel: "11:57 AM",
  countdown: "1:24:00",
}

describe("SoulView — prayer times", () => {
  // ── No-location prompt ──────────────────────────────────────
  describe("no-location prompt", () => {
    it("shows the set-location prompt and hides the times card", () => {
      render(<SoulView data={baseData({ needsLocation: true, prayerTimes: null })} />)
      expect(screen.getByTestId("set-location-button")).toBeInTheDocument()
      expect(screen.queryByTestId("prayer-times-card")).not.toBeInTheDocument()
    })

    it("fires onDetectLocation when the prompt button is tapped", () => {
      const onDetectLocation = vi.fn()
      render(
        <SoulView
          data={baseData({ needsLocation: true, prayerTimes: null })}
          onDetectLocation={onDetectLocation}
        />,
      )
      fireEvent.click(screen.getByTestId("set-location-button"))
      expect(onDetectLocation).toHaveBeenCalledTimes(1)
    })

    it("disables the button and shows Locating… while saving", () => {
      render(
        <SoulView data={baseData({ needsLocation: true, prayerTimes: null, locationSaving: true })} />,
      )
      const btn = screen.getByTestId("set-location-button") as HTMLButtonElement
      expect(btn.disabled).toBe(true)
      expect(btn).toHaveTextContent(/Locating/i)
    })
  })

  // ── Times rendering ─────────────────────────────────────────
  describe("times card", () => {
    it("renders all six rows with their labels", () => {
      render(<SoulView data={baseData({ needsLocation: false, prayerTimes: TIMES })} />)
      expect(screen.getByTestId("prayer-times-card")).toBeInTheDocument()
      for (const r of TIMES.rows) {
        const row = screen.getByTestId(`prayer-row-${r.key}`)
        expect(row).toHaveTextContent(r.label)
      }
    })

    it("highlights exactly the next prayer row", () => {
      render(<SoulView data={baseData({ needsLocation: false, prayerTimes: TIMES })} />)
      expect(screen.getByTestId("prayer-row-dhuhr").getAttribute("data-next")).toBe("true")
      expect(screen.getByTestId("prayer-row-fajr").getAttribute("data-next")).toBe("false")
    })

    it("shows the next prayer name and live countdown", () => {
      render(<SoulView data={baseData({ needsLocation: false, prayerTimes: TIMES })} />)
      const next = screen.getByTestId("next-prayer")
      expect(next).toHaveTextContent("Dhuhr")
      expect(next).toHaveTextContent("1:24:00")
      expect(next).toHaveTextContent("11:57 AM")
    })

    it("does not show the set-location button when times are present", () => {
      render(<SoulView data={baseData({ needsLocation: false, prayerTimes: TIMES })} />)
      expect(screen.queryByTestId("set-location-button")).not.toBeInTheDocument()
    })
  })

  // ── Neither (loading-ish) ───────────────────────────────────
  it("renders neither card when not needing location and no times yet", () => {
    render(<SoulView data={baseData({ needsLocation: false, prayerTimes: null })} />)
    expect(screen.queryByTestId("prayer-times-card")).not.toBeInTheDocument()
    expect(screen.queryByTestId("set-location-button")).not.toBeInTheDocument()
  })
})

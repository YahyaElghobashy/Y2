"use client"

import { useMemo } from "react"
import { PageTransition } from "@/components/animations"
import { PageHeader } from "@/components/shared/PageHeader"
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton"
import { SoulView, type SoulData } from "@/components/spiritual/SoulView"
import { MoodPicker } from "@/components/mood/MoodPicker"
import { QuranTracker } from "@/components/spiritual/QuranTracker"
import { getDailyAyah } from "@/lib/quran/daily-ayah"
import { usePrayer } from "@/lib/hooks/use-prayer"
import { usePrayerTimes } from "@/lib/hooks/use-prayer-times"
import { useQuran } from "@/lib/hooks/use-quran"
import { useAzkar } from "@/lib/hooks/use-azkar"
import { PRAYER_NAMES, type PrayerName } from "@/lib/types/spiritual.types"

const PRAYER_DISPLAY_NAMES: Record<string, string> = {
  fajr: "Fajr",
  dhuhr: "Dhuhr",
  asr: "Asr",
  maghrib: "Maghrib",
  isha: "Isha",
}

export default function SoulPage() {
  const { today: prayerToday, togglePrayer, isLoading: prayerLoading } = usePrayer()
  const { rows, next, countdown, needsLocation, detectLocation, isSaving } = usePrayerTimes()
  const { monthlyTotal, dailyGoal, isLoading: quranLoading } = useQuran()
  const { session, increment } = useAzkar()

  const data: SoulData = useMemo(() => {
    const prayed: Record<string, boolean> = {}
    for (const name of PRAYER_NAMES) prayed[name] = !!prayerToday?.[name]

    // Pages-based progress mapped to a monthly target (dailyGoal × ~30).
    // TODO(wire): useQuran tracks pages, not surah position — surah label is a stand-in.
    const monthlyGoal = Math.max(1, (dailyGoal ?? 2) * 30)
    const pct = Math.min(100, Math.round((monthlyTotal / monthlyGoal) * 100))

    const v = getDailyAyah()
    const prayerTimes =
      next && countdown && rows.length > 0
        ? {
            rows,
            nextName: PRAYER_DISPLAY_NAMES[next.key] ?? next.key,
            nextLabel: next.label,
            countdown,
          }
        : null

    return {
      prayed,
      ayah: { arabic: v.arabic, translation: v.translation, ref: `${v.surahNameEn} ${v.ref}` },
      quran: { surah: "This month", pct },
      azkar: { goal: session?.target ?? 33, current: session?.count ?? 0 },
      prayerTimes,
      needsLocation,
      locationSaving: isSaving,
    }
  }, [prayerToday, monthlyTotal, dailyGoal, session, rows, next, countdown, needsLocation, isSaving])

  if (prayerLoading || quranLoading) {
    return (
      <PageTransition>
        <PageHeader title="Soul" backHref="/me" />
        <div className="px-5 py-6">
          <LoadingSkeleton variant="card" count={3} />
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <SoulView
        data={data}
        onTogglePrayer={(key) => togglePrayer(key as PrayerName)}
        onIncrementAzkar={increment}
        onDetectLocation={() => void detectLocation()}
      />

      {/* Interactive trackers SoulView's glances don't cover: logging today's
          mood (otherwise unreachable) and logging Qur'an pages. Rendered as an
          additive section below the view. */}
      <section
        className="skin-aware px-5 pb-28 pt-6"
        style={{ background: "var(--background)" }}
      >
        <h2
          className="mb-3 px-1 text-[13px] font-bold uppercase tracking-[0.2em]"
          style={{ color: "var(--color-ink-soft)" }}
        >
          How are you feeling?
        </h2>
        <MoodPicker />
        <div className="mt-6">
          <QuranTracker />
        </div>
      </section>
    </PageTransition>
  )
}

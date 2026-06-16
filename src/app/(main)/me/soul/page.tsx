"use client"

import { useMemo } from "react"
import { PageTransition } from "@/components/animations"
import { PageHeader } from "@/components/shared/PageHeader"
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton"
import { SoulView, type SoulData } from "@/components/spiritual/SoulView"
import { getDailyAyah } from "@/lib/quran/daily-ayah"
import { usePrayer } from "@/lib/hooks/use-prayer"
import { useQuran } from "@/lib/hooks/use-quran"
import { useAzkar } from "@/lib/hooks/use-azkar"
import { PRAYER_NAMES, type PrayerName } from "@/lib/types/spiritual.types"

export default function SoulPage() {
  const { today: prayerToday, togglePrayer, isLoading: prayerLoading } = usePrayer()
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
    return {
      prayed,
      ayah: { arabic: v.arabic, translation: v.translation, ref: `${v.surahNameEn} ${v.ref}` },
      quran: { surah: "This month", pct },
      azkar: { goal: session?.target ?? 33, current: session?.count ?? 0 },
    }
  }, [prayerToday, monthlyTotal, dailyGoal, session])

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
      />
    </PageTransition>
  )
}

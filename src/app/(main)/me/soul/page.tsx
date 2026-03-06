"use client"

import { PageTransition } from "@/components/animations"
import { PageHeader } from "@/components/shared/PageHeader"
import { PrayerTracker } from "@/components/spiritual/PrayerTracker"
import { QuranTracker } from "@/components/spiritual/QuranTracker"
import { AzkarCounter } from "@/components/spiritual/AzkarCounter"
import { DailyAyah } from "@/components/spiritual/DailyAyah"

export default function SoulPage() {
  return (
    <PageTransition>
      <div className="texture-islamic min-h-screen">
        <PageHeader title="Soul" backHref="/me" />

        <div className="space-y-6 pb-8">
          <PrayerTracker />
          <QuranTracker />
          <AzkarCounter />
          <DailyAyah />
        </div>
      </div>
    </PageTransition>
  )
}

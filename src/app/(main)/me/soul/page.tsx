"use client"

import { BookOpen } from "lucide-react"
import { PageTransition } from "@/components/animations"
import { PageHeader } from "@/components/shared/PageHeader"
import { PrayerTracker } from "@/components/spiritual/PrayerTracker"
import { QuranTracker } from "@/components/spiritual/QuranTracker"
import { AzkarCounter } from "@/components/spiritual/AzkarCounter"

export default function SoulPage() {
  return (
    <PageTransition>
      <PageHeader title="Soul" backHref="/me" />

      <PrayerTracker />

      <div className="border-t border-[var(--color-border-subtle,rgba(44,40,37,0.08))] mx-6 my-6" data-testid="divider-1" />

      <QuranTracker />

      <div className="border-t border-[var(--color-border-subtle,rgba(44,40,37,0.08))] mx-6 my-6" data-testid="divider-2" />

      <AzkarCounter />

      <div className="border-t border-[var(--color-border-subtle,rgba(44,40,37,0.08))] mx-6 my-6" data-testid="divider-3" />

      {/* Future: Daily Verse / Hadith */}
      <div className="px-6 py-4 flex items-center gap-2 text-[var(--color-text-muted,#B5ADA4)]" data-testid="future-placeholder">
        <BookOpen size={16} />
        <span className="text-[13px]">Daily Verse / Hadith — coming soon</span>
      </div>

      {/* Bottom spacing */}
      <div className="h-8" />
    </PageTransition>
  )
}

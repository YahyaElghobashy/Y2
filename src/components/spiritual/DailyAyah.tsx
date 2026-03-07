"use client"

import { Share2, Bookmark } from "lucide-react"
import { cn } from "@/lib/utils"

type DailyAyahProps = {
  className?: string
}

// Static verse for now — in a future task, this could be fetched from an API
const DAILY_VERSE = {
  arabic: "فَاذْكُرُونِي أَذْكُرْكُمْ وَاشْكُرُوا لِي وَلَا تَكْفُرُونِ",
  translation:
    "So remember Me; I will remember you. And be grateful to Me and do not deny Me.",
  reference: "Surah Al-Baqarah 2:152",
}

export function DailyAyah({ className }: DailyAyahProps) {
  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        text: `${DAILY_VERSE.arabic}\n\n"${DAILY_VERSE.translation}"\n\n— ${DAILY_VERSE.reference}`,
      })
    }
  }

  return (
    <div className={cn("px-6", className)} data-testid="daily-ayah">
      <h3
        className="text-sm uppercase tracking-[0.2em] font-bold mb-4"
        style={{ color: "var(--sage, #A8B5A0)" }}
      >
        Daily Ayah
      </h3>

      <div
        className="rounded-2xl bg-white overflow-hidden"
        style={{
          borderTop: "4px solid var(--gold, #DAA520)",
          boxShadow: "var(--shadow-warm-sm, 0 1px 3px rgba(44,40,37,0.06))",
        }}
      >
        {/* Verse content */}
        <div className="p-6 text-center space-y-6">
          {/* Arabic text */}
          <p
            className="font-arabic text-2xl leading-relaxed text-[var(--text-primary)]"
            dir="rtl"
            data-testid="ayah-arabic"
          >
            {DAILY_VERSE.arabic}
          </p>

          {/* Translation + reference */}
          <div className="space-y-2">
            <p
              className="font-body text-[var(--text-secondary)] italic leading-snug"
              data-testid="ayah-translation"
            >
              &ldquo;{DAILY_VERSE.translation}&rdquo;
            </p>
            <p
              className="text-[10px] font-bold uppercase tracking-[0.2em]"
              style={{ color: "var(--gold, #DAA520)" }}
              data-testid="ayah-reference"
            >
              {DAILY_VERSE.reference}
            </p>
          </div>
        </div>

        {/* Action bar */}
        <div
          className="px-6 py-3 flex justify-between items-center"
          style={{ backgroundColor: "rgba(168,181,160,0.08)" }}
        >
          <button
            type="button"
            onClick={handleShare}
            className="p-1 transition-colors"
            style={{ color: "rgba(168,181,160,0.6)" }}
            aria-label="Share verse"
            data-testid="ayah-share"
          >
            <Share2 size={18} />
          </button>
          <button
            type="button"
            className="p-1 transition-colors"
            style={{ color: "rgba(168,181,160,0.6)" }}
            aria-label="Bookmark verse"
            data-testid="ayah-bookmark"
          >
            <Bookmark size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}

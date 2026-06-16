"use client"

import { LettersView, LETTERS_MOCK } from "@/components/keepsake/LettersView"
import { BottomNav } from "@/components/shared/BottomNav"

export default function PreviewLettersPage() {
  return (
    <div className="relative mx-auto min-h-[100dvh] max-w-[430px]" style={{ background: "var(--background)" }}>
      <LettersView letters={LETTERS_MOCK} />
      <BottomNav />
    </div>
  )
}

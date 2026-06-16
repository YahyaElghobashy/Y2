"use client"

import { BottomNav } from "@/components/shared/BottomNav"
import { SectionBackground } from "@/components/animations/SectionBackground"
import { useSkin } from "@/lib/hooks/use-skin"

type AppShellProps = {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  // Drives the time-aware skin (data-skin on <html>). Night is scoped to
  // `.skin-aware` wrappers, so this never alters un-migrated screens.
  useSkin()
  return (
    <div className="relative min-h-[100dvh]">
      <SectionBackground />
      <main className="relative z-10 pb-24">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}

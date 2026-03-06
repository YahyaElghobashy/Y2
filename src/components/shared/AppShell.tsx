"use client"

import { BottomNav } from "@/components/shared/BottomNav"
import { SectionBackground } from "@/components/animations/SectionBackground"

type AppShellProps = {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
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

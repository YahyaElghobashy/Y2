"use client"

import { BottomNav } from "@/components/shared/BottomNav"
import { HayahGradient } from "@/components/animations/HayahGradient"

type AppShellProps = {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="relative min-h-[100dvh] bg-bg-primary">
      <HayahGradient />
      <main className="relative z-10 pb-24">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}

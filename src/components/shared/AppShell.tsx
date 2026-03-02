"use client"

import { BottomNav } from "@/components/shared/BottomNav"

type AppShellProps = {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-[100dvh] bg-bg-primary">
      <main className="pb-24">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}

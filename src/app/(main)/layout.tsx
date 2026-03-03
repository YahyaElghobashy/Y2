"use client"

import { AppShell } from "@/components/shared/AppShell"
import { ProfileSetupOverlay } from "@/components/shared/ProfileSetupOverlay"
import { useAuth } from "@/lib/providers/AuthProvider"

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, profileNeedsSetup, refreshProfile, isLoading } = useAuth()

  return (
    <AppShell>
      {children}
      {!isLoading && profileNeedsSetup && user && (
        <ProfileSetupOverlay
          userId={user.id}
          userEmail={user.email ?? ""}
          onComplete={refreshProfile}
        />
      )}
    </AppShell>
  )
}

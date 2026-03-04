"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { AppShell } from "@/components/shared/AppShell"
import { ProfileSetupOverlay } from "@/components/shared/ProfileSetupOverlay"
import { useAuth } from "@/lib/providers/AuthProvider"

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, profile, profileNeedsSetup, refreshProfile, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  // Redirect unpaired users to /pair (unless already there or setting up profile)
  useEffect(() => {
    if (isLoading || !user || !profile || profileNeedsSetup) return
    if (profile.pairing_status !== "paired" && pathname !== "/pair") {
      router.replace("/pair")
    }
  }, [isLoading, user, profile, profileNeedsSetup, pathname, router])

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

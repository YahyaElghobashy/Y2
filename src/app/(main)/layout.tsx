"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { AppShell } from "@/components/shared/AppShell"
import { ProfileSetupOverlay } from "@/components/shared/ProfileSetupOverlay"
import { InstallPrompt } from "@/components/shared/InstallPrompt"
import { CouponReceiveAnimation } from "@/components/coupons/CouponReceiveAnimation"
import { useAuth } from "@/lib/providers/AuthProvider"
import { useNewCouponDetection } from "@/lib/hooks/use-new-coupon-detection"

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, profile, profileNeedsSetup, refreshProfile, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const { newCoupon, showAnimation, onSaveForLater } = useNewCouponDetection()

  const isOnboarding = pathname.startsWith("/onboarding")

  // Onboarding guard + unpaired redirect
  useEffect(() => {
    if (isLoading || !user || !profile) return

    // Let onboarding handle its own routing
    if (isOnboarding) return

    // Skip guards during profile setup overlay
    if (profileNeedsSetup) return

    // Redirect to onboarding if not completed
    if (!profile.onboarding_completed_at) {
      // Forward deep link code param to onboarding (e.g. ?code=ABC123)
      const urlParams = new URLSearchParams(window.location.search)
      const code = urlParams.get("code")
      router.replace(code ? `/onboarding?code=${code}` : "/onboarding")
      return
    }

    // Redirect unpaired users to /pair (unless already there)
    if (profile.pairing_status !== "paired" && pathname !== "/pair") {
      router.replace("/pair")
    }
  }, [isLoading, user, profile, profileNeedsSetup, isOnboarding, pathname, router])

  return (
    <AppShell>
      {children}
      {!isLoading && profileNeedsSetup && user && !isOnboarding && (
        <ProfileSetupOverlay
          userId={user.id}
          userEmail={user.email ?? ""}
          onComplete={refreshProfile}
        />
      )}
      {!isOnboarding && <InstallPrompt />}
      {!isOnboarding && showAnimation && newCoupon && (
        <CouponReceiveAnimation
          visible={showAnimation}
          couponTitle={newCoupon.title}
          couponId={newCoupon.id}
          onOpen={(id) => {
            onSaveForLater()
            router.push(`/us/coupons/${id}`)
          }}
          onDismiss={onSaveForLater}
        />
      )}
    </AppShell>
  )
}

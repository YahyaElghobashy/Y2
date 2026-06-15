"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { AppShell } from "@/components/shared/AppShell"
import { ProfileSetupOverlay } from "@/components/shared/ProfileSetupOverlay"
import { InstallPrompt } from "@/components/shared/InstallPrompt"
import { PairingNudge } from "@/components/pairing/PairingNudge"
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
  const isPairing = pathname.startsWith("/pair")
  const onboardingDone = !!profile?.onboarding_completed_at

  // Onboarding guard — new/incomplete users are guided into the (skippable)
  // onboarding flow. Pairing is NOT hard-gated: unpaired users are encouraged
  // via the PairingNudge banner below, never blocked.
  useEffect(() => {
    if (isLoading || !user || !profile) return

    // Let onboarding handle its own routing. Also never redirect away from the
    // pairing routes: a partner invite deep-link (/pair/[code]) must be able to
    // auto-pair even before onboarding is done — pairing is encouraged, not
    // gated. /pair/[code] passes its code as a path param, which a redirect to
    // /onboarding would silently drop. After pairing they return to "/" and the
    // guard below resumes guiding them into onboarding.
    if (isOnboarding || isPairing) return

    // Onboarding not yet completed/skipped → guide into it, forwarding any
    // deep-link pairing code present as a query param. Skipping inside
    // onboarding stamps onboarding_completed_at and lands on home, so this
    // never loops.
    if (!profile.onboarding_completed_at) {
      const code = new URLSearchParams(window.location.search).get("code")
      router.replace(code ? `/onboarding?code=${code}` : "/onboarding")
    }
  }, [isLoading, user, profile, isOnboarding, isPairing, router])

  return (
    <AppShell>
      {children}
      {/* Profile setup is owned by the onboarding ProfileStep. The overlay only
          acts as a fallback for users who skipped onboarding past that step
          (onboarding complete but display_name still missing). */}
      {!isLoading && user && onboardingDone && profileNeedsSetup && !isOnboarding && (
        <ProfileSetupOverlay
          userId={user.id}
          userEmail={user.email ?? ""}
          onComplete={refreshProfile}
        />
      )}
      {/* Encourage (never force) unpaired users to connect. */}
      {!isLoading &&
        user &&
        onboardingDone &&
        !profileNeedsSetup &&
        profile?.pairing_status !== "paired" &&
        !isOnboarding &&
        !isPairing && <PairingNudge />}
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

"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

/**
 * Legacy reset-password route — previously used for magic-link token exchange.
 * Now redirects to /forgot-password which handles the full OTP-based flow.
 */
export default function ResetPasswordPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/forgot-password")
  }, [router])

  return (
    <div className="flex min-h-[100dvh] items-center justify-center">
      <Loader2 className="size-6 animate-spin text-[var(--accent-copper,#B87333)]" />
    </div>
  )
}

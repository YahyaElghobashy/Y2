"use client"

import { useEffect, useRef, useState, use } from "react"
import { useRouter } from "next/navigation"
import { Heart, AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PairingCelebration } from "@/components/pairing/PairingCelebration"
import { useAuth } from "@/lib/providers/AuthProvider"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { storePendingPairCode } from "@/lib/pairing-link"

type PairState = "loading" | "pairing" | "success" | "already_paired" | "error"

export default function PairCodePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params)
  const { user, profile, isLoading: authLoading, refreshProfile } = useAuth()
  const router = useRouter()

  const [state, setState] = useState<PairState>("loading")
  const [error, setError] = useState<string | null>(null)
  const [partnerName, setPartnerName] = useState<string | null>(null)

  // The mount decision (already-paired vs. auto-pair) is made exactly once.
  // Without this, the refreshProfile() after a successful pair flips
  // pairing_status to "paired", re-runs this effect, and would unmount the
  // celebration into the "already paired" screen before it's seen.
  const startedRef = useRef(false)

  const upperCode = code?.toUpperCase()

  useEffect(() => {
    if (authLoading) return

    // Unauthenticated: store code → redirect to login
    if (!user) {
      storePendingPairCode(upperCode)
      router.replace(`/login?redirectTo=/pair/${upperCode}`)
      return
    }

    if (startedRef.current) return
    startedRef.current = true

    // Already paired on arrival: show message
    if (profile?.pairing_status === "paired") {
      setState("already_paired")
      return
    }

    // Authenticated + unpaired → auto-pair
    async function autoPair() {
      setState("pairing")
      const supabase = getSupabaseBrowserClient()

      try {
        const { data, error: rpcError } = await supabase.rpc("pair_partners", {
          my_id: user!.id,
          partner_code: upperCode,
        })

        if (rpcError) {
          setState("error")
          setError("Something went wrong. Try again.")
          return
        }

        const result = data as { success?: boolean; error?: string; partner_name?: string }

        if (result.error) {
          setState("error")
          setError(result.error)
          return
        }

        if (result.success) {
          setPartnerName(result.partner_name || "your partner")
          setState("success")
          await refreshProfile()
        }
      } catch {
        setState("error")
        setError("Something went wrong. Try again.")
      }
    }

    autoPair()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, profile])

  // Loading state
  if (state === "loading" || state === "pairing") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-bg-primary)] px-5">
        <div className="flex flex-col items-center gap-4" data-testid="pair-code-loading">
          <Loader2 size={32} className="animate-spin text-[var(--color-accent-primary)]" />
          <p className="font-body text-[15px] text-[var(--color-text-secondary)]">
            {state === "pairing" ? "Pairing you with your partner..." : "Loading..."}
          </p>
        </div>
      </main>
    )
  }

  // Success state → play the shared keepsake celebration. It gates its own
  // exit ("Enter Hayah"), so the paired redirect can't unmount it early.
  if (state === "success") {
    const userName = profile?.display_name?.trim() || "You"
    return (
      <div data-testid="pair-code-success">
        <PairingCelebration
          variant="seal"
          nameA={userName}
          nameB={partnerName || "your partner"}
          onDone={() => router.replace("/")}
        />
      </div>
    )
  }

  // Already paired
  if (state === "already_paired") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-bg-primary)] px-5">
        <div className="flex flex-col items-center gap-6" data-testid="pair-code-already-paired">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-accent-soft)]">
            <Heart size={28} className="text-[var(--color-accent-primary)]" />
          </div>
          <div className="text-center">
            <h3 className="mb-2 font-display text-[22px] font-bold text-[var(--color-text-primary)]">
              Already paired
            </h3>
            <p className="font-body text-[15px] text-[var(--color-text-secondary)]">
              You&apos;re already connected with your partner.
            </p>
          </div>
          <Button
            onClick={() => router.replace("/")}
            className="h-12 rounded-xl bg-[var(--color-accent-primary)] px-8 font-body text-[15px] font-medium text-white"
            data-testid="pair-go-home-btn"
          >
            Go Home
          </Button>
        </div>
      </main>
    )
  }

  // Error state
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-bg-primary)] px-5">
      <div className="flex flex-col items-center gap-6" data-testid="pair-code-error">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
          <AlertCircle size={28} className="text-[var(--error)]" />
        </div>
        <div className="text-center">
          <h3 className="mb-2 font-display text-[22px] font-bold text-[var(--color-text-primary)]">
            Pairing failed
          </h3>
          <p className="font-body text-[15px] text-[var(--color-text-secondary)]">
            {error}
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => router.replace("/pair")}
            className="h-12 rounded-xl border-[var(--color-border-subtle)] px-6 font-body text-[15px] font-medium"
            data-testid="pair-try-manual-btn"
          >
            Enter Code Manually
          </Button>
        </div>
      </div>
    </main>
  )
}

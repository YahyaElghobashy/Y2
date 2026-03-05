"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Heart, AlertCircle, PartyPopper, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
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

  const upperCode = code?.toUpperCase()

  useEffect(() => {
    if (authLoading) return

    // Unauthenticated: store code → redirect to login
    if (!user) {
      storePendingPairCode(upperCode)
      router.replace(`/login?redirectTo=/pair/${upperCode}`)
      return
    }

    // Already paired: show message
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
          <p className="font-[family-name:var(--font-body)] text-[15px] text-[var(--color-text-secondary)]">
            {state === "pairing" ? "Pairing you with your partner..." : "Loading..."}
          </p>
        </div>
      </main>
    )
  }

  // Success state
  if (state === "success") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-bg-primary)] px-5">
        <div className="flex flex-col items-center gap-6" data-testid="pair-code-success">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <PartyPopper size={64} className="text-[var(--color-accent-primary)]" />
          </motion.div>
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.3 }}
          >
            <h3 className="mb-2 font-[family-name:var(--font-display)] text-[22px] font-bold text-[var(--color-text-primary)]">
              You&apos;re paired!
            </h3>
            <p className="font-[family-name:var(--font-body)] text-[15px] text-[var(--color-text-secondary)]">
              Connected with {partnerName}
            </p>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
            <Button
              onClick={() => router.replace("/")}
              className="h-12 rounded-xl bg-[var(--color-accent-primary)] px-8 font-[family-name:var(--font-body)] text-[15px] font-medium text-white"
              data-testid="pair-enter-btn"
            >
              Enter Hayah
            </Button>
          </motion.div>
        </div>
      </main>
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
            <h3 className="mb-2 font-[family-name:var(--font-display)] text-[22px] font-bold text-[var(--color-text-primary)]">
              Already paired
            </h3>
            <p className="font-[family-name:var(--font-body)] text-[15px] text-[var(--color-text-secondary)]">
              You&apos;re already connected with your partner.
            </p>
          </div>
          <Button
            onClick={() => router.replace("/")}
            className="h-12 rounded-xl bg-[var(--color-accent-primary)] px-8 font-[family-name:var(--font-body)] text-[15px] font-medium text-white"
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
          <h3 className="mb-2 font-[family-name:var(--font-display)] text-[22px] font-bold text-[var(--color-text-primary)]">
            Pairing failed
          </h3>
          <p className="font-[family-name:var(--font-body)] text-[15px] text-[var(--color-text-secondary)]">
            {error}
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => router.replace("/pair")}
            className="h-12 rounded-xl border-[var(--color-border-subtle)] px-6 font-[family-name:var(--font-body)] text-[15px] font-medium"
            data-testid="pair-try-manual-btn"
          >
            Enter Code Manually
          </Button>
        </div>
      </div>
    </main>
  )
}

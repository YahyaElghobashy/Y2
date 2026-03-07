"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Heart, AlertCircle, Loader2 } from "lucide-react"
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
          <p className="font-body text-[15px] text-[var(--color-text-secondary)]">
            {state === "pairing" ? "Pairing you with your partner..." : "Loading..."}
          </p>
        </div>
      </main>
    )
  }

  // Success state
  if (state === "success") {
    const userName = profile?.display_name || "You"
    return (
      <main
        className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-5"
        style={{
          background:
            "linear-gradient(135deg, var(--bg-warm-white, #FFFDF9) 0%, var(--bg-soft-cream, #F5EDE3) 100%)",
        }}
        data-testid="pair-code-success"
      >
        {/* Copper glow */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.15, 0.08] }}
          transition={{ duration: 2.5, ease: "easeInOut" }}
          style={{
            background:
              "radial-gradient(circle at 50% 50%, rgba(184,115,51,0.15) 0%, transparent 70%)",
          }}
          aria-hidden
        />

        <div className="relative z-10 flex flex-col items-center text-center">
          {/* CONNECTION ESTABLISHED */}
          <motion.span
            className="mb-2 text-xs font-bold tracking-[0.2em] uppercase text-[var(--color-text-muted)]"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            Connection Established
          </motion.span>

          {/* Names + Heart */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <motion.h1
              className="font-display text-5xl font-bold tracking-tight text-[var(--color-text-primary)]"
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              {userName}
            </motion.h1>

            <motion.div
              className="relative flex items-center justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1, 1.3, 1] }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <motion.div
                className="absolute rounded-full"
                style={{ width: 48, height: 48, border: "2px solid var(--accent-copper, #B87333)" }}
                initial={{ scale: 1, opacity: 0 }}
                animate={{ scale: [1, 2.5], opacity: [0.4, 0] }}
                transition={{ duration: 1.5, delay: 1.0, repeat: 2, repeatDelay: 0.5 }}
                aria-hidden
              />
              <Heart
                size={40}
                className="fill-[var(--accent-copper,#B87333)] text-[var(--accent-copper,#B87333)]"
              />
            </motion.div>

            <motion.h1
              className="font-display text-5xl font-bold tracking-tight text-[var(--color-text-primary)]"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              {partnerName}
            </motion.h1>
          </div>

          {/* Subtitle */}
          <motion.p
            className="font-display text-xl italic text-[var(--color-text-primary)] opacity-80 max-w-md leading-relaxed"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5, duration: 0.4 }}
          >
            You&apos;re connected. This is yours now.
          </motion.p>

          {/* Decorative divider */}
          <motion.div
            className="mt-12 mb-12 flex gap-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.0, duration: 0.4 }}
          >
            <div className="h-1 w-8 rounded-full opacity-20" style={{ backgroundColor: "var(--accent-copper, #B87333)" }} />
            <div className="h-1 w-12 rounded-full" style={{ backgroundColor: "var(--accent-copper, #B87333)" }} />
            <div className="h-1 w-8 rounded-full opacity-20" style={{ backgroundColor: "var(--accent-copper, #B87333)" }} />
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.5, duration: 0.3 }}
          >
            <Button
              onClick={() => router.replace("/")}
              className="h-14 rounded-xl px-8 font-body text-[16px] font-bold text-white"
              style={{
                backgroundColor: "var(--accent-copper, #B87333)",
                boxShadow: "0 4px 14px rgba(184,115,51,0.3)",
              }}
              data-testid="pair-enter-btn"
            >
              Enter Your Space →
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

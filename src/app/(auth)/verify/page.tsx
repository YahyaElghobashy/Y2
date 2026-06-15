"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Mail, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { OtpInput } from "@/components/auth/OtpInput"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

function VerifyContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get("email") ?? ""
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()

  const [otp, setOtp] = useState("")
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(60)
  const [resending, setResending] = useState(false)

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000)
    return () => clearInterval(timer)
  }, [countdown])

  const handleVerify = useCallback(
    async (token: string) => {
      if (token.length !== 6 || !email) return
      setVerifying(true)
      setError(null)

      try {
        const { error: verifyError } = await supabase.auth.verifyOtp({
          email,
          token,
          type: "email",
        })

        if (verifyError) {
          if (verifyError.message.includes("expired")) {
            setError("Code expired. Please request a new one.")
          } else if (verifyError.message.includes("invalid") || verifyError.message.includes("Invalid")) {
            setError("Invalid code. Please try again.")
          } else {
            setError(verifyError.message)
          }
          setOtp("")
          return
        }

        router.push("/")
      } catch {
        setError("Something went wrong. Check your connection.")
        setOtp("")
      } finally {
        setVerifying(false)
      }
    },
    [email, supabase, router]
  )

  // Auto-submit when all 6 digits entered
  useEffect(() => {
    if (otp.length === 6) {
      handleVerify(otp)
    }
  }, [otp, handleVerify])

  const handleResend = useCallback(async () => {
    if (!email) return
    setResending(true)
    setError(null)
    try {
      await supabase.auth.resend({ type: "signup", email })
      setCountdown(60)
    } catch {
      setError("Failed to resend. Try again.")
    } finally {
      setResending(false)
    }
  }, [email, supabase])

  // Guard: no email param
  if (!email) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center px-5 gap-4">
        <p className="font-body text-[14px] text-[var(--text-secondary,#8C8279)]">
          No email provided.
        </p>
        <Button variant="copper" size="pill" asChild>
          <a href="/signup">Go to Sign Up</a>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center px-5">
      <motion.div
        className="w-full max-w-sm text-center"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      >
        {/* Mail icon with glow */}
        <motion.div
          className="relative mx-auto w-20 h-20 mb-8"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring", damping: 12, stiffness: 150 }}
        >
          <div className="absolute inset-0 rounded-full bg-[var(--accent-copper,#B87333)]/10 animate-pulse-copper" />
          <div className="absolute inset-2 rounded-full bg-[var(--accent-soft,#E8D5C0)]/50 flex items-center justify-center">
            <Mail
              size={32}
              className="text-[var(--accent-copper,#B87333)]"
              strokeWidth={1.75}
            />
          </div>
        </motion.div>

        <h1 className="font-display text-[22px] font-bold text-[var(--text-primary,#2C2825)] mb-2">
          Verify your email
        </h1>
        <p className="font-serif italic text-[14px] text-[var(--text-secondary,#8C8279)] mb-8">
          Enter the 6-digit code sent to {email}
        </p>

        {/* OTP Input */}
        <div className="mb-6">
          <OtpInput
            value={otp}
            onChange={setOtp}
            disabled={verifying}
            error={!!error}
          />
        </div>

        {/* Error message */}
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            role="alert"
            aria-live="assertive"
            className="text-[var(--error,#C27070)] text-[13px] font-body mb-4"
          >
            {error}
          </motion.p>
        )}

        {/* Verify button */}
        <div className="flex flex-col gap-3">
          <Button
            variant="copper"
            size="pill"
            disabled={otp.length < 6 || verifying}
            onClick={() => handleVerify(otp)}
            className="w-full"
          >
            {verifying ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify"
            )}
          </Button>

          {/* Resend */}
          <Button
            variant="ghost"
            disabled={countdown > 0 || resending}
            onClick={handleResend}
            className="text-[13px] text-[var(--text-secondary,#8C8279)]"
          >
            {countdown > 0
              ? `Resend code in ${countdown}s`
              : resending
                ? "Sending..."
                : "Resend Code"}
          </Button>

          <Button
            variant="ghost"
            asChild
            className="text-[13px] text-[var(--text-secondary,#8C8279)]"
          >
            <a href="/login">Back to Sign In</a>
          </Button>
        </div>
      </motion.div>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[100dvh] items-center justify-center">
          <Loader2 className="size-6 animate-spin text-[var(--accent-copper,#B87333)]" />
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  )
}

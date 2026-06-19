"use client"

import { useState, useEffect, useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, MailCheck } from "lucide-react"
import Link from "next/link"
import { HayahWordmark } from "@/components/animations/HayahWordmark"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

/* ---------- Schema ---------- */

const emailSchema = z.object({
  email: z.string().email("Enter a valid email"),
})

type EmailFormData = z.infer<typeof emailSchema>
type Step = "email" | "sent"

/* ---------- Page ---------- */

export default function ForgotPasswordPage() {
  const supabase = getSupabaseBrowserClient()

  const [step, setStep] = useState<Step>("email")
  const [email, setEmail] = useState("")

  // Resend cooldown
  const [countdown, setCountdown] = useState(0)
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)
  const [resendError, setResendError] = useState<string | null>(null)

  // Email form
  const {
    register: registerEmail,
    handleSubmit: handleSubmitEmail,
    setError: setEmailError,
    formState: { errors: emailErrors, isSubmitting: emailSubmitting },
  } = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    mode: "onBlur",
  })

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000)
    return () => clearInterval(timer)
  }, [countdown])

  /* ---------- Send recovery LINK ---------- */
  // Free-tier mailer can only send the recovery LINK, not a 6-digit code. The
  // link lands on our PKCE callback, which exchanges the code for a recovery
  // session and forwards to /reset-password to set a new password.

  const sendRecoveryLink = useCallback(
    async (emailAddr: string) => {
      const { error } = await supabase.auth.resetPasswordForEmail(emailAddr, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      })

      if (error) {
        if (
          error.message.toLowerCase().includes("rate") ||
          error.message.toLowerCase().includes("limit")
        ) {
          throw new Error("Please wait before requesting another link.")
        }
        throw new Error(error.message)
      }
    },
    [supabase]
  )

  const onEmailSubmit = async (data: EmailFormData) => {
    try {
      await sendRecoveryLink(data.email)
      setEmail(data.email)
      setStep("sent")
      setCountdown(60)
    } catch (err) {
      setEmailError("root", {
        message:
          err instanceof Error
            ? err.message
            : "Something went wrong. Check your connection.",
      })
    }
  }

  const handleResend = useCallback(async () => {
    if (!email || countdown > 0) return
    setResending(true)
    setResendError(null)
    setResent(false)
    try {
      await sendRecoveryLink(email)
      setResent(true)
      setCountdown(60)
    } catch {
      setResendError("Failed to resend. Try again.")
    } finally {
      setResending(false)
    }
  }, [email, countdown, sendRecoveryLink])

  /* ---------- Shared animation config ---------- */

  const fadeSlide = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -12 },
    transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] },
  }

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center px-5">
      <AnimatePresence mode="wait">
        {/* ── Step 1: Email ── */}
        {step === "email" && (
          <motion.div key="email" className="w-full max-w-sm" {...fadeSlide}>
            <HayahWordmark />

            <div className="text-center mb-8">
              <h1 className="font-display text-[22px] font-bold text-[var(--text-primary,#2C2825)]">
                Forgot your password?
              </h1>
              <p className="font-serif italic text-[14px] text-[var(--text-secondary,#8C8279)] mt-1">
                Enter your email and we&apos;ll send a reset link
              </p>
            </div>

            <form
              onSubmit={handleSubmitEmail(onEmailSubmit)}
              className="flex flex-col gap-5"
              noValidate
            >
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.3 }}
              >
                <label className="text-[12px] font-nav font-medium text-[var(--text-secondary,#8C8279)] uppercase tracking-wider mb-1.5 block">
                  Email
                </label>
                <Input
                  type="email"
                  variant="underline"
                  placeholder="you@example.com"
                  autoComplete="email"
                  className={cn(
                    emailErrors.email && "border-b-[var(--error,#C27070)]"
                  )}
                  {...registerEmail("email")}
                />
                {emailErrors.email && (
                  <p className="text-[var(--error)] text-[12px] mt-1.5 font-body">
                    {emailErrors.email.message}
                  </p>
                )}
              </motion.div>

              {emailErrors.root && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-[var(--error)] text-[13px] text-center font-body"
                >
                  {emailErrors.root.message}
                </motion.p>
              )}

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.3 }}
                className="mt-2"
              >
                <Button
                  type="submit"
                  variant="copper"
                  size="pill"
                  disabled={emailSubmitting}
                  className="w-full"
                >
                  {emailSubmitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>
              </motion.div>
            </form>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-center text-[13px] text-[var(--text-secondary,#8C8279)] mt-6"
            >
              Remember your password?{" "}
              <Link
                href="/login"
                className="text-[var(--accent-copper,#B87333)] font-semibold hover:underline"
              >
                Sign In
              </Link>
            </motion.p>
          </motion.div>
        )}

        {/* ── Step 2: Link sent ── */}
        {step === "sent" && (
          <motion.div
            key="sent"
            className="w-full max-w-sm text-center"
            {...fadeSlide}
          >
            {/* Mail icon with glow */}
            <motion.div
              className="relative mx-auto w-20 h-20 mb-8"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                delay: 0.2,
                type: "spring",
                damping: 12,
                stiffness: 150,
              }}
            >
              <div className="absolute inset-0 rounded-full bg-[var(--accent-copper,#B87333)]/10 animate-pulse-copper" />
              <div className="absolute inset-2 rounded-full bg-[var(--accent-soft,#E8D5C0)]/50 flex items-center justify-center">
                <MailCheck
                  size={32}
                  className="text-[var(--accent-copper,#B87333)]"
                  strokeWidth={1.75}
                />
              </div>
            </motion.div>

            <h1 className="font-display text-[22px] font-bold text-[var(--text-primary,#2C2825)] mb-2">
              Check your email
            </h1>
            <p className="font-serif italic text-[14px] text-[var(--text-secondary,#8C8279)] mb-2">
              We sent a password reset link to
            </p>
            <p className="font-body text-[15px] font-semibold text-[var(--text-primary,#2C2825)] mb-6 break-all">
              {email}
            </p>
            <p className="font-body text-[13px] text-[var(--text-secondary,#8C8279)] mb-8 leading-relaxed">
              Tap the link in that email to set a new password. Open it on this
              device so we can complete the reset for you.
            </p>

            {/* Resent confirmation */}
            {resent && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                role="status"
                aria-live="polite"
                className="text-[var(--accent-copper,#B87333)] text-[13px] font-body mb-4"
              >
                A new link is on its way.
              </motion.p>
            )}

            {/* Error message */}
            {resendError && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                role="alert"
                aria-live="assertive"
                className="text-[var(--error,#C27070)] text-[13px] font-body mb-4"
              >
                {resendError}
              </motion.p>
            )}

            <div className="flex flex-col gap-3">
              {/* Resend */}
              <Button
                variant="ghost"
                disabled={countdown > 0 || resending}
                onClick={handleResend}
                className="text-[13px] text-[var(--text-secondary,#8C8279)]"
              >
                {resending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Sending...
                  </>
                ) : countdown > 0 ? (
                  `Resend link in ${countdown}s`
                ) : (
                  "Resend Link"
                )}
              </Button>

              <Button
                variant="ghost"
                asChild
                className="text-[13px] text-[var(--text-secondary,#8C8279)]"
              >
                <Link href="/login">Back to Sign In</Link>
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

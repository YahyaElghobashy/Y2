"use client"

import { useState, useEffect, useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, Mail } from "lucide-react"
import Link from "next/link"
import { HayahWordmark } from "@/components/animations/HayahWordmark"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

const forgotSchema = z.object({
  email: z.email("Enter a valid email"),
})

type ForgotFormData = z.infer<typeof forgotSchema>

export default function ForgotPasswordPage() {
  const supabase = getSupabaseBrowserClient()

  const [sent, setSent] = useState(false)
  const [sentEmail, setSentEmail] = useState("")
  const [countdown, setCountdown] = useState(0)
  const [resending, setResending] = useState(false)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ForgotFormData>({
    resolver: zodResolver(forgotSchema),
    mode: "onBlur",
  })

  // Countdown timer for resend cooldown
  useEffect(() => {
    if (countdown <= 0) return
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000)
    return () => clearInterval(timer)
  }, [countdown])

  const sendResetEmail = useCallback(
    async (email: string) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        if (error.message.toLowerCase().includes("rate") || error.message.toLowerCase().includes("limit")) {
          throw new Error("Please wait before requesting another reset link.")
        }
        throw new Error(error.message)
      }
    },
    [supabase]
  )

  const onSubmit = async (data: ForgotFormData) => {
    try {
      await sendResetEmail(data.email)
      setSentEmail(data.email)
      setSent(true)
      setCountdown(60)
    } catch (err) {
      setError("root", {
        message: err instanceof Error ? err.message : "Something went wrong. Check your connection.",
      })
    }
  }

  const handleResend = async () => {
    if (!sentEmail || countdown > 0) return
    setResending(true)
    try {
      await sendResetEmail(sentEmail)
      setCountdown(60)
    } catch {
      // Silent — user can try again after cooldown
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center px-5">
      <AnimatePresence mode="wait">
        {!sent ? (
          <motion.div
            key="form"
            className="w-full max-w-sm"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <HayahWordmark />

            <div className="text-center mb-8">
              <h1 className="font-display text-[22px] font-bold text-[var(--text-primary,#2C2825)]">
                Forgot your password?
              </h1>
              <p className="font-serif italic text-[14px] text-[var(--text-secondary,#8C8279)] mt-1">
                Enter your email and we&apos;ll send a reset link
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
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
                    errors.email && "border-b-[var(--error,#C27070)]"
                  )}
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-[var(--error)] text-[12px] mt-1.5 font-body">
                    {errors.email.message}
                  </p>
                )}
              </motion.div>

              {errors.root && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-[var(--error)] text-[13px] text-center font-body"
                >
                  {errors.root.message}
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
                  disabled={isSubmitting}
                  className="w-full"
                >
                  {isSubmitting ? (
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
        ) : (
          <motion.div
            key="sent"
            className="w-full max-w-sm text-center"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          >
            {/* Mail icon with glow — same pattern as verify page */}
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
              Check your email
            </h1>
            <p className="font-serif italic text-[14px] text-[var(--text-secondary,#8C8279)] mb-8">
              We sent a reset link to {sentEmail}
            </p>

            <div className="flex flex-col gap-3">
              <Button
                variant="ghost"
                disabled={countdown > 0 || resending}
                onClick={handleResend}
                className="text-[13px] text-[var(--text-secondary,#8C8279)]"
              >
                {countdown > 0
                  ? `Resend in ${countdown}s`
                  : resending
                    ? "Sending..."
                    : "Resend Link"}
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

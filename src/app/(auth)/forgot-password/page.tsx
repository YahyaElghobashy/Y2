"use client"

import { useState, useEffect, useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, Mail, Check } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { HayahWordmark } from "@/components/animations/HayahWordmark"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { OtpInput } from "@/components/auth/OtpInput"
import {
  PasswordStrengthDots,
  calculatePasswordStrength,
} from "@/components/auth/PasswordStrengthDots"
import { cn } from "@/lib/utils"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

/* ---------- Schemas ---------- */

const emailSchema = z.object({
  email: z.string().email("Enter a valid email"),
})

const passwordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })

type EmailFormData = z.infer<typeof emailSchema>
type PasswordFormData = z.infer<typeof passwordSchema>
type Step = "email" | "otp" | "password" | "success"

/* ---------- Page ---------- */

export default function ForgotPasswordPage() {
  const supabase = getSupabaseBrowserClient()
  const router = useRouter()

  const [step, setStep] = useState<Step>("email")
  const [email, setEmail] = useState("")

  // OTP state
  const [otp, setOtp] = useState("")
  const [verifying, setVerifying] = useState(false)
  const [otpError, setOtpError] = useState<string | null>(null)

  // Resend cooldown
  const [countdown, setCountdown] = useState(0)
  const [resending, setResending] = useState(false)

  // Password state
  const [passwordValue, setPasswordValue] = useState("")

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

  // Password form
  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    setError: setPasswordError,
    formState: { errors: passwordErrors, isSubmitting: passwordSubmitting },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    mode: "onBlur",
  })

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000)
    return () => clearInterval(timer)
  }, [countdown])

  /* ---------- Step 1: Send OTP ---------- */

  const sendOtp = useCallback(
    async (emailAddr: string) => {
      // No redirectTo — Supabase sends a 6-digit code instead of a link
      const { error } = await supabase.auth.resetPasswordForEmail(emailAddr)

      if (error) {
        if (
          error.message.toLowerCase().includes("rate") ||
          error.message.toLowerCase().includes("limit")
        ) {
          throw new Error("Please wait before requesting another code.")
        }
        throw new Error(error.message)
      }
    },
    [supabase]
  )

  const onEmailSubmit = async (data: EmailFormData) => {
    try {
      await sendOtp(data.email)
      setEmail(data.email)
      setStep("otp")
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

  /* ---------- Step 2: Verify OTP ---------- */

  const handleVerifyOtp = useCallback(
    async (token: string) => {
      if (token.length !== 6 || !email) return
      setVerifying(true)
      setOtpError(null)

      try {
        const { error } = await supabase.auth.verifyOtp({
          email,
          token,
          type: "recovery",
        })

        if (error) {
          if (error.message.includes("expired")) {
            setOtpError("Code expired. Please request a new one.")
          } else if (
            error.message.includes("invalid") ||
            error.message.includes("Invalid")
          ) {
            setOtpError("Invalid code. Please try again.")
          } else {
            setOtpError(error.message)
          }
          setOtp("")
          return
        }

        // OTP verified — user now has a valid session
        setStep("password")
      } catch {
        setOtpError("Something went wrong. Check your connection.")
        setOtp("")
      } finally {
        setVerifying(false)
      }
    },
    [email, supabase]
  )

  // Auto-submit when 6 digits entered
  useEffect(() => {
    if (otp.length === 6) {
      handleVerifyOtp(otp)
    }
  }, [otp, handleVerifyOtp])

  const handleResend = useCallback(async () => {
    if (!email || countdown > 0) return
    setResending(true)
    setOtpError(null)
    try {
      await sendOtp(email)
      setCountdown(60)
    } catch {
      setOtpError("Failed to resend. Try again.")
    } finally {
      setResending(false)
    }
  }, [email, countdown, sendOtp])

  /* ---------- Step 3: Set New Password ---------- */

  const onPasswordSubmit = async (data: PasswordFormData) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password,
      })

      if (error) {
        setPasswordError("root", { message: error.message })
        return
      }

      setStep("success")
      setTimeout(() => router.push("/"), 2000)
    } catch {
      setPasswordError("root", {
        message: "Something went wrong. Check your connection.",
      })
    }
  }

  const strength = calculatePasswordStrength(passwordValue)

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
                Enter your email and we&apos;ll send a verification code
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
                    "Send Code"
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

        {/* ── Step 2: OTP Verification ── */}
        {step === "otp" && (
          <motion.div
            key="otp"
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
              Enter the 6-digit code sent to {email}
            </p>

            {/* OTP Input */}
            <div className="mb-6">
              <OtpInput
                value={otp}
                onChange={setOtp}
                disabled={verifying}
                error={!!otpError}
              />
            </div>

            {/* Error message */}
            {otpError && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                role="alert"
                aria-live="assertive"
                className="text-[var(--error,#C27070)] text-[13px] font-body mb-4"
              >
                {otpError}
              </motion.p>
            )}

            {/* Verify button */}
            <div className="flex flex-col gap-3">
              <Button
                variant="copper"
                size="pill"
                disabled={otp.length < 6 || verifying}
                onClick={() => handleVerifyOtp(otp)}
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
                <Link href="/login">Back to Sign In</Link>
              </Button>
            </div>
          </motion.div>
        )}

        {/* ── Step 3: New Password ── */}
        {step === "password" && (
          <motion.div
            key="password"
            className="w-full max-w-sm"
            {...fadeSlide}
          >
            <div className="text-center mb-8">
              <h1 className="font-display text-[22px] font-bold text-[var(--text-primary,#2C2825)]">
                Set new password
              </h1>
              <p className="font-serif italic text-[14px] text-[var(--text-secondary,#8C8279)] mt-1">
                Choose a strong password for your account
              </p>
            </div>

            <form
              onSubmit={handleSubmitPassword(onPasswordSubmit)}
              className="flex flex-col gap-5"
              noValidate
            >
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.3 }}
              >
                <label className="text-[12px] font-nav font-medium text-[var(--text-secondary,#8C8279)] uppercase tracking-wider mb-1.5 block">
                  New Password
                </label>
                <Input
                  type="password"
                  variant="underline"
                  placeholder="Create a new password"
                  autoComplete="new-password"
                  className={cn(
                    passwordErrors.password &&
                      "border-b-[var(--error,#C27070)]"
                  )}
                  {...registerPassword("password", {
                    onChange: (e) => setPasswordValue(e.target.value),
                  })}
                />
                {passwordValue && (
                  <div className="mt-2">
                    <PasswordStrengthDots strength={strength} />
                  </div>
                )}
                {passwordErrors.password && (
                  <p className="text-[var(--error)] text-[12px] mt-1.5 font-body">
                    {passwordErrors.password.message}
                  </p>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.38, duration: 0.3 }}
              >
                <label className="text-[12px] font-nav font-medium text-[var(--text-secondary,#8C8279)] uppercase tracking-wider mb-1.5 block">
                  Confirm Password
                </label>
                <Input
                  type="password"
                  variant="underline"
                  placeholder="Repeat your new password"
                  autoComplete="new-password"
                  className={cn(
                    passwordErrors.confirmPassword &&
                      "border-b-[var(--error,#C27070)]"
                  )}
                  {...registerPassword("confirmPassword")}
                />
                {passwordErrors.confirmPassword && (
                  <p className="text-[var(--error)] text-[12px] mt-1.5 font-body">
                    {passwordErrors.confirmPassword.message}
                  </p>
                )}
              </motion.div>

              {passwordErrors.root && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-[var(--error)] text-[13px] text-center font-body"
                >
                  {passwordErrors.root.message}
                </motion.p>
              )}

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.46, duration: 0.3 }}
                className="mt-2"
              >
                <Button
                  type="submit"
                  variant="copper"
                  size="pill"
                  disabled={passwordSubmitting}
                  className="w-full"
                >
                  {passwordSubmitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Password"
                  )}
                </Button>
              </motion.div>
            </form>
          </motion.div>
        )}

        {/* ── Step 4: Success ── */}
        {step === "success" && (
          <motion.div
            key="success"
            className="w-full max-w-sm text-center"
            {...fadeSlide}
          >
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
              <div className="absolute inset-0 rounded-full bg-[var(--success,#7CB67C)]/10" />
              <div className="absolute inset-2 rounded-full bg-[var(--success,#7CB67C)]/20 flex items-center justify-center">
                <Check
                  size={32}
                  className="text-[var(--success,#7CB67C)]"
                  strokeWidth={2}
                />
              </div>
            </motion.div>

            <h1 className="font-display text-[22px] font-bold text-[var(--text-primary,#2C2825)] mb-2">
              Password updated!
            </h1>
            <p className="font-serif italic text-[14px] text-[var(--text-secondary,#8C8279)]">
              Redirecting you now...
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

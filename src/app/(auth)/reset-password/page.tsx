"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, Check } from "lucide-react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  PasswordStrengthDots,
  calculatePasswordStrength,
} from "@/components/auth/PasswordStrengthDots"
import { cn } from "@/lib/utils"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

/**
 * Set-new-password page for the recovery-LINK flow.
 *
 * The recovery email link lands on /auth/callback, which exchanges the PKCE
 * code for a recovery session and forwards here. We confirm a session exists,
 * then let the user set a new password via supabase.auth.updateUser().
 */

const passwordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })

type PasswordFormData = z.infer<typeof passwordSchema>
type Status = "checking" | "ready" | "invalid" | "success"

export default function ResetPasswordPage() {
  const supabase = getSupabaseBrowserClient()
  const router = useRouter()

  const [status, setStatus] = useState<Status>("checking")
  const [passwordValue, setPasswordValue] = useState("")

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    mode: "onBlur",
  })

  // Confirm we arrived with a valid recovery session.
  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setStatus((prev) =>
        prev === "success" ? prev : data.session ? "ready" : "invalid"
      )
    })

    // The session cookie may settle just after mount — catch it. Only downgrade
    // to "invalid" on an explicit SIGNED_OUT (not a transient null) so a valid
    // recovery session is never falsely rejected.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return
      if (session) {
        setStatus((prev) => (prev === "success" ? prev : "ready"))
      } else if (event === "SIGNED_OUT") {
        setStatus((prev) => (prev === "success" ? prev : "invalid"))
      }
    })

    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [supabase])

  const onSubmit = async (data: PasswordFormData) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password,
      })

      if (error) {
        setError("root", { message: error.message })
        return
      }

      setStatus("success")
      setTimeout(() => router.push("/"), 2000)
    } catch {
      setError("root", {
        message: "Something went wrong. Check your connection.",
      })
    }
  }

  const strength = calculatePasswordStrength(passwordValue)

  const fadeSlide = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -12 },
    transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] },
  }

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center px-5">
      <AnimatePresence mode="wait">
        {/* ── Checking session ── */}
        {status === "checking" && (
          <motion.div key="checking" className="flex items-center justify-center" {...fadeSlide}>
            <Loader2 className="size-6 animate-spin text-[var(--accent-copper,#B87333)]" />
          </motion.div>
        )}

        {/* ── Invalid / expired link ── */}
        {status === "invalid" && (
          <motion.div key="invalid" className="w-full max-w-sm text-center" {...fadeSlide}>
            <h1 className="font-display text-[22px] font-bold text-[var(--text-primary,#2C2825)] mb-2">
              Link expired
            </h1>
            <p className="font-serif italic text-[14px] text-[var(--text-secondary,#8C8279)] mb-8">
              This reset link is invalid or has expired. Request a new one.
            </p>
            <Button variant="copper" size="pill" asChild className="w-full">
              <Link href="/forgot-password">Request a new link</Link>
            </Button>
          </motion.div>
        )}

        {/* ── Set new password ── */}
        {status === "ready" && (
          <motion.div key="ready" className="w-full max-w-sm" {...fadeSlide}>
            <div className="text-center mb-8">
              <h1 className="font-display text-[22px] font-bold text-[var(--text-primary,#2C2825)]">
                Set new password
              </h1>
              <p className="font-serif italic text-[14px] text-[var(--text-secondary,#8C8279)] mt-1">
                Choose a strong password for your account
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
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
                  className={cn(errors.password && "border-b-[var(--error,#C27070)]")}
                  {...register("password", {
                    onChange: (e) => setPasswordValue(e.target.value),
                  })}
                />
                {passwordValue && (
                  <div className="mt-2">
                    <PasswordStrengthDots strength={strength} />
                  </div>
                )}
                {errors.password && (
                  <p className="text-[var(--error)] text-[12px] mt-1.5 font-body">
                    {errors.password.message}
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
                  className={cn(errors.confirmPassword && "border-b-[var(--error,#C27070)]")}
                  {...register("confirmPassword")}
                />
                {errors.confirmPassword && (
                  <p className="text-[var(--error)] text-[12px] mt-1.5 font-body">
                    {errors.confirmPassword.message}
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
                transition={{ delay: 0.46, duration: 0.3 }}
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

        {/* ── Success ── */}
        {status === "success" && (
          <motion.div key="success" className="w-full max-w-sm text-center" {...fadeSlide}>
            <motion.div
              className="relative mx-auto w-20 h-20 mb-8"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring", damping: 12, stiffness: 150 }}
            >
              <div className="absolute inset-0 rounded-full bg-[var(--success,#7CB67C)]/10" />
              <div className="absolute inset-2 rounded-full bg-[var(--success,#7CB67C)]/20 flex items-center justify-center">
                <Check size={32} className="text-[var(--success,#7CB67C)]" strokeWidth={2} />
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

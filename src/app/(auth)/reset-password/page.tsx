"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, Check, AlertCircle } from "lucide-react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  PasswordStrengthDots,
  calculatePasswordStrength,
} from "@/components/auth/PasswordStrengthDots"
import { cn } from "@/lib/utils"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

const resetSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })

type ResetFormData = z.infer<typeof resetSchema>

type PageState = "loading" | "error" | "form" | "success"

function ResetPasswordContent() {
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()

  const [pageState, setPageState] = useState<PageState>("loading")
  const [passwordValue, setPasswordValue] = useState("")

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
    mode: "onBlur",
  })

  // Listen for PASSWORD_RECOVERY event from Supabase
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setPageState("form")
      }
    })

    // Timeout: if no recovery event after 5s, show error
    const timeout = setTimeout(() => {
      setPageState((prev) => (prev === "loading" ? "error" : prev))
    }, 5000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [supabase])

  const onSubmit = async (data: ResetFormData) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password,
      })

      if (error) {
        setError("root", { message: error.message })
        return
      }

      setPageState("success")
      // User already has a valid session — redirect to home
      setTimeout(() => router.push("/"), 2000)
    } catch {
      setError("root", { message: "Something went wrong. Check your connection." })
    }
  }

  const strength = calculatePasswordStrength(passwordValue)

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center px-5">
      <AnimatePresence mode="wait">
        {/* Loading — waiting for token exchange */}
        {pageState === "loading" && (
          <motion.div
            key="loading"
            className="text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Loader2 className="size-8 animate-spin text-[var(--accent-copper,#B87333)] mx-auto mb-4" />
            <p className="font-body text-[14px] text-[var(--text-secondary,#8C8279)]">
              Verifying your reset link...
            </p>
          </motion.div>
        )}

        {/* Error — invalid or expired token */}
        {pageState === "error" && (
          <motion.div
            key="error"
            className="w-full max-w-sm text-center"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <motion.div
              className="relative mx-auto w-20 h-20 mb-8"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring", damping: 12, stiffness: 150 }}
            >
              <div className="absolute inset-0 rounded-full bg-[var(--error,#C27070)]/10" />
              <div className="absolute inset-2 rounded-full bg-[var(--error,#C27070)]/5 flex items-center justify-center">
                <AlertCircle
                  size={32}
                  className="text-[var(--error,#C27070)]"
                  strokeWidth={1.75}
                />
              </div>
            </motion.div>

            <h1 className="font-display text-[22px] font-bold text-[var(--text-primary,#2C2825)] mb-2">
              Invalid or expired link
            </h1>
            <p className="font-serif italic text-[14px] text-[var(--text-secondary,#8C8279)] mb-8">
              This reset link is no longer valid. Please request a new one.
            </p>

            <div className="flex flex-col gap-3">
              <Button variant="copper" size="pill" asChild className="w-full">
                <Link href="/forgot-password">Request New Link</Link>
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

        {/* Form — set new password */}
        {pageState === "form" && (
          <motion.div
            key="form"
            className="w-full max-w-sm"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          >
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
                  className={cn(
                    errors.password && "border-b-[var(--error,#C27070)]"
                  )}
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
                  className={cn(
                    errors.confirmPassword && "border-b-[var(--error,#C27070)]"
                  )}
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

        {/* Success */}
        {pageState === "success" && (
          <motion.div
            key="success"
            className="w-full max-w-sm text-center"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <motion.div
              className="relative mx-auto w-20 h-20 mb-8"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring", damping: 12, stiffness: 150 }}
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

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[100dvh] items-center justify-center">
          <Loader2 className="size-6 animate-spin text-[var(--accent-copper,#B87333)]" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  )
}

"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { motion } from "framer-motion"
import { Loader2, Check, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  PasswordStrengthDots,
  calculatePasswordStrength,
} from "@/components/auth/PasswordStrengthDots"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/providers/AuthProvider"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from current password",
    path: ["newPassword"],
  })

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>

interface ChangePasswordFormProps {
  onClose: () => void
}

export function ChangePasswordForm({ onClose }: ChangePasswordFormProps) {
  const { user } = useAuth()
  const supabase = getSupabaseBrowserClient()
  const [passwordValue, setPasswordValue] = useState("")
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    mode: "onBlur",
  })

  const onSubmit = async (data: ChangePasswordFormData) => {
    if (!user?.email) return

    try {
      // Verify current password
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: data.currentPassword,
      })

      if (verifyError) {
        setError("currentPassword", { message: "Current password is incorrect" })
        return
      }

      // Update password
      const { error } = await supabase.auth.updateUser({
        password: data.newPassword,
      })

      if (error) {
        setError("root", { message: error.message })
        return
      }

      setSuccess(true)
      setTimeout(() => onClose(), 1500)
    } catch {
      setError("root", { message: "Something went wrong. Check your connection." })
    }
  }

  const strength = calculatePasswordStrength(passwordValue)

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] p-6 text-center"
      >
        <div className="relative mx-auto w-12 h-12 mb-3">
          <div className="absolute inset-0 rounded-full bg-[var(--success,#7CB67C)]/10" />
          <div className="absolute inset-1 rounded-full bg-[var(--success,#7CB67C)]/20 flex items-center justify-center">
            <Check size={20} className="text-[var(--success,#7CB67C)]" strokeWidth={2} />
          </div>
        </div>
        <p className="font-display text-[15px] font-semibold text-[var(--color-text-primary)]">
          Password updated!
        </p>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="rounded-2xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border-subtle)]">
        <p className="font-display text-[15px] font-semibold text-[var(--color-text-primary)]">
          Change Password
        </p>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-bg-subtle)] transition-colors"
        >
          <X size={18} strokeWidth={1.5} />
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-4 flex flex-col gap-4" noValidate>
        <div>
          <label className="text-[12px] font-nav font-medium text-[var(--text-secondary,#8C8279)] uppercase tracking-wider mb-1.5 block">
            Current Password
          </label>
          <Input
            type="password"
            variant="underline"
            placeholder="Enter current password"
            autoComplete="current-password"
            className={cn(
              errors.currentPassword && "border-b-[var(--error,#C27070)]"
            )}
            {...register("currentPassword")}
          />
          {errors.currentPassword && (
            <p className="text-[var(--error)] text-[12px] mt-1.5 font-body">
              {errors.currentPassword.message}
            </p>
          )}
        </div>

        <div>
          <label className="text-[12px] font-nav font-medium text-[var(--text-secondary,#8C8279)] uppercase tracking-wider mb-1.5 block">
            New Password
          </label>
          <Input
            type="password"
            variant="underline"
            placeholder="Create a new password"
            autoComplete="new-password"
            className={cn(
              errors.newPassword && "border-b-[var(--error,#C27070)]"
            )}
            {...register("newPassword", {
              onChange: (e) => setPasswordValue(e.target.value),
            })}
          />
          {passwordValue && (
            <div className="mt-2">
              <PasswordStrengthDots strength={strength} />
            </div>
          )}
          {errors.newPassword && (
            <p className="text-[var(--error)] text-[12px] mt-1.5 font-body">
              {errors.newPassword.message}
            </p>
          )}
        </div>

        <div>
          <label className="text-[12px] font-nav font-medium text-[var(--text-secondary,#8C8279)] uppercase tracking-wider mb-1.5 block">
            Confirm New Password
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
        </div>

        {errors.root && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[var(--error)] text-[13px] text-center font-body"
          >
            {errors.root.message}
          </motion.p>
        )}

        <div className="flex gap-3 pt-1">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="flex-1 text-[13px]"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="copper"
            size="pill"
            disabled={isSubmitting}
            className="flex-1"
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
        </div>
      </form>
    </motion.div>
  )
}

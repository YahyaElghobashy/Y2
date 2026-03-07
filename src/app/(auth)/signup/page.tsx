"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Loader2 } from "lucide-react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  PasswordStrengthDots,
  calculatePasswordStrength,
} from "@/components/auth/PasswordStrengthDots"
import { cn } from "@/lib/utils"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

const signupSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.email("Enter a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })

type SignupFormData = z.infer<typeof signupSchema>

export default function SignupPage() {
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()
  const [passwordValue, setPasswordValue] = useState("")

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    mode: "onBlur",
  })

  const onSubmit = async (data: SignupFormData) => {
    try {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: { display_name: data.name },
        },
      })

      if (error) {
        setError("root", { message: error.message })
        return
      }

      router.push("/verify")
    } catch {
      setError("root", { message: "Something went wrong. Check your connection." })
    }
  }

  const strength = calculatePasswordStrength(passwordValue)

  const fields = [
    { name: "name" as const, label: "Your Name", type: "text", placeholder: "What should we call you?", autoComplete: "name" },
    { name: "email" as const, label: "Email", type: "email", placeholder: "you@example.com", autoComplete: "email" },
    { name: "password" as const, label: "Password", type: "password", placeholder: "Create a password", autoComplete: "new-password" },
    { name: "confirmPassword" as const, label: "Confirm Password", type: "password", placeholder: "Repeat your password", autoComplete: "new-password" },
  ]

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center px-5 py-8">
      <motion.div
        className="w-full max-w-sm"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.p
            className="font-arabic text-[28px] text-[var(--accent-copper,#B87333)] mb-2"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            حياة
          </motion.p>
          <h1 className="font-display text-[24px] font-bold text-[var(--text-primary,#2C2825)]">
            Create your account
          </h1>
          <p className="font-serif italic text-[14px] text-[var(--text-secondary,#8C8279)] mt-1">
            Begin your shared journey
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
          {fields.map((field, i) => (
            <motion.div
              key={field.name}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.08, duration: 0.3 }}
            >
              <label className="text-[12px] font-nav font-medium text-[var(--text-secondary,#8C8279)] uppercase tracking-wider mb-1.5 block">
                {field.label}
              </label>
              <Input
                type={field.type}
                variant="underline"
                placeholder={field.placeholder}
                autoComplete={field.autoComplete}
                className={cn(
                  errors[field.name] && "border-b-[var(--error,#C27070)]"
                )}
                {...register(field.name, {
                  onChange: field.name === "password"
                    ? (e) => setPasswordValue(e.target.value)
                    : undefined,
                })}
              />
              {field.name === "password" && passwordValue && (
                <div className="mt-2">
                  <PasswordStrengthDots strength={strength} />
                </div>
              )}
              {errors[field.name] && (
                <p className="text-[var(--error)] text-[12px] mt-1.5 font-body">
                  {errors[field.name]?.message}
                </p>
              )}
            </motion.div>
          ))}

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
            transition={{ delay: 0.65, duration: 0.3 }}
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
                  Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </motion.div>
        </form>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-center text-[13px] text-[var(--text-secondary,#8C8279)] mt-6"
        >
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-[var(--accent-copper,#B87333)] font-semibold hover:underline"
          >
            Sign In
          </Link>
        </motion.p>
      </motion.div>
    </div>
  )
}

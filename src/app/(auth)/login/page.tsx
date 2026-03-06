"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Loader2 } from "lucide-react"
import { HayahWordmark } from "@/components/animations/HayahWordmark"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

const loginSchema = z.object({
  email: z.email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
  })

  const onSubmit = async (data: LoginFormData) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (error) {
        setError("root", { message: "Invalid email or password" })
        return
      }

      router.push("/")
    } catch {
      setError("root", { message: "Something went wrong. Check your connection." })
    }
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center px-5">
      <motion.div
        className="w-full max-w-sm"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <HayahWordmark />

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.1, duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <Input
              type="email"
              placeholder="Email"
              autoComplete="email"
              className={cn(
                "h-12 rounded-[10px] bg-bg-elevated border-border-subtle px-4 text-[15px] font-body placeholder:text-text-muted focus-visible:ring-[var(--accent-glow)] focus-visible:border-[var(--accent-copper)]",
                errors.email && "border-error focus-visible:ring-error/20"
              )}
              {...register("email")}
            />
            {errors.email && (
              <p className="text-[var(--error)] text-[12px] mt-1.5 ps-1 font-body">
                {errors.email.message}
              </p>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.2, duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <Input
              type="password"
              placeholder="Password"
              autoComplete="current-password"
              className={cn(
                "h-12 rounded-[10px] bg-bg-elevated border-border-subtle px-4 text-[15px] font-body placeholder:text-text-muted focus-visible:ring-[var(--accent-glow)] focus-visible:border-[var(--accent-copper)]",
                errors.password && "border-error focus-visible:ring-error/20"
              )}
              {...register("password")}
            />
            {errors.password && (
              <p className="text-[var(--error)] text-[12px] mt-1.5 ps-1 font-body">
                {errors.password.message}
              </p>
            )}
          </motion.div>

          {errors.root && (
            <p className="text-[var(--error)] text-[13px] text-center font-body">
              {errors.root.message}
            </p>
          )}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-12 rounded-xl bg-accent-primary text-white font-body font-medium text-[15px] hover:bg-[var(--accent-hover)] transition-colors mt-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>
      </motion.div>
    </div>
  )
}

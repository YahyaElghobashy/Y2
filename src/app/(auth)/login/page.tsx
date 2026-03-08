"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Loader2 } from "lucide-react"
import Link from "next/link"
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
    <div className="flex min-h-[100dvh] flex-col items-center justify-center px-5">
      <motion.div
        className="w-full max-w-sm"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <HayahWordmark />

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

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.3 }}
          >
            <label className="text-[12px] font-nav font-medium text-[var(--text-secondary,#8C8279)] uppercase tracking-wider mb-1.5 block">
              Password
            </label>
            <Input
              type="password"
              variant="underline"
              placeholder="Your password"
              autoComplete="current-password"
              className={cn(
                errors.password && "border-b-[var(--error,#C27070)]"
              )}
              {...register("password")}
            />
            {errors.password && (
              <p className="text-[var(--error)] text-[12px] mt-1.5 font-body">
                {errors.password.message}
              </p>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45, duration: 0.3 }}
            className="flex justify-end -mt-1"
          >
            <Link
              href="/forgot-password"
              className="text-[12px] text-[var(--text-secondary,#8C8279)] hover:text-[var(--accent-copper,#B87333)] transition-colors"
            >
              Forgot password?
            </Link>
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
            transition={{ delay: 0.5, duration: 0.3 }}
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
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </motion.div>
        </form>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center text-[13px] text-[var(--text-secondary,#8C8279)] mt-6"
        >
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="text-[var(--accent-copper,#B87333)] font-semibold hover:underline"
          >
            Sign Up
          </Link>
        </motion.p>
      </motion.div>
    </div>
  )
}

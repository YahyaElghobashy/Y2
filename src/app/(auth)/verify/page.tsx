"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

export default function VerifyPage() {
  const [countdown, setCountdown] = useState(60)
  const [resending, setResending] = useState(false)
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    if (countdown <= 0) return
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000)
    return () => clearInterval(timer)
  }, [countdown])

  const handleResend = useCallback(async () => {
    setResending(true)
    try {
      // Get current session email for resend
      const { data } = await supabase.auth.getSession()
      const email = data?.session?.user?.email
      if (email) {
        await supabase.auth.resend({
          type: "signup",
          email,
        })
      }
      setCountdown(60)
    } finally {
      setResending(false)
    }
  }, [supabase])

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center px-5">
      <motion.div
        className="w-full max-w-sm text-center"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      >
        {/* Floating mail icon with glow */}
        <motion.div
          className="relative mx-auto w-20 h-20 mb-8"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring", damping: 12, stiffness: 150 }}
        >
          {/* Glow ring */}
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
          We sent a verification link to your inbox
        </p>

        <div className="flex flex-col gap-3">
          <Button
            variant="copper"
            size="pill"
            disabled={countdown > 0 || resending}
            onClick={handleResend}
            className="w-full"
          >
            {countdown > 0
              ? `Resend in ${countdown}s`
              : resending
                ? "Sending..."
                : "Resend Email"
            }
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

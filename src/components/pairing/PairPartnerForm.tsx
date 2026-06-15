"use client"

import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Link2, AlertCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/providers/AuthProvider"

type PairPartnerFormProps = {
  /** Fired on a successful pair, with the partner's display name. */
  onPaired: (partnerName: string) => void
  className?: string
  initialCode?: string
}

type PairState = "idle" | "loading" | "success" | "error"

export function PairPartnerForm({ onPaired, className, initialCode }: PairPartnerFormProps) {
  const { user } = useAuth()
  const supabase = getSupabaseBrowserClient()
  const inputRef = useRef<HTMLInputElement>(null)

  const [code, setCode] = useState(initialCode ?? "")
  const [state, setState] = useState<PairState>("idle")
  const [error, setError] = useState<string | null>(null)
  const [shake, setShake] = useState(false)

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6)
    setCode(value)
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || code.length !== 6) return

    setState("loading")
    setError(null)

    try {
      const { data, error: rpcError } = await supabase.rpc("pair_partners", {
        my_id: user.id,
        partner_code: code,
      })

      if (rpcError) {
        setState("error")
        setError("Something went wrong. Try again.")
        triggerShake()
        return
      }

      const result = data as { success?: boolean; error?: string; partner_name?: string }

      if (result.error) {
        setState("error")
        setError(result.error)
        triggerShake()
        return
      }

      if (result.success) {
        setState("success")
        // Hand the partner name up; the page plays the keepsake celebration
        // and only then refreshes the profile + redirects (so it isn't
        // unmounted by an early paired-status redirect).
        onPaired(result.partner_name || "your partner")
      }
    } catch {
      setState("error")
      setError("Something went wrong. Try again.")
      triggerShake()
    }
  }

  const triggerShake = () => {
    setShake(true)
    setTimeout(() => setShake(false), 500)
  }

  if (state === "success") {
    // The page renders the keepsake overlay; the form just steps aside.
    return null
  }

  return (
    <div className={className}>
      <div className="flex flex-col items-center gap-4">
        <p className="font-body text-[14px] text-[var(--color-text-secondary)]">
          Have a code?
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4 w-full max-w-xs">
          <motion.div
            className="w-full"
            animate={shake ? { x: [-8, 8, -6, 6, -3, 3, 0] } : {}}
            transition={{ duration: 0.4 }}
          >
            <Input
              ref={inputRef}
              type="text"
              inputMode="text"
              autoCapitalize="characters"
              autoComplete="off"
              maxLength={6}
              value={code}
              onChange={handleCodeChange}
              placeholder="XXXXXX"
              className={cn(
                "h-14 rounded-xl text-center font-mono text-[24px] tracking-[0.3em] font-bold",
                "bg-[var(--color-bg-elevated)] border-[var(--color-border-subtle)]",
                "placeholder:text-[var(--color-text-muted)] placeholder:tracking-[0.3em]",
                error && "border-[var(--error)]"
              )}
              data-testid="pair-code-input"
            />
          </motion.div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                className="flex items-center gap-2 text-[var(--error)]"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                data-testid="pair-error"
              >
                <AlertCircle size={14} />
                <span className="font-body text-[13px]">{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <Button
            type="submit"
            disabled={code.length !== 6 || state === "loading"}
            className="w-full h-12 gap-2 rounded-xl bg-[var(--color-accent-primary)] text-white font-body font-medium text-[15px] disabled:opacity-50"
            data-testid="pair-submit-btn"
          >
            <Link2 size={18} />
            {state === "loading" ? "Pairing..." : "Pair with partner"}
          </Button>
        </form>
      </div>
    </div>
  )
}

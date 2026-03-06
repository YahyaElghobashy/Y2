"use client"

import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Link2, AlertCircle, PartyPopper } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/providers/AuthProvider"

type PairPartnerFormProps = {
  onPaired: () => void
  className?: string
  initialCode?: string
}

type PairState = "idle" | "loading" | "success" | "error"

const CONFETTI_COLORS = [
  "var(--color-accent-primary)",
  "#D4A574",
  "#E8D5C0",
  "#C4956A",
  "#B87333",
]

function ConfettiParticle({ index }: { index: number }) {
  const angle = (index / 20) * 360
  const distance = 80 + (index % 5) * 30
  const x = Math.cos((angle * Math.PI) / 180) * distance
  const y = Math.sin((angle * Math.PI) / 180) * distance
  const rotation = Math.random() * 360
  const size = 6 + (index % 3) * 3

  return (
    <motion.div
      className="absolute rounded-sm"
      style={{
        width: size,
        height: size,
        backgroundColor: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
        left: "50%",
        top: "50%",
      }}
      initial={{ x: 0, y: 0, opacity: 1, scale: 0, rotate: 0 }}
      animate={{
        x,
        y: y - 20,
        opacity: 0,
        scale: 1,
        rotate: rotation,
      }}
      transition={{ duration: 1.2, ease: [0.25, 0.1, 0.25, 1] }}
    />
  )
}

export function PairPartnerForm({ onPaired, className, initialCode }: PairPartnerFormProps) {
  const { user, refreshProfile } = useAuth()
  const supabase = getSupabaseBrowserClient()
  const inputRef = useRef<HTMLInputElement>(null)

  const [code, setCode] = useState(initialCode ?? "")
  const [state, setState] = useState<PairState>("idle")
  const [error, setError] = useState<string | null>(null)
  const [partnerName, setPartnerName] = useState<string | null>(null)
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
        setPartnerName(result.partner_name || "your partner")
        setState("success")
        await refreshProfile()
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
    return (
      <div className={cn("flex flex-col items-center gap-6", className)}>
        <div className="relative">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <PartyPopper size={64} className="text-[var(--color-accent-primary)]" />
          </motion.div>
          {Array.from({ length: 20 }).map((_, i) => (
            <ConfettiParticle key={i} index={i} />
          ))}
        </div>
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
        >
          <h3 className="font-[family-name:var(--font-display)] text-[22px] font-bold text-[var(--color-text-primary)] mb-2">
            You&apos;re paired!
          </h3>
          <p className="font-[family-name:var(--font-body)] text-[15px] text-[var(--color-text-secondary)]">
            Connected with {partnerName}
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <Button
            onClick={onPaired}
            className="h-12 px-8 rounded-xl bg-[var(--color-accent-primary)] text-white font-[family-name:var(--font-body)] font-medium text-[15px]"
            data-testid="enter-hayah-btn"
          >
            Enter Hayah
          </Button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="flex flex-col items-center gap-4">
        <p className="font-[family-name:var(--font-body)] text-[14px] text-[var(--color-text-secondary)]">
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
                "h-14 rounded-xl text-center font-[family-name:var(--font-mono)] text-[24px] tracking-[0.3em] font-bold",
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
                <span className="font-[family-name:var(--font-body)] text-[13px]">{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <Button
            type="submit"
            disabled={code.length !== 6 || state === "loading"}
            className="w-full h-12 gap-2 rounded-xl bg-[var(--color-accent-primary)] text-white font-[family-name:var(--font-body)] font-medium text-[15px] disabled:opacity-50"
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

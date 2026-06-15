"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Heart, X } from "lucide-react"

const DISMISS_KEY = "pairingNudgeDismissed"

function isDismissed(): boolean {
  if (typeof sessionStorage === "undefined") return false
  return sessionStorage.getItem(DISMISS_KEY) === "1"
}

/**
 * A gentle, dismissible banner encouraging an unpaired user to connect with
 * their partner. Pairing is never forced — this only nudges toward /pair.
 * Dismissal is remembered for the session so it doesn't nag on every nav.
 */
export function PairingNudge() {
  const router = useRouter()
  const [show, setShow] = useState(() => !isDismissed())

  const dismiss = () => {
    setShow(false)
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem(DISMISS_KEY, "1")
    }
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed bottom-32 inset-x-4 z-30 flex items-center gap-3 rounded-2xl bg-[var(--color-bg-elevated)] p-4 shadow-[0_8px_32px_rgba(44,40,37,0.12),0_2px_8px_rgba(44,40,37,0.06)]"
          style={{ border: "1px solid var(--color-accent-soft)" }}
          data-testid="pairing-nudge"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-soft)]">
            <Heart size={20} className="text-[var(--color-accent-primary)]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display text-[15px] font-bold text-[var(--color-text-primary)]">
              Connect with your partner
            </p>
            <p className="font-body text-[12px] text-[var(--color-text-secondary)]">
              Pair to share your space together
            </p>
          </div>
          <button
            onClick={() => router.push("/pair")}
            className="shrink-0 rounded-full bg-[var(--color-accent-primary)] px-4 py-2 font-body text-[13px] font-bold text-white"
            data-testid="pairing-nudge-cta"
          >
            Pair
          </button>
          <button
            onClick={dismiss}
            className="shrink-0 p-1 text-[var(--color-text-muted)]"
            aria-label="Dismiss"
            data-testid="pairing-nudge-dismiss"
          >
            <X size={18} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

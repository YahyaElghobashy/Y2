"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Bell } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/providers/AuthProvider"
import { subscribeToPush, getPushPermission } from "@/lib/services/push-service"

const EASE_OUT: [number, number, number, number] = [0.25, 0.1, 0.25, 1]
const PROMPT_DELAY_MS = 3000
const SESSION_KEY = "push-prompt-dismissed"

export function PushPermissionPrompt({ className }: { className?: string }) {
  const { user } = useAuth()
  const [visible, setVisible] = useState(false)
  const [denied, setDenied] = useState(false)
  const [subscribing, setSubscribing] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    if (!user) return

    const permission = getPushPermission()
    if (permission === "denied") {
      setDenied(true)
      return
    }
    if (permission !== "default") return
    if (sessionStorage.getItem(SESSION_KEY)) return

    const timer = setTimeout(() => setVisible(true), PROMPT_DELAY_MS)
    return () => clearTimeout(timer)
  }, [user])

  useEffect(() => {
    if (visible) {
      document.body.classList.add("overflow-hidden")
    } else {
      document.body.classList.remove("overflow-hidden")
    }
    return () => {
      document.body.classList.remove("overflow-hidden")
    }
  }, [visible])

  const handleEnable = async () => {
    if (!user) return
    setSubscribing(true)
    try {
      const result = await subscribeToPush(user.id)
      if (!result) {
        // Permission was denied during the browser prompt
        setDenied(true)
      }
      setVisible(false)
    } finally {
      setSubscribing(false)
    }
  }

  const handleDismiss = () => {
    sessionStorage.setItem(SESSION_KEY, "true")
    setVisible(false)
  }

  if (typeof window === "undefined") return null

  return createPortal(
    <AnimatePresence>
      {visible && (
        <motion.div
          className={cn("fixed inset-0 z-50 flex items-center justify-center px-5", className)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          data-testid="push-prompt-overlay"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30"
            onClick={handleDismiss}
            data-testid="push-prompt-backdrop"
          />

          {/* Modal */}
          <motion.div
            className="relative w-full max-w-sm rounded-2xl bg-bg-elevated px-6 py-8 text-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: EASE_OUT }}
            role="dialog"
            aria-label="Enable push notifications"
            data-testid="push-prompt-modal"
          >
            {/* Icon */}
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft">
              <Bell size={28} strokeWidth={1.5} className="text-accent-primary" />
            </div>

            {denied ? (
              <>
                <h2 className="text-[20px] font-semibold font-[var(--font-display)] text-text-primary">
                  Notifications Blocked
                </h2>
                <p className="mt-2 text-[14px] font-[var(--font-body)] text-text-secondary leading-relaxed">
                  Push notifications are blocked in your browser settings. To enable them, update your browser&apos;s notification permissions for this site.
                </p>
                <button
                  type="button"
                  onClick={() => setVisible(false)}
                  className="mt-6 h-11 w-full rounded-xl bg-accent-primary text-[var(--color-bg-elevated)] text-[15px] font-medium font-[var(--font-body)]"
                  data-testid="push-prompt-ok"
                >
                  Got it
                </button>
              </>
            ) : (
              <>
                <h2 className="text-[20px] font-semibold font-[var(--font-display)] text-text-primary">
                  Stay Connected
                </h2>
                <p className="mt-2 text-[14px] font-[var(--font-body)] text-text-secondary leading-relaxed">
                  Get notified when your partner sends you a love note, redeems a coupon, or just wants to brighten your day.
                </p>

                <div className="mt-6 flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={handleEnable}
                    disabled={subscribing}
                    className="h-11 w-full rounded-xl bg-accent-primary text-[var(--color-bg-elevated)] text-[15px] font-medium font-[var(--font-body)] transition-colors disabled:opacity-50"
                    data-testid="push-prompt-enable"
                  >
                    {subscribing ? "Enabling..." : "Enable Notifications"}
                  </button>
                  <button
                    type="button"
                    onClick={handleDismiss}
                    className="h-11 w-full rounded-xl text-text-secondary text-[14px] font-[var(--font-body)]"
                    data-testid="push-prompt-dismiss"
                  >
                    Maybe Later
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}

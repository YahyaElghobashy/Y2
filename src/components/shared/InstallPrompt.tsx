"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Download, X, Share } from "lucide-react"
import { Button } from "@/components/ui/button"

const DISMISS_KEY = "installPromptDismissedAt"
const DISMISS_DAYS = 30

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !("MSStream" in window)
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && (navigator as { standalone?: boolean }).standalone === true)
  )
}

function isDismissed(): boolean {
  if (typeof localStorage === "undefined") return false
  const dismissed = localStorage.getItem(DISMISS_KEY)
  if (!dismissed) return false
  const dismissedAt = new Date(dismissed).getTime()
  const now = Date.now()
  return now - dismissedAt < DISMISS_DAYS * 24 * 60 * 60 * 1000
}

export function InstallPrompt() {
  const [show, setShow] = useState(false)
  const [showIOSModal, setShowIOSModal] = useState(false)
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    // Already installed or recently dismissed
    if (isStandalone() || isDismissed()) return

    // iOS path: show after a delay
    if (isIOS()) {
      const timer = setTimeout(() => setShow(true), 3000)
      return () => clearTimeout(timer)
    }

    // Chrome/Edge/Android: listen for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault()
      deferredPrompt.current = e as BeforeInstallPromptEvent
      setTimeout(() => setShow(true), 3000)
    }

    window.addEventListener("beforeinstallprompt", handler)
    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  const dismiss = useCallback(() => {
    setShow(false)
    setShowIOSModal(false)
    localStorage.setItem(DISMISS_KEY, new Date().toISOString())
  }, [])

  const handleInstall = useCallback(async () => {
    if (isIOS()) {
      setShowIOSModal(true)
      return
    }

    if (deferredPrompt.current) {
      await deferredPrompt.current.prompt()
      const { outcome } = await deferredPrompt.current.userChoice
      if (outcome === "accepted") {
        setShow(false)
      }
      deferredPrompt.current = null
    }
  }, [])

  if (!show) return null

  return (
    <>
      {/* Install Banner */}
      <AnimatePresence>
        {show && !showIOSModal && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed bottom-20 inset-x-4 z-40 flex items-center gap-3 rounded-2xl p-4"
            style={{
              backgroundColor: "white",
              border: "1px solid rgba(184,115,51,0.1)",
              boxShadow: "0 8px 32px rgba(44,40,37,0.12), 0 2px 8px rgba(44,40,37,0.06)",
            }}
            data-testid="install-banner"
          >
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: "rgba(184,115,51,0.1)" }}
            >
              <Download size={20} style={{ color: "var(--accent-copper, #B87333)" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="font-[family-name:var(--font-display)] text-[15px] font-bold"
                style={{ color: "var(--text-primary, #2C2825)" }}
              >
                Install Hayah
              </p>
              <p
                className="font-[family-name:var(--font-body)] text-[12px]"
                style={{ color: "var(--text-secondary, #6B6560)" }}
              >
                Add to home screen for the best experience
              </p>
            </div>
            <Button
              size="sm"
              onClick={handleInstall}
              className="shrink-0 text-white text-[13px] font-bold rounded-full"
              style={{
                backgroundColor: "var(--accent-copper, #B87333)",
                boxShadow: "0 2px 8px rgba(184,115,51,0.2)",
              }}
              data-testid="install-btn"
            >
              Install
            </Button>
            <button
              onClick={dismiss}
              className="shrink-0 p-1"
              style={{ color: "var(--text-muted, #B5ADA4)" }}
              aria-label="Dismiss"
              data-testid="dismiss-install-btn"
            >
              <X size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* iOS Share Sheet Instructions Modal */}
      <AnimatePresence>
        {showIOSModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/30"
            onClick={dismiss}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              className="w-full max-w-sm rounded-t-2xl bg-[var(--color-bg-elevated)] p-6"
              onClick={(e) => e.stopPropagation()}
              data-testid="ios-instructions"
            >
              <h3 className="mb-4 font-[family-name:var(--font-display)] text-[18px] font-semibold text-[var(--color-text-primary)]">
                Install Hayah on iOS
              </h3>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-accent-soft)]">
                    <Share size={16} className="text-[var(--color-accent-primary)]" />
                  </div>
                  <p className="font-[family-name:var(--font-body)] text-[14px] text-[var(--color-text-secondary)]">
                    Tap the Share button in Safari
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-accent-soft)]">
                    <Download size={16} className="text-[var(--color-accent-primary)]" />
                  </div>
                  <p className="font-[family-name:var(--font-body)] text-[14px] text-[var(--color-text-secondary)]">
                    Select &quot;Add to Home Screen&quot;
                  </p>
                </div>
              </div>
              <Button
                onClick={dismiss}
                variant="outline"
                className="mt-6 w-full rounded-xl"
                data-testid="ios-dismiss-btn"
              >
                Got it
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"

const DISMISS_KEY = "announcementBannerDismissed"
const ROTATE_INTERVAL = 5000

type AnnouncementBannerProps = {
  messages: string[]
  className?: string
}

export function AnnouncementBanner({ messages, className }: AnnouncementBannerProps) {
  const [dismissed, setDismissed] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    // Check sessionStorage on mount
    if (typeof sessionStorage !== "undefined") {
      setDismissed(sessionStorage.getItem(DISMISS_KEY) === "true")
    }
  }, [])

  useEffect(() => {
    if (dismissed || messages.length <= 1) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % messages.length)
    }, ROTATE_INTERVAL)

    return () => clearInterval(interval)
  }, [dismissed, messages.length])

  const handleDismiss = useCallback(() => {
    setDismissed(true)
    sessionStorage.setItem(DISMISS_KEY, "true")
  }, [])

  if (dismissed || messages.length === 0) return null

  return (
    <div
      className={className}
      data-testid="announcement-banner"
    >
      <div
        className="relative flex items-center gap-2 rounded-full px-4 py-2 overflow-hidden shimmer-overlay"
        style={{
          backgroundColor: "rgba(184, 115, 51, 0.06)",
          border: "1px solid rgba(184, 115, 51, 0.1)",
        }}
      >
        <div className="flex-1 min-w-0 h-[18px] overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.p
              key={currentIndex}
              className="font-body text-[12px] truncate"
              style={{ color: "var(--accent-copper, #B87333)" }}
              initial={{ y: 14, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -14, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            >
              {messages[currentIndex]}
            </motion.p>
          </AnimatePresence>
        </div>

        <button
          onClick={handleDismiss}
          className="shrink-0 p-0.5"
          style={{ color: "var(--text-muted, #B5ADA4)" }}
          aria-label="Dismiss announcement"
          data-testid="dismiss-announcement-btn"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}

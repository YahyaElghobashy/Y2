"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { useVisionBoard } from "@/lib/hooks/use-vision-board"

const DISMISS_KEY = "y2_eval_prompt_dismissed"
const DISMISS_DURATION_MS = 3 * 24 * 60 * 60 * 1000 // 3 days

export function HomeEvaluationPrompt({ className }: { className?: string }) {
  const { myBoard, hasEvaluatedThisMonth, isLoading } = useVisionBoard()
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const dismissedAt = localStorage.getItem(DISMISS_KEY)
    if (dismissedAt && Date.now() - parseInt(dismissedAt, 10) < DISMISS_DURATION_MS) {
      setDismissed(true)
    }
  }, [])

  const today = new Date()
  const dayOfMonth = today.getDate()

  // Show from 28th of the month
  if (dayOfMonth < 28) return null
  if (isLoading || !myBoard || hasEvaluatedThisMonth || dismissed) return null

  const handleDismiss = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    localStorage.setItem(DISMISS_KEY, String(Date.now()))
    setDismissed(true)
  }

  return (
    <Link href="/2026/evaluate" className="block">
      <motion.div
        className={cn(
          "bg-[#FBF8F4] rounded-2xl shadow-soft overflow-hidden px-4 py-4",
          "border border-[var(--accent-primary,#C4956A)]/20",
          className
        )}
        whileTap={{ scale: 0.99 }}
        transition={{ duration: 0.1 }}
        data-testid="home-eval-prompt"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-[28px]">📊</span>
            <div>
              <p className="text-[14px] font-medium font-[family-name:var(--font-display)] text-[var(--color-text-primary,#2C2825)]">
                Time to reflect
              </p>
              <p className="text-[12px] font-[family-name:var(--font-body)] text-[var(--color-text-muted,#B5AFA7)]">
                How did your vision progress this month?
              </p>
            </div>
          </div>
          <button
            className="text-[11px] text-[var(--color-text-muted,#B5ADA4)] px-2 py-1"
            onClick={handleDismiss}
            data-testid="dismiss-eval-prompt"
          >
            Later
          </button>
        </div>
      </motion.div>
    </Link>
  )
}

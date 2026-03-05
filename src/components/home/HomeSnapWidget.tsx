"use client"

import Link from "next/link"
import { Camera, Check } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { useSnap } from "@/lib/hooks/use-snap"

type HomeSnapWidgetProps = {
  className?: string
}

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, "0")}`
}

export function HomeSnapWidget({ className }: HomeSnapWidgetProps) {
  const { todaySnap, isWindowOpen, windowTimeRemaining, isLoading } = useSnap()

  if (isLoading) return null

  const hasSnapped = todaySnap?.photo_url !== null && todaySnap?.photo_url !== undefined

  // Window open and haven't snapped yet — prominent CTA
  if (isWindowOpen && !hasSnapped) {
    return (
      <motion.div
        data-testid="home-snap-widget"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className={cn(
          "rounded-2xl border border-[var(--color-accent-primary)] bg-bg-elevated p-4",
          className,
        )}
      >
        <Link href="/snap/capture" className="flex items-center gap-3">
          <div
            className="h-11 w-11 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "var(--accent-primary)" }}
          >
            <Camera size={20} className="text-white" />
          </div>
          <div className="flex-1">
            <p
              className="text-sm font-semibold font-[family-name:var(--font-display)]"
              style={{ color: "var(--text-primary)" }}
            >
              Snap Time!
            </p>
            {windowTimeRemaining !== null && (
              <p
                data-testid="snap-timer"
                className="text-xs font-[family-name:var(--font-mono)] tabular-nums"
                style={{ color: "var(--text-muted)" }}
              >
                {formatTimer(windowTimeRemaining)} remaining
              </p>
            )}
          </div>
        </Link>
      </motion.div>
    )
  }

  // Already snapped — small link
  if (hasSnapped) {
    return (
      <motion.div
        data-testid="home-snap-widget"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className={cn(
          "rounded-2xl border border-border-subtle bg-bg-elevated p-3",
          className,
        )}
      >
        <Link href="/snap" className="flex items-center gap-3">
          <div
            className="h-9 w-9 rounded-full flex items-center justify-center bg-emerald-500/10"
          >
            <Check size={16} className="text-emerald-500" />
          </div>
          <p
            className="text-sm font-[family-name:var(--font-body)]"
            style={{ color: "var(--text-muted)" }}
          >
            Snapped!
          </p>
        </Link>
      </motion.div>
    )
  }

  // No window / nothing actionable
  return null
}

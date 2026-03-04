"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/providers/AuthProvider"

export function HomeLetterPrompt({ className }: { className?: string }) {
  const { partner } = useAuth()

  const today = new Date()
  const isFirstOfMonth = today.getDate() === 1

  if (!isFirstOfMonth) return null

  const partnerName = partner?.display_name ?? "your partner"

  return (
    <Link href="/me/rituals" className="block">
      <motion.div
        className={cn(
          "bg-[#FBF8F4] rounded-2xl shadow-soft overflow-hidden px-4 py-4",
          "border border-[var(--accent-primary,#C4956A)]/20",
          className
        )}
        whileTap={{ scale: 0.99 }}
        transition={{ duration: 0.1 }}
        data-testid="home-letter-prompt"
      >
        <div className="flex items-center gap-3">
          <span className="text-[28px]">💌</span>
          <div>
            <p className="text-[14px] font-medium font-[family-name:var(--font-display)] text-[var(--color-text-primary,#2C2825)]">
              It&apos;s letter day!
            </p>
            <p className="text-[12px] font-[family-name:var(--font-body)] text-[var(--color-text-muted,#B5AFA7)]">
              Write a note to {partnerName}
            </p>
          </div>
        </div>
      </motion.div>
    </Link>
  )
}

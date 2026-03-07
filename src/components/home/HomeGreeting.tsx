"use client"

import { format } from "date-fns"
import { motion } from "framer-motion"
import { useAuth } from "@/lib/providers/AuthProvider"
import { WordReveal } from "@/components/animations/WordReveal"
import { cn } from "@/lib/utils"

type HomeGreetingProps = {
  className?: string
}

function getGreeting(hour: number): string {
  if (hour >= 5 && hour < 12) return "Good morning"
  if (hour >= 12 && hour < 17) return "Good afternoon"
  if (hour >= 17 && hour < 21) return "Good evening"
  return "Good night"
}

export function HomeGreeting({ className }: HomeGreetingProps) {
  const { profile } = useAuth()
  const name = profile?.display_name ?? "there"
  const now = new Date()
  const greeting = getGreeting(now.getHours())
  const dateString = format(now, "EEEE, MMMM d")

  return (
    <div className={cn("px-5 pt-4 pb-2", className)}>
      <h1
        className="font-nav text-[20px] font-bold leading-[1.2]"
        style={{ color: "var(--text-primary, #2C2825)" }}
      >
        <WordReveal text={`${greeting}, ${name}`} stagger={0.06} />
      </h1>

      {/* Decorative copper underline */}
      <motion.div
        className="mt-1.5 h-[2px] w-10 rounded-full"
        style={{ backgroundColor: "var(--accent-copper, #B87333)" }}
        initial={{ scaleX: 0, originX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.5, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
        aria-hidden="true"
      />

      <motion.p
        className="mt-1 font-serif italic text-[14px]"
        style={{ color: "var(--text-secondary, #6B6560)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.3 }}
      >
        {dateString}
      </motion.p>
    </div>
  )
}

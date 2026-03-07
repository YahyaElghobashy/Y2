"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface ChatBubbleProps {
  message: string
  timestamp: string
  direction: "sent" | "received"
  emoji?: string
  className?: string
}

export function ChatBubble({
  message,
  timestamp,
  direction,
  emoji,
  className,
}: ChatBubbleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
      className={cn(
        "flex flex-col max-w-[80%]",
        direction === "sent" ? "ml-auto items-end" : "mr-auto items-start",
        className
      )}
    >
      <div
        className={cn(
          direction === "sent" ? "chat-bubble-sent" : "chat-bubble-received"
        )}
      >
        {emoji && <span className="text-lg mb-1 block">{emoji}</span>}
        <p className="text-[14px] leading-relaxed">{message}</p>
      </div>
      <span
        className={cn(
          "text-[11px] mt-1 font-mono",
          direction === "sent"
            ? "text-[var(--text-muted,#B5ADA4)]"
            : "text-[var(--text-muted,#B5ADA4)]"
        )}
      >
        {timestamp}
      </span>
    </motion.div>
  )
}

"use client"

import { motion } from "framer-motion"
import { Check, CheckCheck, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { NotificationStatus } from "@/lib/types/notification.types"

interface ChatBubbleProps {
  message: string
  timestamp: string
  direction: "sent" | "received"
  emoji?: string
  /** Delivery state — only surfaced on sent bubbles. */
  status?: NotificationStatus
  className?: string
}

const DELIVERY_META: Record<
  NotificationStatus,
  { icon: typeof Check; label: string; tone: string }
> = {
  sent: { icon: Check, label: "Sent", tone: "text-[var(--text-muted,#B5ADA4)]" },
  delivered: {
    icon: CheckCheck,
    label: "Delivered",
    tone: "text-[var(--success,#5B8C5A)]",
  },
  failed: {
    icon: AlertCircle,
    label: "Failed to deliver",
    tone: "text-[var(--error,#C0594B)]",
  },
}

export function ChatBubble({
  message,
  timestamp,
  direction,
  emoji,
  status,
  className,
}: ChatBubbleProps) {
  const delivery = direction === "sent" && status ? DELIVERY_META[status] : null
  const DeliveryIcon = delivery?.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
      className={cn(
        "flex flex-col max-w-[80%]",
        direction === "sent" ? "ms-auto items-end" : "me-auto items-start",
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
      <span className="mt-1 flex items-center gap-1 text-[11px] font-mono text-[var(--text-muted,#B5ADA4)]">
        {timestamp}
        {delivery && DeliveryIcon && (
          <DeliveryIcon
            size={12}
            strokeWidth={2}
            className={delivery.tone}
            aria-label={delivery.label}
            data-testid={`delivery-status-${status}`}
          />
        )}
      </span>
    </motion.div>
  )
}

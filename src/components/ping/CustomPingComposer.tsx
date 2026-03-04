"use client"

import { useState, useRef } from "react"
import { ArrowUp, Lock } from "lucide-react"
import { cn } from "@/lib/utils"
import { useNotifications } from "@/lib/hooks/use-notifications"

const MAX_CHARS = 200
const SHOW_COUNT_AT = 150

export function CustomPingComposer({ className }: { className?: string }) {
  const { canSend, sendNotification } = useNotifications()
  const [message, setMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const trimmed = message.trim()
  const canSubmit = canSend && trimmed.length > 0 && !isSending

  const handleSend = async () => {
    if (!canSubmit) return
    setIsSending(true)

    try {
      await sendNotification("Ping", trimmed)
      setMessage("")
      inputRef.current?.focus()
    } catch {
      // Error handled by hook
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className={cn("flex flex-col gap-1", className)} data-testid="custom-ping-composer">
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value.slice(0, MAX_CHARS))}
          onKeyDown={handleKeyDown}
          placeholder="Write a custom ping..."
          disabled={!canSend}
          className="flex-1 rounded-full border border-border-subtle bg-bg-elevated px-4 py-2.5 text-[14px] font-[var(--font-body)] text-text-primary outline-none transition-colors focus:border-accent-primary placeholder:text-text-muted disabled:opacity-50"
          data-testid="custom-ping-input"
        />

        <button
          type="button"
          onClick={handleSend}
          disabled={!canSubmit}
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors",
            canSubmit
              ? "bg-accent-primary text-[var(--color-bg-elevated)]"
              : "bg-[var(--bg-secondary)] text-text-muted"
          )}
          aria-label={canSend ? "Send ping" : "Send limit reached"}
          data-testid="custom-ping-send"
        >
          {canSend ? (
            <ArrowUp size={18} strokeWidth={2} />
          ) : (
            <Lock size={14} strokeWidth={2} />
          )}
        </button>
      </div>

      {message.length >= SHOW_COUNT_AT && (
        <span
          className="text-[11px] font-[var(--font-body)] text-text-muted text-end pe-14"
          data-testid="custom-ping-count"
        >
          {message.length}/{MAX_CHARS}
        </span>
      )}
    </div>
  )
}

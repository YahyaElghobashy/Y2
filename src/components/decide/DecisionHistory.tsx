"use client"

import { motion } from "framer-motion"
import { Trash2 } from "lucide-react"
import type { Decision } from "@/lib/types/decisions.types"
import { getGame } from "./registry"

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ""
  const secs = Math.max(0, Math.floor((Date.now() - then) / 1000))
  if (secs < 60) return "just now"
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

type DecisionHistoryProps = {
  decisions: Decision[]
  isLoading?: boolean
  currentUserId?: string | null
  partnerName?: string | null
  onClear?: (id: string) => void
  limit?: number
  emptyHint?: string
}

export function DecisionHistory({
  decisions,
  isLoading = false,
  currentUserId,
  partnerName,
  onClear,
  limit = 8,
  emptyHint = "No decisions yet — pick a tool above and let it choose.",
}: DecisionHistoryProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-2" data-testid="history-loading">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-14 animate-pulse rounded-xl"
            style={{ background: "var(--color-sand)" }}
          />
        ))}
      </div>
    )
  }

  if (decisions.length === 0) {
    return (
      <p
        className="rounded-xl border border-dashed px-4 py-6 text-center text-[14px]"
        style={{ borderColor: "var(--border)", color: "var(--color-ink-soft)", fontFamily: "var(--font-serif)", fontStyle: "italic" }}
        data-testid="history-empty"
      >
        {emptyHint}
      </p>
    )
  }

  return (
    <ul className="flex flex-col gap-2" data-testid="history-list">
      {decisions.slice(0, limit).map((d) => {
        const game = getGame(d.tool_id)
        const who =
          currentUserId && d.created_by === currentUserId
            ? "You"
            : partnerName ?? "Partner"
        return (
          <motion.li
            key={d.id}
            layout
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-3 rounded-xl border px-3 py-2.5"
            style={{ borderColor: "var(--border)", background: "var(--card)" }}
            data-testid="history-item"
          >
            <span
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[11px] font-bold uppercase"
              style={{ background: "var(--color-sand)", color: "var(--color-ink-soft)", fontFamily: "var(--font-nav)" }}
              aria-hidden
            >
              {(game?.label ?? d.tool_id).slice(0, 2)}
            </span>

            <div className="min-w-0 flex-1">
              <p
                className="truncate text-[15px] font-bold"
                style={{ fontFamily: "var(--font-body)", color: "var(--foreground)" }}
              >
                {d.result?.winner?.label ?? d.result?.summary ?? "—"}
              </p>
              <p
                className="truncate text-[12px]"
                style={{ fontFamily: "var(--font-nav)", color: "var(--color-ink-soft)" }}
              >
                {game?.label ?? d.tool_id} · {who} · {timeAgo(d.created_at)}
              </p>
            </div>

            {onClear && currentUserId && d.created_by === currentUserId && (
              <button
                type="button"
                onClick={() => onClear(d.id)}
                aria-label="Delete decision"
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full"
                style={{ color: "var(--color-ink-soft)" }}
                data-testid="history-clear"
              >
                <Trash2 size={15} strokeWidth={1.85} />
              </button>
            )}
          </motion.li>
        )
      })}
    </ul>
  )
}

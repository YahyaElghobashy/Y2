"use client"

import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import { MessageSquare, Search, Flame } from "lucide-react"
import { useDailyPrompt } from "@/lib/hooks/use-daily-prompt"
import { DailyPromptCard } from "@/components/prompts/DailyPromptCard"
import { PromptAnswerReveal } from "@/components/prompts/PromptAnswerReveal"
import { EmptyState } from "@/components/shared/EmptyState"
import { cn } from "@/lib/utils"
import type { PromptCategory } from "@/lib/types/prompts.types"

const EASE_OUT: [number, number, number, number] = [0.25, 0.1, 0.25, 1]

const CATEGORY_CHIPS: { label: string; value: PromptCategory | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Deep", value: "deep" },
  { label: "Playful", value: "playful" },
  { label: "Memory", value: "memory" },
  { label: "Dream", value: "dream" },
  { label: "Opinion", value: "opinion" },
  { label: "Challenge", value: "challenge" },
]

export default function PromptsPage() {
  const {
    todayPrompt,
    myAnswer,
    partnerAnswer,
    history,
    streak,
    isLoading,
    error,
    submitAnswer,
  } = useDailyPrompt()

  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<PromptCategory | "all">("all")

  // Filter history (exclude today's prompt — shown separately)
  const filteredHistory = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0]
    let filtered = history.filter((p) => p.prompt_date !== todayStr)

    if (categoryFilter !== "all") {
      filtered = filtered.filter((p) => p.prompt_category === categoryFilter)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (p) =>
          p.prompt_text.toLowerCase().includes(q) ||
          p.my_answer?.answer_text.toLowerCase().includes(q) ||
          p.partner_answer?.answer_text.toLowerCase().includes(q)
      )
    }

    return filtered
  }, [history, categoryFilter, searchQuery])

  if (isLoading) {
    return (
      <div data-testid="prompts-loading" className="flex flex-col gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-2xl bg-[var(--bg-secondary)]" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div data-testid="prompts-error" className="text-center text-[14px] text-red-500">
        {error}
      </div>
    )
  }

  return (
    <div data-testid="prompts-page" className="flex flex-col gap-5 pb-8">
      {/* Streak badge */}
      {streak > 0 && (
        <div
          data-testid="streak-badge"
          className="flex items-center justify-center gap-2 rounded-xl bg-[var(--accent-soft,#E8D5C0)] py-2"
        >
          <Flame size={16} className="text-[var(--accent-primary,#C4956A)]" />
          <span className="text-[13px] font-medium text-[var(--accent-primary,#C4956A)]">
            {streak} day streak
          </span>
        </div>
      )}

      {/* Today's prompt */}
      {todayPrompt && (
        <DailyPromptCard
          prompt={todayPrompt}
          myAnswer={myAnswer}
          partnerAnswer={partnerAnswer}
          onSubmit={submitAnswer}
        />
      )}

      {/* History section */}
      <div>
        <h2 className="mb-3 font-display text-[16px] font-semibold text-[var(--text-primary)]">
          Past Prompts
        </h2>

        {/* Search */}
        <div className="relative mb-3">
          <Search
            size={14}
            className="absolute start-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
          />
          <input
            data-testid="history-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search prompts..."
            className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] py-2 ps-9 pe-3 text-[13px] outline-none"
          />
        </div>

        {/* Category chips */}
        <div data-testid="category-filters" className="mb-4 flex gap-2 overflow-x-auto">
          {CATEGORY_CHIPS.map((c) => (
            <button
              key={c.value}
              data-testid={`cat-${c.value}`}
              onClick={() => setCategoryFilter(c.value)}
              className={cn(
                "shrink-0 rounded-full px-3 py-1 text-[12px] font-medium transition-colors",
                categoryFilter === c.value
                  ? "bg-[var(--accent-primary,#C4956A)] text-white"
                  : "bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
              )}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* History list */}
        {filteredHistory.length > 0 ? (
          <div className="flex flex-col gap-3">
            {filteredHistory.map((p) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: EASE_OUT }}
                className="rounded-2xl bg-[var(--bg-elevated,#FFFFFF)] p-4 shadow-sm"
                data-testid={`history-item-${p.id}`}
              >
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-[11px] text-[var(--text-muted)]">
                    {new Date(p.prompt_date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <span className="rounded-full bg-[var(--bg-secondary)] px-2 py-0.5 text-[10px] font-medium capitalize text-[var(--text-muted)]">
                    {p.prompt_category}
                  </span>
                </div>
                <p className="mb-3 text-[13px] font-medium text-[var(--text-primary)]">
                  {p.prompt_text}
                </p>
                {p.my_answer && p.partner_answer ? (
                  <PromptAnswerReveal
                    myAnswer={p.my_answer}
                    partnerAnswer={p.partner_answer}
                  />
                ) : p.my_answer ? (
                  <div className="rounded-xl bg-[var(--bg-secondary)] p-2.5">
                    <p className="text-[12px] text-[var(--text-secondary)]">
                      {p.my_answer.answer_text}
                    </p>
                  </div>
                ) : (
                  <p className="text-[12px] italic text-[var(--text-muted)]">
                    Not answered
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<MessageSquare size={48} strokeWidth={1.5} />}
            title="No past prompts"
            subtitle="Check back tomorrow for more"
            className="min-h-[120px]"
          />
        )}
      </div>
    </div>
  )
}

"use client"

import { useMemo } from "react"
import { PageTransition } from "@/components/animations"
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton"
import { ConnectView, type ConnectData } from "@/components/prompts/ConnectView"
import { useDailyPrompt } from "@/lib/hooks/use-daily-prompt"
import { useAuth } from "@/lib/providers/AuthProvider"

/** Human-readable label for a prompt category code (e.g. "deep" → "Deep Dive"). */
const CATEGORY_LABEL: Record<string, string> = {
  deep: "Deep Dive",
  playful: "Playful",
  memory: "Memory",
  dream: "Dream",
  opinion: "Opinion",
  challenge: "Challenge",
}

export default function PromptsPage() {
  const { partner } = useAuth()
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

  const partnerName = partner?.display_name ?? "your love"

  const data: ConnectData = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0]

    const historyItems = history
      // Exclude today's prompt (shown as the active card) + only show pairs we can render.
      .filter((p) => p.prompt_date !== todayStr)
      .map((p) => ({
        question: p.prompt_text,
        mine: p.my_answer?.answer_text ?? "",
        hers: p.partner_answer?.answer_text ?? "",
        date: new Date(p.prompt_date + "T00:00:00").toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
      }))

    return {
      streak,
      category: todayPrompt ? (CATEGORY_LABEL[todayPrompt.prompt_category] ?? todayPrompt.prompt_category) : "Today",
      question: todayPrompt?.prompt_text ?? "No prompt yet — check back soon.",
      partnerName,
      // Only revealed once both have answered (hook returns null otherwise).
      partnerAnswer: partnerAnswer?.answer_text ?? "",
      // Drives the reveal: show the partner's card only once they've actually answered.
      partnerAnswered: !!partnerAnswer,
      history: historyItems,
    }
  }, [history, streak, todayPrompt, partnerName, partnerAnswer])

  if (isLoading) {
    return (
      <PageTransition>
        <div data-testid="prompts-loading" className="py-2">
          <LoadingSkeleton variant="card" count={3} />
        </div>
      </PageTransition>
    )
  }

  if (error) {
    return (
      <PageTransition>
        <p data-testid="prompts-error" className="px-1 py-6 text-center text-[14px]" style={{ color: "var(--color-error)" }}>
          {error}
        </p>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <ConnectView
        data={data}
        // Real persistence: the View's reveal button calls this to insert the answer.
        onSubmit={(text) => void submitAnswer(text)}
        // If the user already answered today, seed the composer + jump straight to reveal.
        initialAnswer={myAnswer?.answer_text ?? ""}
        initialRevealed={!!myAnswer}
      />
    </PageTransition>
  )
}

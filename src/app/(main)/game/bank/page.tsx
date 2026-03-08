"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Plus, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/providers/AuthProvider"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { ContributeForm } from "@/components/game/ContributeForm"
import {
  GAME_MODE_LABELS,
  CATEGORY_META,
} from "@/lib/types/game.types"
import type { GameMode, QuestionBankRow } from "@/lib/types/game.types"

const clay = {
  card: "rounded-[20px] border border-white/60 bg-white/80 backdrop-blur-sm",
  shadow: "shadow-[0_4px_16px_rgba(44,40,37,0.08),0_1px_4px_rgba(44,40,37,0.04)]",
  pressed: "active:shadow-[0_1px_4px_rgba(44,40,37,0.06)] active:translate-y-[1px]",
}

const answerTypeBadge: Record<string, { label: string; emoji: string }> = {
  open: { label: "Open", emoji: "💬" },
  scale_1_10: { label: "Scale", emoji: "📊" },
  yes_no: { label: "Yes/No", emoji: "✅" },
  multiple_choice: { label: "Choice", emoji: "📝" },
  ranking: { label: "Ranking", emoji: "🏆" },
}

export default function QuestionBankPage() {
  const router = useRouter()
  const { user } = useAuth()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseBrowserClient() as any

  const [questions, setQuestions] = useState<QuestionBankRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [modeFilter, setModeFilter] = useState<GameMode | "all">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [showContribute, setShowContribute] = useState(false)

  const loadQuestions = useCallback(async () => {
    setIsLoading(true)

    let query = supabase
      .from("question_bank")
      .select("*")
      .eq("is_active", true)
      .order("use_count", { ascending: false })
      .limit(50)

    if (modeFilter !== "all") {
      query = query.contains("suitable_modes", [modeFilter])
    }

    const { data } = await query

    let filtered = (data ?? []) as QuestionBankRow[]

    // Client-side text search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(qn =>
        qn.text.toLowerCase().includes(q) ||
        qn.category.toLowerCase().includes(q)
      )
    }

    setQuestions(filtered)
    setIsLoading(false)
  }, [supabase, modeFilter, searchQuery])

  useEffect(() => {
    loadQuestions()
  }, [loadQuestions])

  return (
    <div className="min-h-screen pb-24" style={{ background: "linear-gradient(180deg, #FBF8F4 0%, #F0EBE3 100%)" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-6 pb-4">
        <motion.button
          className="w-9 h-9 rounded-full bg-white/70 border border-white/80 flex items-center justify-center shadow-sm"
          whileTap={{ scale: 0.92 }}
          onClick={() => router.back()}
        >
          <ArrowLeft size={18} className="text-[#2C2825]" />
        </motion.button>
        <div className="flex-1">
          <h1
            className="text-[22px] font-bold text-[#2C2825]"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Question Bank 📚
          </h1>
        </div>
        <motion.button
          className="w-9 h-9 rounded-full bg-[#C4956A] flex items-center justify-center shadow-md"
          whileTap={{ scale: 0.92 }}
          onClick={() => setShowContribute(true)}
        >
          <Plus size={18} className="text-white" />
        </motion.button>
      </div>

      {/* Search */}
      <div className="px-5 mb-4">
        <div className={cn(clay.card, clay.shadow, "flex items-center gap-2 px-4 py-2.5")}>
          <Search size={16} className="text-[#B5ADA4]" />
          <input
            type="text"
            placeholder="Search questions..."
            className="flex-1 bg-transparent text-sm text-[#2C2825] placeholder:text-[#B5ADA4] focus:outline-none"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Mode filter */}
      <div className="px-5 mb-5">
        <div className="flex gap-2 overflow-x-auto pb-1">
          <FilterPill
            label="All"
            isActive={modeFilter === "all"}
            onClick={() => setModeFilter("all")}
          />
          {(["check_in", "deep_dive", "date_night"] as GameMode[]).map(m => (
            <FilterPill
              key={m}
              label={`${GAME_MODE_LABELS[m].emoji} ${GAME_MODE_LABELS[m].en.split(" ")[0]}`}
              isActive={modeFilter === m}
              onClick={() => setModeFilter(m)}
            />
          ))}
        </div>
      </div>

      {/* Questions list */}
      <div className="px-5 space-y-3">
        {isLoading ? (
          <div className="py-12 text-center">
            <p className="text-sm text-[#8C8279]">Loading questions...</p>
          </div>
        ) : questions.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-3xl mb-2">📭</p>
            <p className="text-sm text-[#8C8279]">No questions found</p>
          </div>
        ) : (
          questions.map((q, i) => (
            <motion.div
              key={q.id}
              className={cn(clay.card, clay.shadow, "p-4")}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              {/* Question text */}
              <p className="text-sm text-[#2C2825] leading-relaxed mb-3">
                {q.text}
              </p>

              {/* Badges row */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Category */}
                {CATEGORY_META[q.category] && (
                  <span
                    className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: `${CATEGORY_META[q.category].color}15`,
                      color: CATEGORY_META[q.category].color,
                    }}
                  >
                    {CATEGORY_META[q.category].emoji} {CATEGORY_META[q.category].label}
                  </span>
                )}

                {/* Answer type */}
                {answerTypeBadge[q.answer_type] && (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#E5D9CB]/50 text-[#8C8279]">
                    {answerTypeBadge[q.answer_type].emoji} {answerTypeBadge[q.answer_type].label}
                  </span>
                )}

                {/* Difficulty */}
                <span className="text-[10px] text-[#B5ADA4]">
                  {q.difficulty === "light" ? "☀️" : q.difficulty === "medium" ? "🌤️" : "🌊"}
                </span>

                {/* Mode badges */}
                <div className="ms-auto flex gap-1">
                  {q.suitable_modes?.map(m => (
                    <span key={m} className="text-[10px]">{GAME_MODE_LABELS[m]?.emoji}</span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Contribute Form */}
      <ContributeForm
        isOpen={showContribute}
        onClose={() => setShowContribute(false)}
        onSuccess={loadQuestions}
      />
    </div>
  )
}

// ─── Filter Pill ───

function FilterPill({ label, isActive, onClick }: { label: string; isActive: boolean; onClick: () => void }) {
  return (
    <button
      className={cn(
        "px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all border",
        isActive
          ? "bg-[#C4956A]/15 text-[#B87333] border-[#C4956A]/30"
          : "bg-white/60 text-[#8C8279] border-white/80",
      )}
      onClick={onClick}
    >
      {label}
    </button>
  )
}

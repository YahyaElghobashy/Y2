"use client"

import { useState, useCallback, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { X, Lock, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/providers/AuthProvider"
import { useGameEngine } from "@/lib/hooks/use-game-engine"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import type { HeatLevel } from "@/lib/types/game.types"

const clay = {
  card: "rounded-[20px] border border-white/60 bg-white/80 backdrop-blur-sm",
  shadow: "shadow-[0_4px_16px_rgba(44,40,37,0.08),0_1px_4px_rgba(44,40,37,0.04)]",
  shadowLg: "shadow-[0_8px_32px_rgba(44,40,37,0.10),0_2px_8px_rgba(44,40,37,0.05)]",
  pressed: "active:shadow-[0_1px_4px_rgba(44,40,37,0.06)] active:translate-y-[1px]",
}

const MAX_QUESTIONS = 5
const MAX_DARES = 3

type AuthoredQuestion = { text: string; id?: string }
type AuthoredDare = { text: string; heatLevel: HeatLevel; id?: string }

export function PartnerAuthoredSetup() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session")
  const { partner } = useAuth()
  const { saveCustomContent, startSession } = useGameEngine(sessionId ?? undefined)
  const supabase = getSupabaseBrowserClient()

  const partnerName = partner?.display_name ?? "Partner"

  // Questions
  const [questions, setQuestions] = useState<AuthoredQuestion[]>([])
  const [newQuestion, setNewQuestion] = useState("")

  // Dares
  const [dares, setDares] = useState<AuthoredDare[]>([])
  const [newDare, setNewDare] = useState("")
  const [newDareHeat, setNewDareHeat] = useState<HeatLevel>(1)

  // State
  const [isSaving, setIsSaving] = useState(false)
  const [partnerDone, setPartnerDone] = useState(false)
  const [isDone, setIsDone] = useState(false)

  // Poll for partner completion
  useEffect(() => {
    if (!sessionId || !partner) return

    const interval = setInterval(async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from("session_custom_content")
        .select("id")
        .eq("session_id", sessionId)
        .eq("author_id", partner.id)
        .limit(1)

      if (data && data.length > 0) {
        setPartnerDone(true)
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [sessionId, partner, supabase])

  const addQuestion = useCallback(() => {
    if (!newQuestion.trim() || questions.length >= MAX_QUESTIONS) return
    setQuestions(prev => [...prev, { text: newQuestion.trim() }])
    setNewQuestion("")
  }, [newQuestion, questions.length])

  const removeQuestion = useCallback((index: number) => {
    setQuestions(prev => prev.filter((_, i) => i !== index))
  }, [])

  const addDare = useCallback(() => {
    if (!newDare.trim() || dares.length >= MAX_DARES) return
    setDares(prev => [...prev, { text: newDare.trim(), heatLevel: newDareHeat }])
    setNewDare("")
  }, [newDare, dares.length, newDareHeat])

  const removeDare = useCallback((index: number) => {
    setDares(prev => prev.filter((_, i) => i !== index))
  }, [])

  const handleDoneWriting = async () => {
    if (isSaving) return
    setIsSaving(true)

    const items = [
      ...questions.map(q => ({ type: "question" as const, text: q.text })),
      ...dares.map(d => ({ type: "dare" as const, text: d.text, heatLevel: d.heatLevel })),
    ]

    if (items.length > 0) {
      await saveCustomContent(items)
    }

    setIsDone(true)
    setIsSaving(false)

    // If partner is also done, update session to authoring complete and start game
    if (partnerDone && sessionId) {
      await startSession(sessionId)
      router.push(`/game/date-night/play?session=${sessionId}`)
    }
  }

  // When partner finishes after us
  useEffect(() => {
    if (isDone && partnerDone && sessionId) {
      startSession(sessionId).then(() => {
        router.push(`/game/date-night/play?session=${sessionId}`)
      })
    }
  }, [isDone, partnerDone, sessionId, startSession, router])

  // Waiting for partner screen
  if (isDone && !partnerDone) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-5"
        style={{ background: "linear-gradient(180deg, #FBF8F4 0%, #FDF0F0 100%)" }}
      >
        <motion.div
          className={cn(clay.card, clay.shadowLg, "p-8 text-center max-w-sm")}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <motion.div
            className="w-16 h-16 rounded-full bg-[#F4A8B8]/20 mx-auto mb-4 flex items-center justify-center"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <span className="text-3xl">✍️</span>
          </motion.div>
          <h2 className="text-lg font-bold text-[#2C2825] mb-2">
            Waiting for {partnerName}...
          </h2>
          <p className="text-sm text-[#8C8279]" style={{ fontFamily: "'Caveat', cursive", fontSize: "16px" }}>
            They&apos;re still writing cards for you!
          </p>
          <p className="text-xs text-[#B5ADA4] mt-4">
            You wrote {questions.length} questions & {dares.length} dares
          </p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-8" style={{ background: "linear-gradient(180deg, #FBF8F4 0%, #FDF0F0 100%)" }}>
      {/* Header */}
      <div className="px-5 pt-6 pb-4 text-center">
        <h1
          className="text-[24px] font-bold text-[#B85A6C]"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Write cards for {partnerName} 💕
        </h1>
        <p className="text-sm text-[#8C8279] mt-1 flex items-center justify-center gap-1">
          They won&apos;t see these until they come up in the game
          <Lock size={12} className="text-[#D4A04A]" />
        </p>
      </div>

      {/* Questions Section */}
      <div className="px-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-[#2C2825] uppercase tracking-wide">
            Questions for {partnerName}
          </h2>
          <span className="text-xs text-[#8C8279]">
            {questions.length} of {MAX_QUESTIONS} questions
          </span>
        </div>

        {/* Input */}
        <div className={cn(clay.card, clay.shadow, "p-3 mb-3")}>
          <div className="flex gap-2">
            <input
              type="text"
              value={newQuestion}
              onChange={e => setNewQuestion(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addQuestion()}
              placeholder={`Ask ${partnerName} something you're curious about...`}
              className="flex-1 text-sm bg-transparent outline-none text-[#2C2825] placeholder:text-[#B5ADA4]"
              maxLength={200}
            />
            <motion.button
              className={cn(
                "px-4 py-2 rounded-full text-sm font-bold",
                newQuestion.trim() && questions.length < MAX_QUESTIONS
                  ? "bg-[#B85A6C] text-white"
                  : "bg-[#E5D9CB] text-[#B5ADA4]",
              )}
              whileTap={{ scale: 0.95 }}
              onClick={addQuestion}
              disabled={!newQuestion.trim() || questions.length >= MAX_QUESTIONS}
            >
              Add <Plus size={14} className="inline ms-0.5" />
            </motion.button>
          </div>
        </div>

        {/* Question List */}
        <AnimatePresence>
          {questions.map((q, i) => (
            <motion.div
              key={i}
              className={cn(clay.card, clay.shadow, "p-3 mb-2 flex items-center justify-between")}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Lock size={12} className="text-[#D4A04A] shrink-0" />
                <span className="text-sm text-[#2C2825] truncate">{q.text}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#E5D9CB] text-[#8C8279] shrink-0">
                  HIDDEN
                </span>
              </div>
              <button onClick={() => removeQuestion(i)} className="ms-2 text-[#B5ADA4] hover:text-[#C75050]">
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Dares Section */}
      <div className="px-5 mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-[#2C2825] uppercase tracking-wide">
            Dares for {partnerName} 🌶️
          </h2>
          <span className="text-xs text-[#8C8279]">
            {dares.length} of {MAX_DARES} dares
          </span>
        </div>

        {/* Dare Input */}
        <div className={cn(clay.card, clay.shadow, "p-3 mb-3")}>
          <input
            type="text"
            value={newDare}
            onChange={e => setNewDare(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addDare()}
            placeholder="Write a playful dare..."
            className="w-full text-sm bg-transparent outline-none text-[#2C2825] placeholder:text-[#B5ADA4] mb-3"
            maxLength={200}
          />

          <div className="flex items-center justify-between">
            {/* Heat Level Selector */}
            <div className="flex gap-2">
              {([1, 2, 3] as HeatLevel[]).map(level => (
                <motion.button
                  key={level}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                    newDareHeat === level
                      ? "bg-[#F4A8B8] text-[#B85A6C]"
                      : "bg-[#F5F0E8] text-[#8C8279]"
                  )}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setNewDareHeat(level)}
                >
                  {level === 1 ? "Mild" : level === 2 ? "Medium" : "Intense"}
                </motion.button>
              ))}
            </div>

            <motion.button
              className={cn(
                "px-4 py-2 rounded-full text-sm font-bold",
                newDare.trim() && dares.length < MAX_DARES
                  ? "bg-[#C4956A] text-white"
                  : "bg-[#E5D9CB] text-[#B5ADA4]",
              )}
              whileTap={{ scale: 0.95 }}
              onClick={addDare}
              disabled={!newDare.trim() || dares.length >= MAX_DARES}
            >
              Add 🌶️
            </motion.button>
          </div>
        </div>

        {/* Dare List */}
        <AnimatePresence>
          {dares.map((d, i) => (
            <motion.div
              key={i}
              className={cn(clay.card, clay.shadow, "p-3 mb-2 flex items-center justify-between")}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-sm text-[#2C2825] truncate">{d.text}</span>
                <span className={cn(
                  "text-[10px] px-2 py-0.5 rounded-full shrink-0 font-medium",
                  d.heatLevel === 1 ? "bg-[#D4A04A]/15 text-[#D4A04A]"
                    : d.heatLevel === 2 ? "bg-[#F4A8B8]/20 text-[#B85A6C]"
                    : "bg-[#C75050]/15 text-[#C75050]",
                )}>
                  {"🌶️".repeat(d.heatLevel)} {d.heatLevel === 1 ? "MILD" : d.heatLevel === 2 ? "MEDIUM" : "INTENSE"}
                </span>
              </div>
              <button onClick={() => removeDare(i)} className="ms-2 text-[#B5ADA4] hover:text-[#C75050]">
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Done Button */}
      <div className="px-5">
        <motion.button
          className={cn(
            "w-full py-4 rounded-full text-base font-bold transition-all duration-200",
            "bg-[#B85A6C] text-white shadow-[0_4px_20px_rgba(184,90,108,0.25)]",
          )}
          whileTap={{ scale: 0.98 }}
          onClick={handleDoneWriting}
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : "Done Writing ✏️"}
        </motion.button>
      </div>
    </div>
  )
}

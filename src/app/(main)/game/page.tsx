"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Clock, ChevronRight, Play, Pause } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/providers/AuthProvider"
import { useGameEngine } from "@/lib/hooks/use-game-engine"
import { GAME_MODE_LABELS, CATEGORY_META } from "@/lib/types/game.types"
import type { GameMode, GameSessionRow } from "@/lib/types/game.types"

// ─── Claymorphism style helpers ───

const clay = {
  card: "rounded-[20px] border border-white/60 bg-white/80 backdrop-blur-sm",
  shadow: "shadow-[0_4px_16px_rgba(44,40,37,0.08),0_1px_4px_rgba(44,40,37,0.04)]",
  shadowLg: "shadow-[0_8px_32px_rgba(44,40,37,0.10),0_2px_8px_rgba(44,40,37,0.05)]",
  pressed: "active:shadow-[0_1px_4px_rgba(44,40,37,0.06)] active:translate-y-[1px]",
}

const modeAccents: Record<GameMode, { bg: string; text: string; border: string; gradient: string }> = {
  check_in: {
    bg: "bg-[#A8B5A0]/10",
    text: "text-[#5C6B56]",
    border: "border-[#A8B5A0]/30",
    gradient: "from-[#A8B5A0]/20 to-[#D5DDD1]/30",
  },
  deep_dive: {
    bg: "bg-[#7EC8E3]/10",
    text: "text-[#3A7B94]",
    border: "border-[#7EC8E3]/30",
    gradient: "from-[#7EC8E3]/15 to-[#B8E0EF]/20",
  },
  date_night: {
    bg: "bg-[#F4A8B8]/10",
    text: "text-[#B85A6C]",
    border: "border-[#F4A8B8]/30",
    gradient: "from-[#F4A8B8]/15 to-[#FADCE3]/25",
  },
}

const modeDescriptions: Record<GameMode, string> = {
  check_in: "Answer the same questions independently. See where you align.",
  deep_dive: "Pick a topic. Go deep. No scoring, just honesty.",
  date_night: "Questions, dares, CoYYns stakes. Write cards for each other.",
}

const modeQuickActions: Record<GameMode, { label: string; variant: "primary" | "secondary" }[]> = {
  check_in: [
    { label: "Monthly Check-In", variant: "primary" },
    { label: "Custom", variant: "secondary" },
  ],
  deep_dive: [
    { label: "Start Exploring", variant: "primary" },
  ],
  date_night: [
    { label: "Light & Fun", variant: "primary" },
    { label: "Full Experience", variant: "secondary" },
  ],
}

export default function GameHomePage() {
  const router = useRouter()
  const { user } = useAuth()
  const { activeSession, loadActiveSession } = useGameEngine()

  useEffect(() => {
    loadActiveSession()
  }, [loadActiveSession])

  const handleModeQuickStart = (mode: GameMode, actionIndex: number) => {
    const routes: Record<GameMode, string> = {
      check_in: "/game/check-in/setup",
      deep_dive: "/game/deep-dive/setup",
      date_night: "/game/date-night/setup",
    }
    router.push(routes[mode])
  }

  const handleSetup = (mode: GameMode) => {
    const routes: Record<GameMode, string> = {
      check_in: "/game/check-in/setup",
      deep_dive: "/game/deep-dive/setup",
      date_night: "/game/date-night/setup",
    }
    router.push(routes[mode])
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: "linear-gradient(180deg, #FBF8F4 0%, #F5EDE3 100%)" }}>
      {/* Header */}
      <motion.div
        className="px-5 pt-6 pb-2"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1
          className="text-[28px] font-bold text-[#2C2825]"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Together Time <span className="text-lg">✨</span>
        </h1>
      </motion.div>

      {/* Active Session Resume Card */}
      {activeSession && (
        <motion.div
          className="px-5 mb-4"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <ActiveSessionCard session={activeSession} />
        </motion.div>
      )}

      {/* Mode Cards */}
      <div className="px-5 space-y-4 mt-2">
        {(["check_in", "deep_dive", "date_night"] as GameMode[]).map((mode, index) => (
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 + index * 0.1 }}
          >
            <GameModeCard
              mode={mode}
              onQuickStart={(actionIndex) => handleModeQuickStart(mode, actionIndex)}
              onSetup={() => handleSetup(mode)}
            />
          </motion.div>
        ))}
      </div>

      {/* Session History */}
      <motion.div
        className="px-5 mt-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.6 }}
      >
        <button
          onClick={() => router.push("/game/bank")}
          className={cn(
            "w-full flex items-center justify-between py-3 px-4",
            clay.card, clay.shadow, clay.pressed,
            "transition-all duration-200"
          )}
        >
          <span className="text-sm font-medium text-[#2C2825]">
            Question Bank <span className="ms-1">📚</span>
          </span>
          <ChevronRight size={16} className="text-[#8C8279]" />
        </button>
      </motion.div>
    </div>
  )
}

// ─── Mode Card Component ───

function GameModeCard({
  mode,
  onQuickStart,
  onSetup,
}: {
  mode: GameMode
  onQuickStart: (actionIndex: number) => void
  onSetup: () => void
}) {
  const modeLabel = GAME_MODE_LABELS[mode]
  const accent = modeAccents[mode]
  const description = modeDescriptions[mode]
  const actions = modeQuickActions[mode]

  return (
    <motion.div
      className={cn(
        clay.card, clay.shadow,
        "p-5 overflow-hidden relative",
        "bg-gradient-to-br", accent.gradient,
      )}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.15 }}
    >
      {/* Mode Icon + Arabic Name */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <span
            className="text-sm text-[#8C8279]"
            style={{ fontFamily: "'Amiri', serif" }}
          >
            {modeLabel.ar}
          </span>
          <h2 className="text-lg font-bold text-[#2C2825] mt-0.5">
            {modeLabel.emoji} {modeLabel.en}
          </h2>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-[#8C8279] mb-4 leading-relaxed">
        {description}
      </p>

      {/* Quick Action Buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        {actions.map((action, i) => (
          <motion.button
            key={action.label}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
              action.variant === "primary"
                ? cn(accent.text, accent.bg, "border", accent.border)
                : "text-[#8C8279] bg-white/50 border border-white/60",
              clay.pressed,
            )}
            whileTap={{ scale: 0.97 }}
            onClick={() => onQuickStart(i)}
          >
            {action.label} {action.variant === "primary" ? "→" : "→"}
          </motion.button>
        ))}
        {mode === "date_night" && (
          <button
            onClick={onSetup}
            className="text-xs text-[#8C8279] ms-auto hover:text-[#2C2825] transition-colors"
          >
            Set Up →
          </button>
        )}
      </div>

      {/* Category pills for date_night mode */}
      {mode === "date_night" && (
        <div className="flex gap-2 mt-3 flex-wrap">
          {(["love", "faith", "finances", "family"] as const).map(cat => (
            <span
              key={cat}
              className={cn(
                "inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium",
                "bg-white/60 text-[#8C8279] border border-white/80"
              )}
            >
              {CATEGORY_META[cat].emoji} {CATEGORY_META[cat].label}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  )
}

// ─── Active Session Card ───

function ActiveSessionCard({ session }: { session: GameSessionRow }) {
  const router = useRouter()
  const modeLabel = GAME_MODE_LABELS[session.mode]
  const isPaused = session.status === "paused"

  return (
    <motion.button
      className={cn(
        clay.card, clay.shadowLg,
        "w-full p-4 text-start",
        "bg-gradient-to-r from-[#D4A574]/15 to-[#C4956A]/10",
        "border-[#C4956A]/20",
      )}
      whileTap={{ scale: 0.98 }}
      onClick={() => {
        // Navigate to appropriate play screen based on mode
        router.push(`/game/${session.mode.replace("_", "-")}/play?session=${session.id}`)
      }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-[#C4956A] uppercase tracking-wide mb-1">
            {isPaused ? "Paused" : "In Progress"}
          </p>
          <h3 className="text-sm font-bold text-[#2C2825]">
            {modeLabel.emoji} {modeLabel.en}
          </h3>
          <p className="text-xs text-[#8C8279] mt-0.5">
            Round {session.completed_rounds}/{session.total_rounds}
          </p>
        </div>
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center",
          "bg-[#C4956A] text-white"
        )}>
          {isPaused ? <Play size={18} /> : <ChevronRight size={18} />}
        </div>
      </div>
    </motion.button>
  )
}

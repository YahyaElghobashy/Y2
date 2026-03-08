// ============================================================
// Game Types — Together Time: 3-mode couples game
// ============================================================

// ---------- Enums / Constants ----------

export const GAME_MODES = ["check_in", "deep_dive", "date_night"] as const
export type GameMode = (typeof GAME_MODES)[number]

export const GAME_MODE_LABELS: Record<GameMode, { en: string; ar: string; emoji: string }> = {
  check_in: { en: "Alignment Check-In", ar: "الميزان", emoji: "⚖️" },
  deep_dive: { en: "Deep Dive", ar: "غوص", emoji: "🌊" },
  date_night: { en: "Date Night Game", ar: "لعبة", emoji: "🎲" },
}

export const SESSION_STATUSES = [
  "setup", "authoring", "playing", "paused", "completed", "abandoned",
] as const
export type SessionStatus = (typeof SESSION_STATUSES)[number]

export const QUESTION_CATEGORIES = [
  "communication", "intimacy", "finances", "faith",
  "family", "lifestyle", "dreams", "conflict",
  "vulnerability", "love", "travel", "home",
] as const
export type QuestionCategory = (typeof QUESTION_CATEGORIES)[number]

export const CATEGORY_META: Record<QuestionCategory, { emoji: string; label: string; color: string }> = {
  communication: { emoji: "💬", label: "Communication", color: "#6B9EC4" },
  intimacy: { emoji: "💕", label: "Intimacy", color: "#C27070" },
  finances: { emoji: "💰", label: "Finances", color: "#7CB67C" },
  faith: { emoji: "🤲", label: "Faith", color: "#D4A04A" },
  family: { emoji: "👨‍👩‍👧", label: "Family", color: "#B87333" },
  lifestyle: { emoji: "🏡", label: "Lifestyle", color: "#8B7EC8" },
  dreams: { emoji: "✨", label: "Dreams", color: "#C4956A" },
  conflict: { emoji: "🤝", label: "Conflict", color: "#C27070" },
  vulnerability: { emoji: "🫶", label: "Vulnerability", color: "#D4A04A" },
  love: { emoji: "❤️", label: "Love", color: "#C27070" },
  travel: { emoji: "✈️", label: "Travel", color: "#6B9EC4" },
  home: { emoji: "🏠", label: "Home", color: "#7CB67C" },
}

export const ANSWER_TYPES = ["open", "scale_1_10", "yes_no", "multiple_choice", "ranking"] as const
export type AnswerType = (typeof ANSWER_TYPES)[number]

export const DIFFICULTY_LEVELS = ["light", "medium", "deep"] as const
export type DifficultyLevel = (typeof DIFFICULTY_LEVELS)[number]

export const HEAT_LEVELS = [1, 2, 3] as const
export type HeatLevel = (typeof HEAT_LEVELS)[number]

export const ROUND_TYPES = ["question", "dare", "truth_or_dare", "open_discussion"] as const
export type RoundType = (typeof ROUND_TYPES)[number]

export const ALIGNMENT_LABELS = ["aligned", "close", "talk_about_it"] as const
export type AlignmentLabel = (typeof ALIGNMENT_LABELS)[number]

// ---------- Row Types ----------

export type QuestionBankRow = {
  id: string
  text: string
  text_ar: string | null
  category: QuestionCategory
  difficulty: DifficultyLevel
  answer_type: AnswerType
  answer_options: string[] | null
  suitable_modes: GameMode[]
  heat_level: number
  is_system: boolean
  contributed_by: string | null
  use_count: number
  is_active: boolean
  created_at: string
}

export type GameDareRow = {
  id: string
  text: string
  text_ar: string | null
  category: QuestionCategory
  heat_level: HeatLevel
  coyyns_reward: number
  coyyns_penalty: number
  is_system: boolean
  contributed_by: string | null
  use_count: number
  is_active: boolean
  created_at: string
}

export type AnswerValue =
  | { value: number }           // scale_1_10
  | { text: string }            // open
  | { choice: string }          // yes_no / multiple_choice
  | { ranking: string[] }       // ranking

export type GameSessionRow = {
  id: string
  created_by: string
  partner_id: string
  mode: GameMode
  status: SessionStatus
  config: SessionConfig
  alignment_score: number | null
  category_scores: Record<string, number> | null
  relationship_pulse: number | null
  player1_score: number
  player2_score: number
  total_coyyns_earned: number
  total_rounds: number
  completed_rounds: number
  started_at: string | null
  completed_at: string | null
  duration_seconds: number | null
  created_at: string
  updated_at: string
}

export type GameRoundRow = {
  id: string
  session_id: string
  round_number: number
  question_id: string | null
  dare_id: string | null
  custom_content_id: string | null
  round_type: RoundType
  player1_answer: AnswerValue | null
  player2_answer: AnswerValue | null
  player1_answered_at: string | null
  player2_answered_at: string | null
  both_answered: boolean
  alignment_gap: number | null
  alignment_label: AlignmentLabel | null
  dare_completed: boolean | null
  dare_completed_by: string | null
  coyyns_earned: number
  player1_journal: string | null
  player2_journal: string | null
  is_skipped: boolean
  created_at: string
}

export type AnswerHistoryRow = {
  id: string
  user_id: string
  question_id: string
  session_id: string
  round_id: string
  answer_value: AnswerValue
  created_at: string
}

export type SessionCustomContentRow = {
  id: string
  session_id: string
  author_id: string
  target_partner_id: string
  content_type: "question" | "dare"
  text: string
  heat_level: number
  coyyns_reward: number
  coyyns_penalty: number
  is_revealed: boolean
  round_id: string | null
  created_at: string
}

export type GameContributionRow = {
  id: string
  user_id: string
  text: string
  category: string
  difficulty: DifficultyLevel
  answer_type: AnswerType
  target_mode: GameMode
  coyyns_spent: number
  status: "pending" | "approved" | "rejected"
  question_id: string | null
  created_at: string
}

export type GameScheduleRow = {
  id: string
  created_by: string
  mode: GameMode
  recurrence: "weekly" | "biweekly" | "monthly"
  day_of_week: number | null
  preferred_time: string | null
  config: Record<string, unknown>
  is_active: boolean
  next_due_at: string | null
  last_played_at: string | null
  created_at: string
  updated_at: string
}

// ---------- Config Types ----------

export type CheckInConfig = {
  categories: QuestionCategory[]
  questionCount: number
  intensity: "light" | "moderate" | "deep"
  includeOpenDiscussion: boolean
  shareResultsInstantly: boolean
  relationshipPulse: number
}

export type DeepDiveConfig = {
  primaryCategory: QuestionCategory
  secondaryCategories: QuestionCategory[]
  questionCount: number
  difficultyPreference: DifficultyLevel[]
}

export type DateNightConfig = {
  categories: QuestionCategory[]
  questionsPerCategory: number
  daresEnabled: boolean
  maxHeatLevel: HeatLevel
  wildcardCount: number
  truthOrDareEnabled: boolean
  customQuestionsEnabled: boolean
}

export type SessionConfig = CheckInConfig | DeepDiveConfig | DateNightConfig

// ---------- UI Types ----------

export type GameModeCard = {
  mode: GameMode
  label: { en: string; ar: string }
  emoji: string
  description: string
  accentColor: string
  bgGradient: string
}

export type RoundState = {
  round: GameRoundRow
  question: QuestionBankRow | null
  dare: GameDareRow | null
  customContent: SessionCustomContentRow | null
  isPartnerAuthored: boolean
  authorName: string | null
}

// ---------- Hook Return Types ----------

export type UseGameEngineReturn = {
  // Session
  session: GameSessionRow | null
  rounds: GameRoundRow[]
  currentRound: RoundState | null
  currentRoundIndex: number
  isLoading: boolean
  error: string | null

  // Session lifecycle
  createSession: (mode: GameMode, config: SessionConfig) => Promise<string | null>
  startSession: (sessionId: string) => Promise<void>
  pauseSession: () => Promise<void>
  resumeSession: () => Promise<void>
  completeSession: () => Promise<void>
  abandonSession: () => Promise<void>

  // Round actions
  submitAnswer: (answer: AnswerValue) => Promise<void>
  submitJournal: (text: string) => Promise<void>
  completeDare: () => Promise<void>
  skipDare: () => Promise<void>
  skipRound: () => Promise<void>
  nextRound: () => void

  // Partner-authored content
  saveCustomContent: (items: { type: "question" | "dare"; text: string; heatLevel?: number }[]) => Promise<void>
  getCustomContentStatus: () => { myCount: number; partnerDone: boolean }

  // History
  getAnswerHistory: (questionId: string) => Promise<AnswerHistoryRow[]>

  // Realtime
  isWaitingForPartner: boolean
  partnerHasAnswered: boolean

  // Active session detection
  activeSession: GameSessionRow | null
  loadActiveSession: () => Promise<void>
}

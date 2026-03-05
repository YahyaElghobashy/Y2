import type { Database } from "./database.types"

export type MoodLog = Database["public"]["Tables"]["mood_log"]["Row"]
export type MoodLogInsert = Database["public"]["Tables"]["mood_log"]["Insert"]

export const MOODS = ["good", "calm", "meh", "low", "frustrated", "loving"] as const
export type Mood = (typeof MOODS)[number]

export const MOOD_EMOJI: Record<Mood, string> = {
  good: "😊",
  calm: "😌",
  meh: "😐",
  low: "😔",
  frustrated: "😤",
  loving: "🥰",
}

export const MOOD_LABELS: Record<Mood, string> = {
  good: "Good",
  calm: "Calm",
  meh: "Meh",
  low: "Low",
  frustrated: "Frustrated",
  loving: "Loving",
}

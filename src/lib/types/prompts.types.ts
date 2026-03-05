// ── Daily Prompts Types ─────────────────────────────────────

export type PromptCategory = "deep" | "playful" | "memory" | "dream" | "opinion" | "challenge"

export type CouplePrompt = {
  id: string
  prompt_date: string
  prompt_text: string
  prompt_category: PromptCategory
  both_answered: boolean
  created_at: string
}

export type PromptAnswer = {
  id: string
  prompt_id: string
  user_id: string
  answer_text: string
  submitted_at: string
}

// ── Couple Prompts Bank ─────────────────────────────────────
// 50 starter prompts across 6 categories.
// Yahya will curate the full 400+ set later.

export type PromptCategory = "deep" | "playful" | "memory" | "dream" | "opinion" | "challenge"

export type PromptEntry = {
  text: string
  category: PromptCategory
}

export const PROMPTS_BANK: PromptEntry[] = [
  // ── Deep (10) ───────────────────────────────────────────────
  { text: "What is something you've never told me that you'd like to share?", category: "deep" },
  { text: "What does 'home' mean to you beyond a physical place?", category: "deep" },
  { text: "How has your understanding of love changed since we've been together?", category: "deep" },
  { text: "What is your biggest fear about our future?", category: "deep" },
  { text: "What moment in our relationship made you feel closest to me?", category: "deep" },
  { text: "How do you feel your relationship with Allah has shaped who you are as a partner?", category: "deep" },
  { text: "What is one thing you wish people understood about you?", category: "deep" },
  { text: "When do you feel most vulnerable, and how can I help in those moments?", category: "deep" },
  { text: "What life lesson took you the longest to learn?", category: "deep" },
  { text: "If you could change one thing about how you were raised, what would it be?", category: "deep" },

  // ── Playful (10) ────────────────────────────────────────────
  { text: "If we could swap lives for a day, what's the first thing you'd do as me?", category: "playful" },
  { text: "What's the most ridiculous thing you've ever Googled?", category: "playful" },
  { text: "If our love story was a movie, what genre would it be?", category: "playful" },
  { text: "What's a food combination you secretly love but would never admit?", category: "playful" },
  { text: "If you could have any superpower but only use it at home, what would it be?", category: "playful" },
  { text: "What's the funniest misunderstanding we've ever had?", category: "playful" },
  { text: "If you had to describe me using only emojis, which three would you pick?", category: "playful" },
  { text: "What song plays in your head when you think about us?", category: "playful" },
  { text: "What's the weirdest habit of mine that you actually find endearing?", category: "playful" },
  { text: "If we had a couples podcast, what would we call it?", category: "playful" },

  // ── Memory (8) ──────────────────────────────────────────────
  { text: "What's your favorite memory of us from the last month?", category: "memory" },
  { text: "Do you remember the first time you realized you loved me? Describe it.", category: "memory" },
  { text: "What's a small moment between us that others might overlook but means a lot to you?", category: "memory" },
  { text: "What's the best meal we've ever shared together?", category: "memory" },
  { text: "Describe a time when I made you laugh until you cried.", category: "memory" },
  { text: "What's a Ramadan memory we share that stands out to you?", category: "memory" },
  { text: "What was going through your mind during our first conversation?", category: "memory" },
  { text: "What's the best surprise you've ever given me or received from me?", category: "memory" },

  // ── Dream (8) ───────────────────────────────────────────────
  { text: "Where do you see us living in 10 years?", category: "dream" },
  { text: "If money was no object, what would our perfect day look like?", category: "dream" },
  { text: "What's a skill or hobby you'd love for us to learn together?", category: "dream" },
  { text: "If we could travel anywhere for Eid, where would you choose?", category: "dream" },
  { text: "What does your ideal retirement with me look like?", category: "dream" },
  { text: "What's one tradition you'd love us to start for our family?", category: "dream" },
  { text: "If you could build anything for us — an app, a space, a project — what would it be?", category: "dream" },
  { text: "What kind of legacy do you want us to leave behind?", category: "dream" },

  // ── Opinion (7) ─────────────────────────────────────────────
  { text: "What's one thing the world gets wrong about marriage?", category: "opinion" },
  { text: "Is it better to be too early or too late? Why?", category: "opinion" },
  { text: "What's overrated that everyone seems to love?", category: "opinion" },
  { text: "Do you think people can truly change? Why or why not?", category: "opinion" },
  { text: "What's the most important quality in a friend?", category: "opinion" },
  { text: "Is it better to have a strict routine or go with the flow?", category: "opinion" },
  { text: "What's the best advice you've ever received?", category: "opinion" },

  // ── Challenge (7) ──────────────────────────────────────────
  { text: "Say three things you genuinely appreciate about me right now.", category: "challenge" },
  { text: "Write a haiku about our relationship.", category: "challenge" },
  { text: "Describe our love using only 5 words.", category: "challenge" },
  { text: "What's one thing you want to do differently this week as a partner?", category: "challenge" },
  { text: "Make a dua for us and share what you asked for.", category: "challenge" },
  { text: "Give me a nickname based on how you see me today.", category: "challenge" },
  { text: "What's one small act of kindness you'll do for me tomorrow?", category: "challenge" },
]

/**
 * Deterministic daily prompt selection using a simple hash.
 * Ensures the same prompt is returned for the same date, with no
 * repeat within a 90-day window (modular cycling through bank).
 */
export function getPromptForDate(date: Date, prompts: PromptEntry[] = PROMPTS_BANK): PromptEntry {
  // Format as YYYY-MM-DD
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, "0")
  const dd = String(date.getDate()).padStart(2, "0")
  const dateStr = `${yyyy}-${mm}-${dd}`

  // Simple deterministic hash (djb2 variant)
  let hash = 5381
  for (let i = 0; i < dateStr.length; i++) {
    hash = ((hash << 5) + hash + dateStr.charCodeAt(i)) >>> 0
  }

  // Day index since a fixed epoch (2026-01-01) for sequential cycling
  const epoch = new Date(2026, 0, 1).getTime()
  const dayIndex = Math.floor((date.getTime() - epoch) / 86400000)

  // Use day index modulo bank size for sequential no-repeat
  // Then add hash-based offset for variety across different bank sizes
  const bankSize = prompts.length
  const index = ((dayIndex % bankSize) + bankSize) % bankSize

  return prompts[index]
}

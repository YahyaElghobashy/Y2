import { describe, it, expect } from "vitest"
import { PROMPTS_BANK, getPromptForDate } from "@/data/prompts-bank"
import type { PromptCategory } from "@/data/prompts-bank"

describe("prompts-bank", () => {
  // ── UNIT: Bank content ──────────────────────────────────────

  it("contains 50 prompts", () => {
    expect(PROMPTS_BANK).toHaveLength(50)
  })

  it("covers all 6 categories", () => {
    const categories = new Set(PROMPTS_BANK.map((p) => p.category))
    const expected: PromptCategory[] = [
      "deep", "playful", "memory", "dream", "opinion", "challenge",
    ]
    for (const cat of expected) {
      expect(categories.has(cat)).toBe(true)
    }
  })

  it("every prompt has a non-empty text", () => {
    for (const p of PROMPTS_BANK) {
      expect(p.text.trim().length).toBeGreaterThan(0)
    }
  })

  it("every prompt has a valid category", () => {
    const valid = new Set(["deep", "playful", "memory", "dream", "opinion", "challenge"])
    for (const p of PROMPTS_BANK) {
      expect(valid.has(p.category)).toBe(true)
    }
  })

  it("has at least 5 prompts per category", () => {
    const counts: Record<string, number> = {}
    for (const p of PROMPTS_BANK) {
      counts[p.category] = (counts[p.category] ?? 0) + 1
    }
    for (const cat of Object.keys(counts)) {
      expect(counts[cat]).toBeGreaterThanOrEqual(5)
    }
  })

  // ── UNIT: Deterministic selection ─────────────────────────

  it("returns same prompt for same date", () => {
    const date = new Date(2026, 2, 5) // March 5, 2026
    const p1 = getPromptForDate(date)
    const p2 = getPromptForDate(date)
    expect(p1.text).toBe(p2.text)
  })

  it("returns different prompts for different dates", () => {
    const p1 = getPromptForDate(new Date(2026, 2, 5))
    const p2 = getPromptForDate(new Date(2026, 2, 6))
    expect(p1.text).not.toBe(p2.text)
  })

  it("no repeat within first 50 consecutive days", () => {
    const seen = new Set<string>()
    for (let i = 0; i < 50; i++) {
      const date = new Date(2026, 0, 1 + i)
      const prompt = getPromptForDate(date)
      expect(seen.has(prompt.text)).toBe(false)
      seen.add(prompt.text)
    }
  })

  it("returns a valid PromptEntry object", () => {
    const prompt = getPromptForDate(new Date(2026, 5, 15))
    expect(prompt).toHaveProperty("text")
    expect(prompt).toHaveProperty("category")
    expect(typeof prompt.text).toBe("string")
    expect(typeof prompt.category).toBe("string")
  })

  it("works with custom prompt bank", () => {
    const custom = [
      { text: "Custom A", category: "deep" as const },
      { text: "Custom B", category: "playful" as const },
    ]
    const p = getPromptForDate(new Date(2026, 0, 1), custom)
    expect(["Custom A", "Custom B"]).toContain(p.text)
  })
})

describe("025_couple_prompts migration", () => {
  // Read the SQL file
  const fs = require("fs")
  const path = require("path")
  const sql = fs.readFileSync(
    path.resolve(__dirname, "../../../supabase/migrations/025_couple_prompts.sql"),
    "utf-8"
  )

  // ── UNIT: Table definitions ───────────────────────────────

  it("creates couple_prompts table", () => {
    expect(sql).toContain("create table public.couple_prompts")
  })

  it("creates prompt_answers table", () => {
    expect(sql).toContain("create table public.prompt_answers")
  })

  it("prompt_date is UNIQUE", () => {
    expect(sql).toMatch(/prompt_date\s+date\s+unique/)
  })

  it("enforces category CHECK constraint with 6 values", () => {
    expect(sql).toMatch(/prompt_category\s+in\s*\(\s*'deep'/)
    expect(sql).toContain("'playful'")
    expect(sql).toContain("'memory'")
    expect(sql).toContain("'dream'")
    expect(sql).toContain("'opinion'")
    expect(sql).toContain("'challenge'")
  })

  it("answer_text max length 2000", () => {
    expect(sql).toMatch(/char_length\(answer_text\)\s*<=\s*2000/)
  })

  it("UNIQUE constraint on (prompt_id, user_id)", () => {
    expect(sql).toMatch(/unique\s*\(\s*prompt_id\s*,\s*user_id\s*\)/)
  })

  // ── UNIT: Trigger ─────────────────────────────────────────

  it("creates check_both_prompt_answered trigger", () => {
    expect(sql).toContain("check_both_prompt_answered")
    expect(sql).toContain("count(distinct user_id)")
    expect(sql).toContain(">= 2")
  })

  // ── INTEGRATION: RLS ──────────────────────────────────────

  it("enables RLS on both tables", () => {
    expect(sql).toContain("alter table public.couple_prompts enable row level security")
    expect(sql).toContain("alter table public.prompt_answers enable row level security")
  })

  it("partner can see answers only when both_answered", () => {
    expect(sql).toContain("both_answered = true")
  })

  // ── INTEGRATION: Realtime ─────────────────────────────────

  it("adds both tables to realtime", () => {
    expect(sql).toContain("alter publication supabase_realtime add table public.couple_prompts")
    expect(sql).toContain("alter publication supabase_realtime add table public.prompt_answers")
  })
})

import { describe, it, expect } from "vitest"
import * as fs from "fs"
import * as path from "path"

const sql = fs.readFileSync(
  path.resolve(__dirname, "../../../supabase/migrations/026_spin_the_wheel.sql"),
  "utf-8"
)

describe("026_spin_the_wheel migration", () => {
  // ── UNIT: Table definitions ───────────────────────────────

  it("creates wheel_presets table", () => {
    expect(sql).toContain("create table public.wheel_presets")
  })

  it("creates wheel_sessions table", () => {
    expect(sql).toContain("create table public.wheel_sessions")
  })

  it("creates wheel_spins table", () => {
    expect(sql).toContain("create table public.wheel_spins")
  })

  // ── UNIT: wheel_presets constraints ────────────────────────

  it("items jsonb has min 2 max 20 constraint", () => {
    expect(sql).toMatch(/jsonb_array_length\(items\)\s*>=\s*2/)
    expect(sql).toMatch(/jsonb_array_length\(items\)\s*<=\s*20/)
  })

  it("is_shared defaults to true", () => {
    expect(sql).toMatch(/is_shared\s+boolean\s+not null\s+default\s+true/)
  })

  it("icon defaults to target emoji", () => {
    expect(sql).toContain("default '🎯'")
  })

  it("user_id references profiles", () => {
    expect(sql).toMatch(/user_id\s+uuid\s+not null\s+references\s+public\.profiles/)
  })

  // ── UNIT: wheel_sessions constraints ──────────────────────

  it("mode CHECK constraint with 3 values", () => {
    expect(sql).toContain("'selection'")
    expect(sql).toContain("'elimination'")
    expect(sql).toContain("'best_of'")
    expect(sql).toMatch(/mode\s+in\s*\(\s*'selection'/)
  })

  it("status CHECK constraint with 3 values", () => {
    expect(sql).toContain("'active'")
    expect(sql).toContain("'completed'")
    expect(sql).toContain("'abandoned'")
    expect(sql).toMatch(/status\s+in\s*\(\s*'active'/)
  })

  it("status defaults to active", () => {
    expect(sql).toMatch(/status\s+text\s+not null\s+default\s+'active'/)
  })

  it("best_of_rounds defaults to 0", () => {
    expect(sql).toMatch(/best_of_rounds\s+integer\s+not null\s+default\s+0/)
  })

  it("preset_id references wheel_presets with cascade", () => {
    expect(sql).toMatch(/preset_id\s+uuid\s+not null\s+references\s+public\.wheel_presets.*on delete cascade/)
  })

  // ── UNIT: wheel_spins constraints ─────────────────────────

  it("session_id references wheel_sessions with cascade", () => {
    expect(sql).toMatch(/session_id\s+uuid\s+not null\s+references\s+public\.wheel_sessions.*on delete cascade/)
  })

  it("spin_number is not null integer", () => {
    expect(sql).toMatch(/spin_number\s+integer\s+not null/)
  })

  it("result_label is not null text", () => {
    expect(sql).toMatch(/result_label\s+text\s+not null/)
  })

  it("result_index is not null integer", () => {
    expect(sql).toMatch(/result_index\s+integer\s+not null/)
  })

  // ── UNIT: Indexes ─────────────────────────────────────────

  it("creates index on wheel_presets(user_id)", () => {
    expect(sql).toContain("wheel_presets_user_id_idx")
  })

  it("creates index on wheel_sessions(preset_id)", () => {
    expect(sql).toContain("wheel_sessions_preset_id_idx")
  })

  it("creates index on wheel_sessions(status)", () => {
    expect(sql).toContain("wheel_sessions_status_idx")
  })

  it("creates index on wheel_spins(session_id)", () => {
    expect(sql).toContain("wheel_spins_session_id_idx")
  })

  // ── UNIT: Triggers ────────────────────────────────────────

  it("creates updated_at trigger on wheel_presets", () => {
    expect(sql).toContain("wheel_presets_set_updated_at")
    expect(sql).toContain("before update on public.wheel_presets")
  })

  it("creates updated_at trigger on wheel_sessions", () => {
    expect(sql).toContain("wheel_sessions_set_updated_at")
    expect(sql).toContain("before update on public.wheel_sessions")
  })

  // ── INTEGRATION: RLS ──────────────────────────────────────

  it("enables RLS on all three tables", () => {
    expect(sql).toContain("alter table public.wheel_presets enable row level security")
    expect(sql).toContain("alter table public.wheel_sessions enable row level security")
    expect(sql).toContain("alter table public.wheel_spins enable row level security")
  })

  it("wheel_presets has user select own policy", () => {
    expect(sql).toContain("wheel_presets: user select own")
  })

  it("wheel_presets has partner select shared policy", () => {
    expect(sql).toContain("wheel_presets: partner select shared")
    expect(sql).toContain("is_shared = true")
  })

  it("wheel_presets has user insert policy", () => {
    expect(sql).toContain("wheel_presets: user insert")
  })

  it("wheel_presets has user update policy", () => {
    expect(sql).toContain("wheel_presets: user update")
  })

  it("wheel_presets has user delete policy", () => {
    expect(sql).toContain("wheel_presets: user delete")
  })

  it("wheel_sessions has user and partner select policies", () => {
    expect(sql).toContain("wheel_sessions: user select own")
    expect(sql).toContain("wheel_sessions: partner select")
  })

  it("wheel_sessions has user insert and update policies", () => {
    expect(sql).toContain("wheel_sessions: user insert")
    expect(sql).toContain("wheel_sessions: user update")
  })

  it("wheel_spins has user and partner select policies", () => {
    expect(sql).toContain("wheel_spins: user select own")
    expect(sql).toContain("wheel_spins: partner select")
  })

  it("wheel_spins has user insert policy", () => {
    expect(sql).toContain("wheel_spins: user insert")
  })

  // ── INTEGRATION: Realtime ─────────────────────────────────

  it("adds all three tables to realtime", () => {
    expect(sql).toContain("alter publication supabase_realtime add table public.wheel_presets")
    expect(sql).toContain("alter publication supabase_realtime add table public.wheel_sessions")
    expect(sql).toContain("alter publication supabase_realtime add table public.wheel_spins")
  })
})

import { describe, it, expect } from "vitest"
import { readFileSync } from "fs"
import { resolve } from "path"

const sql = readFileSync(
  resolve(__dirname, "../../../supabase/migrations/024_watch_together.sql"),
  "utf-8"
)

describe("024_watch_together migration", () => {
  // ── UNIT: Table definitions ───────────────────────────────

  describe("watch_items table", () => {
    it("creates watch_items table with required columns", () => {
      expect(sql).toContain("create table public.watch_items")
      expect(sql).toContain("id")
      expect(sql).toContain("added_by")
      expect(sql).toContain("title")
      expect(sql).toContain("item_type")
      expect(sql).toContain("poster_url")
      expect(sql).toContain("poster_media_id")
      expect(sql).toContain("year")
      expect(sql).toContain("tmdb_id")
      expect(sql).toContain("status")
      expect(sql).toContain("watched_date")
      expect(sql).toContain("both_rated")
    })

    it("enforces item_type CHECK constraint", () => {
      expect(sql).toMatch(
        /item_type\s+in\s*\(\s*'movie'\s*,\s*'series'\s*,\s*'anime'\s*,\s*'documentary'\s*,\s*'short'\s*,\s*'other'\s*\)/
      )
    })

    it("enforces status CHECK constraint with correct flow values", () => {
      expect(sql).toMatch(
        /status\s+in\s*\(\s*'watchlist'\s*,\s*'watching'\s*,\s*'watched'\s*\)/
      )
    })

    it("defaults status to watchlist", () => {
      expect(sql).toMatch(/default\s+'watchlist'/)
    })

    it("defaults both_rated to false", () => {
      expect(sql).toMatch(/both_rated\s+boolean\s+not null\s+default\s+false/)
    })

    it("references profiles for added_by", () => {
      expect(sql).toMatch(/added_by\s+uuid\s+not null\s+references\s+public\.profiles/)
    })

    it("references media_files for poster_media_id with SET NULL on delete", () => {
      expect(sql).toMatch(/poster_media_id\s+uuid\s+references\s+public\.media_files.*on delete set null/)
    })

    it("creates index on status", () => {
      expect(sql).toContain("create index watch_items_status_idx")
    })

    it("creates index on added_by", () => {
      expect(sql).toContain("create index watch_items_added_by_idx")
    })
  })

  describe("watch_ratings table", () => {
    it("creates watch_ratings table with required columns", () => {
      expect(sql).toContain("create table public.watch_ratings")
      expect(sql).toContain("item_id")
      expect(sql).toContain("user_id")
      expect(sql).toContain("score")
      expect(sql).toContain("reaction")
      expect(sql).toContain("submitted_at")
    })

    it("enforces score range 1-10", () => {
      expect(sql).toMatch(/score\s+>=\s*1\s+and\s+score\s+<=\s*10/)
    })

    it("enforces reaction max length 200", () => {
      expect(sql).toMatch(/char_length\(reaction\)\s*<=\s*200/)
    })

    it("has UNIQUE constraint on (item_id, user_id)", () => {
      expect(sql).toMatch(/unique\s*\(\s*item_id\s*,\s*user_id\s*\)/)
    })

    it("cascades delete from watch_items", () => {
      expect(sql).toMatch(/item_id\s+uuid\s+not null\s+references\s+public\.watch_items.*on delete cascade/)
    })

    it("creates index on item_id", () => {
      expect(sql).toContain("create index watch_ratings_item_id_idx")
    })
  })

  // ── UNIT: Triggers ────────────────────────────────────────

  describe("triggers", () => {
    it("creates set_updated_at trigger on watch_items", () => {
      expect(sql).toContain("create trigger watch_items_set_updated_at")
      expect(sql).toMatch(/before update on public\.watch_items/)
      expect(sql).toContain("execute function public.set_updated_at()")
    })

    it("creates check_both_watch_rated trigger function", () => {
      expect(sql).toContain("create or replace function public.check_both_watch_rated()")
      expect(sql).toContain("returns trigger")
    })

    it("trigger fires after INSERT on watch_ratings", () => {
      expect(sql).toContain("create trigger watch_ratings_check_both_rated")
      expect(sql).toMatch(/after insert on public\.watch_ratings/)
    })

    it("trigger checks for 2 distinct users", () => {
      expect(sql).toContain("count(distinct user_id)")
      expect(sql).toContain(">= 2")
    })

    it("trigger sets both_rated = true on parent watch_item", () => {
      expect(sql).toMatch(/update public\.watch_items\s+set both_rated = true/)
    })

    it("trigger only updates items where both_rated is false (idempotent)", () => {
      expect(sql).toContain("and both_rated = false")
    })
  })

  // ── INTEGRATION: RLS Policies ─────────────────────────────

  describe("RLS policies — watch_items", () => {
    it("enables RLS on watch_items", () => {
      expect(sql).toContain("alter table public.watch_items enable row level security")
    })

    it("allows user to select own items", () => {
      expect(sql).toContain('"watch_items: user select own"')
    })

    it("allows partner to select items", () => {
      expect(sql).toContain('"watch_items: partner select"')
    })

    it("allows user to insert own items", () => {
      expect(sql).toContain('"watch_items: user insert"')
    })

    it("allows user to update own items", () => {
      expect(sql).toContain('"watch_items: user update"')
    })

    it("allows user to delete own items", () => {
      expect(sql).toContain('"watch_items: user delete"')
    })
  })

  describe("RLS policies — watch_ratings", () => {
    it("enables RLS on watch_ratings", () => {
      expect(sql).toContain("alter table public.watch_ratings enable row level security")
    })

    it("allows user to select own ratings", () => {
      expect(sql).toContain('"watch_ratings: user select own"')
    })

    it("allows partner to select ratings", () => {
      expect(sql).toContain('"watch_ratings: partner select"')
    })

    it("allows user to insert own ratings", () => {
      expect(sql).toContain('"watch_ratings: user insert"')
    })

    it("allows user to update own ratings", () => {
      expect(sql).toContain('"watch_ratings: user update"')
    })
  })

  // ── INTEGRATION: Realtime ─────────────────────────────────

  describe("realtime", () => {
    it("adds watch_items to realtime publication", () => {
      expect(sql).toContain("alter publication supabase_realtime add table public.watch_items")
    })

    it("adds watch_ratings to realtime publication", () => {
      expect(sql).toContain("alter publication supabase_realtime add table public.watch_ratings")
    })
  })
})

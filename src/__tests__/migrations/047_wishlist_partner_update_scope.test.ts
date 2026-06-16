import { describe, it, expect } from "vitest"
import { readFileSync } from "fs"
import { resolve } from "path"

const sql = readFileSync(
  resolve(__dirname, "../../../supabase/migrations/047_wishlist_partner_update_scope.sql"),
  "utf-8"
)

describe("047_wishlist_partner_update_scope migration", () => {
  // ── Policy: partner UPDATE now has WITH CHECK ───────────────
  describe("partner UPDATE policy", () => {
    it("drops the old partner update policy before recreating it", () => {
      expect(sql).toMatch(/drop policy if exists "wishlist_items: partner update claim" on public\.wishlist_items/)
    })

    it("recreates the partner update policy with both USING and WITH CHECK", () => {
      expect(sql).toMatch(/create policy "wishlist_items: partner update claim"/)
      expect(sql).toContain("using (")
      expect(sql).toContain("with check (")
      // WITH CHECK is scoped to the partner's wishlists (cannot move the row out).
      expect(sql).toMatch(/with check \(\s*wishlist_id in \(\s*select id from public\.wishlists where owner_id = public\.get_partner_id\(\)/)
    })
  })

  // ── Column-scope trigger ────────────────────────────────────
  describe("column-scope trigger", () => {
    it("defines the enforce_wishlist_partner_update_scope function as SECURITY DEFINER", () => {
      expect(sql).toMatch(/create or replace function public\.enforce_wishlist_partner_update_scope\(\)/)
      expect(sql).toContain("security definer")
      expect(sql).toContain("set search_path = public")
    })

    it("allows the owner (or null/service context) to change any column", () => {
      expect(sql).toMatch(/if auth\.uid\(\) is null or auth\.uid\(\) = v_owner then\s*return new;/)
    })

    it("rejects partner changes to every non-claim/purchase column", () => {
      for (const col of [
        "wishlist_id", "title", "description", "url", "image_url",
        "image_media_id", "price", "currency", "category", "priority",
        "sort_order", "added_by",
      ]) {
        expect(sql).toContain(`new.${col}`)
      }
      expect(sql).toMatch(/raise exception/)
    })

    it("does NOT guard the claim/purchase columns (those remain partner-editable)", () => {
      // The guard block must not block these — they are the whole point of the policy.
      const guardBlock = sql.slice(sql.indexOf("if new.wishlist_id"), sql.indexOf("raise exception"))
      for (const col of ["claimed_by", "claimed_at", "is_purchased", "purchased_at", "purchased_by"]) {
        expect(guardBlock).not.toContain(`new.${col}`)
      }
    })

    it("attaches the trigger BEFORE UPDATE on wishlist_items (idempotently)", () => {
      expect(sql).toMatch(/drop trigger if exists wishlist_items_partner_update_scope on public\.wishlist_items/)
      expect(sql).toMatch(/create trigger wishlist_items_partner_update_scope\s+before update on public\.wishlist_items\s+for each row\s+execute function public\.enforce_wishlist_partner_update_scope\(\)/)
    })
  })
})

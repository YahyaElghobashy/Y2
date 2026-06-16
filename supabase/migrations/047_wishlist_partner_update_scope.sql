-- ============================================================
-- 047: Restrict partner UPDATE scope on wishlist_items
--
-- BACKGROUND: 028_wishlist.sql granted the partner an UPDATE policy
-- ("wishlist_items: partner update claim") so they can claim/purchase a
-- gift on the owner's list. That policy had a USING clause but NO WITH
-- CHECK, and RLS cannot restrict WHICH columns change — so a partner
-- could overwrite title/description/url/price/category/priority/sort_order
-- or even move the row to another wishlist. Despite the policy name, the
-- partner was not limited to claim/purchase fields.
--
-- FIX (least privilege for the gift flow):
--   1. Add a WITH CHECK to the partner UPDATE policy (mirrors USING) so the
--      row cannot be moved out of the partner-scoped set.
--   2. A BEFORE UPDATE trigger that — when the updater is the partner, not
--      the wishlist owner — rejects changes to any column other than the
--      claim/purchase fields (claimed_by, claimed_at, is_purchased,
--      purchased_at, purchased_by).
--
-- Depends on: 028_wishlist.sql (wishlist_items, partner update policy),
--             008 get_partner_id() helper.
-- ============================================================


-- ── 1. Partner UPDATE policy: add WITH CHECK ────────────────
-- Drop + recreate so the partner can only leave the row within their
-- partner-scoped wishlist (cannot reassign wishlist_id outside that set).

drop policy if exists "wishlist_items: partner update claim" on public.wishlist_items;

create policy "wishlist_items: partner update claim"
  on public.wishlist_items for update
  to authenticated
  using (
    wishlist_id in (
      select id from public.wishlists where owner_id = public.get_partner_id()
    )
  )
  with check (
    wishlist_id in (
      select id from public.wishlists where owner_id = public.get_partner_id()
    )
  );


-- ── 2. Column-scope trigger ─────────────────────────────────
-- When the updater is NOT the wishlist owner (i.e. the partner), only the
-- claim/purchase columns may change. auth.uid() is request-scoped and is
-- still populated under SECURITY DEFINER. NULL auth.uid() (service role /
-- migrations) is treated as privileged and allowed through unchanged.

create or replace function public.enforce_wishlist_partner_update_scope()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
begin
  select owner_id into v_owner
  from public.wishlists
  where id = new.wishlist_id;

  -- Owner (or service/admin context with no JWT) may change anything.
  if auth.uid() is null or auth.uid() = v_owner then
    return new;
  end if;

  -- Otherwise the updater is the partner: only claim/purchase fields may move.
  if new.wishlist_id    is distinct from old.wishlist_id
     or new.title          is distinct from old.title
     or new.description    is distinct from old.description
     or new.url            is distinct from old.url
     or new.image_url      is distinct from old.image_url
     or new.image_media_id is distinct from old.image_media_id
     or new.price          is distinct from old.price
     or new.currency       is distinct from old.currency
     or new.category       is distinct from old.category
     or new.priority       is distinct from old.priority
     or new.sort_order     is distinct from old.sort_order
     or new.added_by       is distinct from old.added_by then
    raise exception
      'wishlist partner may only modify claim/purchase fields (claimed_by, claimed_at, is_purchased, purchased_at, purchased_by)';
  end if;

  return new;
end;
$$;

drop trigger if exists wishlist_items_partner_update_scope on public.wishlist_items;

create trigger wishlist_items_partner_update_scope
  before update on public.wishlist_items
  for each row
  execute function public.enforce_wishlist_partner_update_scope();

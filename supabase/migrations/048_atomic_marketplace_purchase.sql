-- ============================================================
-- 048: Atomic marketplace purchase RPC
-- Folds the CoYYns spend + purchase-record insert into a single
-- transaction so an item can never be delivered without a charge
-- (or charged without a purchase row). Mirrors the SECURITY DEFINER
-- payout RPCs in 017_challenges_bounties_v2.sql.
--
-- Before: use-marketplace.createPurchase() called spendCoyyns()
--   (which swallowed failures) and then inserted the purchase + invoked
--   the effect regardless — items could deliver with no CoYYns charged.
--
-- Depends on: 002_coyyns.sql (wallets, transactions, balance trigger),
--             011_marketplace.sql (marketplace_items, purchases)
-- ============================================================

create or replace function public.purchase_marketplace_item(
  p_item_id uuid,
  p_target_id uuid,
  p_effect_payload jsonb default null
)
returns public.purchases
language plpgsql
security definer
set search_path = public
as $$
declare
  v_buyer    uuid := auth.uid();
  v_item     public.marketplace_items;
  v_balance  integer;
  v_purchase public.purchases;
begin
  if v_buyer is null then
    raise exception 'AUTH_REQUIRED' using errcode = '28000';
  end if;

  -- purchases.buyer_id <> target_id is also enforced by a CHECK; fail early
  -- with a clean code rather than a constraint-violation message.
  if p_target_id is null or p_target_id = v_buyer then
    raise exception 'INVALID_TARGET' using errcode = '22023';
  end if;

  -- Item must exist and be on sale.
  select * into v_item
  from public.marketplace_items
  where id = p_item_id and is_active = true;
  if not found then
    raise exception 'ITEM_NOT_FOUND' using errcode = 'P0002';
  end if;

  -- Lock the buyer wallet to serialize concurrent spends, then verify funds.
  -- SECURITY DEFINER bypasses RLS so the FOR UPDATE lock is honoured.
  select balance into v_balance
  from public.coyyns_wallets
  where user_id = v_buyer
  for update;

  if v_balance is null then
    raise exception 'WALLET_NOT_FOUND' using errcode = 'P0002';
  end if;
  if v_balance < v_item.price then
    raise exception 'INSUFFICIENT_FUNDS' using errcode = 'P0001';
  end if;

  -- Ledger spend. on_coyyn_transaction_insert debits the wallet; the
  -- balance >= 0 CHECK is the final backstop against a race overspend
  -- (would roll back this whole function).
  insert into public.coyyns_transactions
    (user_id, amount, type, category, description, metadata)
  values
    (v_buyer, -abs(v_item.price), 'spend', 'marketplace',
     v_item.name, jsonb_build_object('item_id', p_item_id));

  -- Purchase record — same transaction → atomic with the spend.
  insert into public.purchases
    (buyer_id, target_id, item_id, cost, effect_payload, status)
  values
    (v_buyer, p_target_id, p_item_id, v_item.price, p_effect_payload, 'pending')
  returning * into v_purchase;

  return v_purchase;
end;
$$;

revoke all on function public.purchase_marketplace_item(uuid, uuid, jsonb) from public;
grant execute on function public.purchase_marketplace_item(uuid, uuid, jsonb) to authenticated;

comment on function public.purchase_marketplace_item(uuid, uuid, jsonb) is
  'Atomic marketplace purchase: debits buyer CoYYns and inserts the purchase row in one transaction. Raises INSUFFICIENT_FUNDS / ITEM_NOT_FOUND / WALLET_NOT_FOUND / INVALID_TARGET / AUTH_REQUIRED. The caller then invokes process-purchase to apply the effect + notify the partner.';

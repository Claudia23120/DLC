-- ════════════════════════════════════════════════════════════════════════
-- Botiga: pay only what is in stock.
--
-- Units "pendent de reposició" (0026) are not paid until they arrive. So an
-- order now tracks how much has been paid (`paid_cents`):
--
--   covered  = Σ (quantity − backordered_quantity) × unit_price   (derived)
--   due now  = max(0, covered − paid_cents)
--
-- When the board books received stock, `covered` grows and so does the amount
-- due, with no state change needed. payment_status stays two-valued and means
-- "fully settled": 'paid' only once paid_cents ≥ total_cents.
-- ════════════════════════════════════════════════════════════════════════

alter table shop_orders
  add column if not exists paid_cents int not null default 0 check (paid_cents >= 0);

-- Orders already marked paid (0025) were paid in full.
update shop_orders set paid_cents = total_cents where payment_status = 'paid';

-- Replace the 0025 rule "paid ⇔ paid_at and method": an order partly paid keeps
-- its last payment date/method while its status is still 'unpaid'.
alter table shop_orders drop constraint if exists shop_orders_paid_chk;

alter table shop_orders
  add constraint shop_orders_paid_chk
  check (payment_status <> 'paid'
         or (paid_at is not null and payment_method is not null and paid_cents >= total_cents));

alter table shop_orders
  add constraint shop_orders_paid_meta_chk
  check ((paid_at is null) = (payment_method is null));

-- ── Mark an order paid (board only) ─────────────────────────────────────
-- Records a payment of everything covered by stock right now. Atomic: it locks
-- the order and reads the lines in the same transaction, so a restock that
-- lands at the same moment can't make the recorded amount wrong.
create or replace function public.mark_shop_order_paid(p_order_id uuid, p_method text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total   int;
  v_paid    int;
  v_covered int;
begin
  if not public.is_admin() then
    raise exception 'No autoritzat';
  end if;
  if p_method is null or p_method not in ('transfer', 'cash', 'other') then
    raise exception 'Mètode de pagament no vàlid';
  end if;

  select total_cents, paid_cents into v_total, v_paid
    from shop_orders
   where id = p_order_id
     for update;
  if not found then
    raise exception 'Comanda no trobada';
  end if;

  select coalesce(sum((quantity - backordered_quantity) * unit_price_cents), 0)
    into v_covered
    from shop_order_lines
   where order_id = p_order_id;

  if v_covered < v_total and v_covered - v_paid <= 0 then
    raise exception 'No hi ha res pendent de cobrar';
  end if;

  update shop_orders
     set paid_cents     = v_covered,
         paid_at        = now(),
         payment_method = p_method,
         payment_status = case when v_covered >= v_total
                               then 'paid'::shop_payment_status
                               else 'unpaid'::shop_payment_status end
   where id = p_order_id;
end;
$$;

revoke all on function public.mark_shop_order_paid(uuid, text) from public;
grant execute on function public.mark_shop_order_paid(uuid, text) to authenticated;

-- ════════════════════════════════════════════════════════════════════════
-- Botiga: orders for out-of-stock items ("pendent de reposició").
--
-- A member may order a size with no (or not enough) stock when the item allows
-- it. create_shop_order() then reserves whatever stock exists and records the
-- rest on the order line as `backordered_quantity`. The board sees how many
-- units it has to buy, and when it receives them (restock_shop_variant) they
-- are assigned to the oldest pending order lines first; any surplus goes to
-- free stock.
--
-- An order with pending units is never "delivered": create_shop_order forces
-- it to pending delivery, and the app won't let the board mark it delivered
-- until every line is covered.
-- ════════════════════════════════════════════════════════════════════════

alter table shop_items
  add column if not exists allow_backorder boolean not null default true;

alter table shop_order_lines
  add column if not exists backordered_quantity int not null default 0;

alter table shop_order_lines
  add constraint shop_order_lines_backordered_chk
  check (backordered_quantity >= 0 and backordered_quantity <= quantity);

-- Lines still waiting for stock, oldest first (used by restock_shop_variant).
create index if not exists shop_order_lines_backordered_idx
  on shop_order_lines (variant_id)
  where backordered_quantity > 0;

-- ── Order creation, now backorder-aware ─────────────────────────────────
-- Same signature as in 0025, so this replaces it.
create or replace function public.create_shop_order(
  p_lines         jsonb,
  p_already_taken boolean default false,
  p_notes         text default null
)
returns shop_orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid       uuid := auth.uid();
  v_status    text;
  v_order     shop_orders;
  v_line      record;
  v_stock     int;
  v_price     int;
  v_active    boolean;
  v_allow     boolean;
  v_take      int;
  v_back      int;
  v_total     int := 0;
  v_any_back  boolean := false;
begin
  if v_uid is null then
    raise exception 'No autenticat';
  end if;

  select member_status::text into v_status from profiles where id = v_uid;
  if v_status is null or v_status = 'inactive' then
    raise exception 'Compte no actiu';
  end if;

  if public.shop_member_blocked(v_uid) then
    raise exception 'No pots fer comandes fins que no regularitzis els pagaments pendents';
  end if;

  if p_lines is null
     or jsonb_typeof(p_lines) <> 'array'
     or jsonb_array_length(p_lines) = 0
     or jsonb_array_length(p_lines) > 50 then
    raise exception 'Comanda buida o no vàlida';
  end if;

  insert into shop_orders (member_id, notes, delivery_status, delivered_at)
  values (
    v_uid,
    nullif(btrim(p_notes), ''),
    case when p_already_taken then 'delivered'::shop_delivery_status
         else 'pending'::shop_delivery_status end,
    case when p_already_taken then now() else null end
  )
  returning * into v_order;

  for v_line in
    select (l ->> 'variant_id')::uuid as variant_id,
           sum((l ->> 'quantity')::int) as quantity
      from jsonb_array_elements(p_lines) l
     group by 1
     order by 1
  loop
    if v_line.quantity < 1 or v_line.quantity > 99 then
      raise exception 'Quantitat no vàlida';
    end if;

    select v.stock, i.price_cents, i.active, i.allow_backorder
      into v_stock, v_price, v_active, v_allow
      from shop_item_variants v
      join shop_items i on i.id = v.item_id
     where v.id = v_line.variant_id
       for update of v;

    if not found or not v_active then
      raise exception 'Article no disponible';
    end if;

    -- Reserve what we have; the rest waits for restock (if the item allows it).
    v_take := least(v_stock, v_line.quantity);
    v_back := v_line.quantity - v_take;
    if v_back > 0 and not v_allow then
      raise exception 'No hi ha prou estoc';
    end if;
    if v_back > 0 then
      v_any_back := true;
    end if;

    update shop_item_variants
       set stock = stock - v_take
     where id = v_line.variant_id;

    insert into shop_order_lines (order_id, variant_id, quantity, unit_price_cents, backordered_quantity)
    values (v_order.id, v_line.variant_id, v_line.quantity, v_price, v_back);

    v_total := v_total + v_price * v_line.quantity;
  end loop;

  -- Pieces still to arrive can't have been taken from the warehouse.
  update shop_orders
     set total_cents     = v_total,
         delivery_status = case when v_any_back then 'pending'::shop_delivery_status else delivery_status end,
         delivered_at    = case when v_any_back then null else delivered_at end
   where id = v_order.id
   returning * into v_order;

  return v_order;
end;
$$;

revoke all on function public.create_shop_order(jsonb, boolean, text) from public;
grant execute on function public.create_shop_order(jsonb, boolean, text) to authenticated;

-- ── Restock (board only) ────────────────────────────────────────────────
-- Adds p_quantity units to a variant (0 is allowed: use it after editing the
-- stock by hand), then assigns the free stock to pending order lines, oldest
-- order first. Whatever is left stays as free stock.
create or replace function public.restock_shop_variant(p_variant_id uuid, p_quantity int default 0)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_stock int;
  v_line  record;
  v_take  int;
begin
  if not public.is_admin() then
    raise exception 'No autoritzat';
  end if;
  if p_quantity is null or p_quantity < 0 then
    raise exception 'Quantitat no vàlida';
  end if;

  select stock into v_stock
    from shop_item_variants
   where id = p_variant_id
     for update;
  if not found then
    raise exception 'Article no disponible';
  end if;

  v_stock := v_stock + p_quantity;

  for v_line in
    select l.id, l.backordered_quantity
      from shop_order_lines l
      join shop_orders o on o.id = l.order_id
     where l.variant_id = p_variant_id
       and l.backordered_quantity > 0
     order by o.created_at, o.order_number
       for update of l
  loop
    exit when v_stock <= 0;
    v_take := least(v_stock, v_line.backordered_quantity);
    update shop_order_lines
       set backordered_quantity = backordered_quantity - v_take
     where id = v_line.id;
    v_stock := v_stock - v_take;
  end loop;

  update shop_item_variants set stock = v_stock where id = p_variant_id;
end;
$$;

revoke all on function public.restock_shop_variant(uuid, int) from public;
grant execute on function public.restock_shop_variant(uuid, int) to authenticated;

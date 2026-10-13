-- ════════════════════════════════════════════════════════════════════════
-- Botiga: clothing shop for members.
--
-- No payment gateway: members pay by bank transfer and the board confirms it
-- by hand. Delivery and payment are INDEPENDENT states (a member can take a
-- garment now and pay later, or pay first and collect later).
--
-- Orders are never cancelled or deleted from the app, so stock is only ever
-- decremented (atomically, in create_shop_order).
--
-- Members can only READ their own orders. They have no insert/update/delete
-- policy at all: orders are created exclusively through create_shop_order()
-- (SECURITY DEFINER), so a member cannot forge a price, mark an order as paid
-- or delivered, or read anyone else's orders.
-- ════════════════════════════════════════════════════════════════════════

create type shop_delivery_status as enum ('pending', 'delivered');
create type shop_payment_status  as enum ('unpaid', 'paid');

-- ── Catalogue ───────────────────────────────────────────────────────────
create table shop_items (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (length(btrim(name)) > 0),
  description text,
  price_cents int  not null check (price_cents >= 0),
  image_url   text,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

create table shop_item_variants (
  id      uuid primary key default gen_random_uuid(),
  item_id uuid not null references shop_items (id) on delete cascade,
  size    text not null check (length(btrim(size)) > 0),  -- "S", "M", "L", "única"…
  stock   int  not null default 0 check (stock >= 0),
  unique (item_id, size)
);

create index shop_item_variants_item_idx on shop_item_variants (item_id);

-- ── Orders ──────────────────────────────────────────────────────────────
create table shop_orders (
  id              uuid primary key default gen_random_uuid(),
  -- Human-readable sequential number: 42 → transfer concept "DIABLES-0042".
  order_number    bigint generated always as identity unique,
  member_id       uuid not null references profiles (id) on delete cascade,
  total_cents     int  not null default 0 check (total_cents >= 0),
  delivery_status shop_delivery_status not null default 'pending',
  payment_status  shop_payment_status  not null default 'unpaid',
  delivered_at    timestamptz,
  paid_at         timestamptz,
  payment_method  text check (payment_method in ('transfer', 'cash', 'other')),
  notes           text,
  created_at      timestamptz not null default now(),
  -- Keep dates / method consistent with the two states.
  constraint shop_orders_delivered_at_chk
    check ((delivery_status = 'delivered') = (delivered_at is not null)),
  constraint shop_orders_paid_chk
    check ((payment_status = 'paid') = (paid_at is not null and payment_method is not null))
);

create index shop_orders_member_idx on shop_orders (member_id);
create index shop_orders_created_idx on shop_orders (created_at desc);

create table shop_order_lines (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid not null references shop_orders (id) on delete cascade,
  variant_id      uuid not null references shop_item_variants (id) on delete restrict,
  quantity        int  not null check (quantity between 1 and 99),
  -- Price copied at order time, so later price changes don't rewrite history.
  unit_price_cents int not null check (unit_price_cents >= 0)
);

create index shop_order_lines_order_idx on shop_order_lines (order_id);
create index shop_order_lines_variant_idx on shop_order_lines (variant_id);

-- ── RLS ─────────────────────────────────────────────────────────────────
alter table shop_items          enable row level security;
alter table shop_item_variants  enable row level security;
alter table shop_orders         enable row level security;
alter table shop_order_lines    enable row level security;

-- True when the caller has ordered this item. Lets a member keep seeing the
-- name of something they bought after the board deactivates it. SECURITY
-- DEFINER (reads order tables without their RLS) to avoid policy recursion
-- between shop_items, shop_item_variants and shop_order_lines.
create or replace function public.shop_has_ordered_item(p_item_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
      from shop_order_lines l
      join shop_orders o on o.id = l.order_id
      join shop_item_variants v on v.id = l.variant_id
     where o.member_id = auth.uid()
       and v.item_id = p_item_id
  );
$$;

revoke all on function public.shop_has_ordered_item(uuid) from public;
grant execute on function public.shop_has_ordered_item(uuid) to authenticated;

-- Catalogue: members see active items (plus inactive ones they already
-- ordered, for their order history — the app lists only active ones in the
-- shop); the board manages everything.
create policy shop_items_select
  on shop_items for select
  to authenticated
  using (active or public.is_admin() or public.shop_has_ordered_item(id));

create policy shop_items_admin_write
  on shop_items for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- A variant is visible exactly when its item is (RLS on shop_items applies).
create policy shop_item_variants_select
  on shop_item_variants for select
  to authenticated
  using (exists (select 1 from shop_items i where i.id = item_id));

create policy shop_item_variants_admin_write
  on shop_item_variants for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Orders: a member reads only their own; the board reads and edits all.
-- Deliberately NO insert/update/delete policy for members.
create policy shop_orders_select_own_or_admin
  on shop_orders for select
  to authenticated
  using (member_id = auth.uid() or public.is_admin());

create policy shop_orders_admin_write
  on shop_orders for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy shop_order_lines_select_own_or_admin
  on shop_order_lines for select
  to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from shop_orders o
       where o.id = order_id and o.member_id = auth.uid()
    )
  );

create policy shop_order_lines_admin_write
  on shop_order_lines for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ── Debtor block (prepared, DISABLED) ───────────────────────────────────
-- create_shop_order() refuses members for whom this returns true. It always
-- returns false for now; replace the body to enable blocking of members with
-- unpaid orders.
create or replace function public.shop_member_blocked(p_member_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select false;
$$;

revoke all on function public.shop_member_blocked(uuid) from public;
grant execute on function public.shop_member_blocked(uuid) to authenticated;

-- ── Atomic order creation ───────────────────────────────────────────────
-- p_lines: [{ "variant_id": "<uuid>", "quantity": <int> }, …]
-- Locks every variant row (in id order, to avoid deadlocks), validates that the
-- item is active and stock is enough, decrements stock, copies the price from
-- the catalogue (never from the client) and creates the order — all in one
-- transaction, so a failure leaves stock untouched.
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
  v_uid     uuid := auth.uid();
  v_status  text;
  v_order   shop_orders;
  v_line    record;
  v_stock   int;
  v_price   int;
  v_active  boolean;
  v_total   int := 0;
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

    select v.stock, i.price_cents, i.active
      into v_stock, v_price, v_active
      from shop_item_variants v
      join shop_items i on i.id = v.item_id
     where v.id = v_line.variant_id
       for update of v;

    if not found or not v_active then
      raise exception 'Article no disponible';
    end if;

    if v_stock < v_line.quantity then
      raise exception 'No hi ha prou estoc';
    end if;

    update shop_item_variants
       set stock = stock - v_line.quantity
     where id = v_line.variant_id;

    insert into shop_order_lines (order_id, variant_id, quantity, unit_price_cents)
    values (v_order.id, v_line.variant_id, v_line.quantity, v_price);

    v_total := v_total + v_price * v_line.quantity;
  end loop;

  update shop_orders set total_cents = v_total
   where id = v_order.id
   returning * into v_order;

  return v_order;
end;
$$;

revoke all on function public.create_shop_order(jsonb, boolean, text) from public;
grant execute on function public.create_shop_order(jsonb, boolean, text) to authenticated;

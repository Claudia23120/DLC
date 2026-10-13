-- Manual check of the 0025 shop RLS. Run in the Supabase SQL editor AFTER
-- applying 0025_shop.sql. Everything runs inside a transaction that is rolled
-- back, so no data is left behind.
--
-- Replace the two UUIDs below with a NORMAL member's id and ANOTHER member's id
-- (from public.profiles). The "other" member just needs to exist.

begin;

do $$
declare
  me     uuid := '00000000-0000-0000-0000-000000000001';  -- ← normal member
  other  uuid := '00000000-0000-0000-0000-000000000002';  -- ← another member
  item   uuid;
  var_id uuid;
  my_order shop_orders;
  n int;
begin
  -- Seed as superuser (bypasses RLS).
  insert into shop_items (name, price_cents) values ('Test', 1500) returning id into item;
  insert into shop_item_variants (item_id, size, stock) values (item, 'M', 3) returning id into var_id;
  insert into shop_orders (member_id, total_cents) values (other, 1500);

  -- Act as the normal member.
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', me, 'role', 'authenticated')::text, true);

  -- 1. Cannot read someone else's orders.
  select count(*) into n from shop_orders where member_id = other;
  assert n = 0, 'FAIL: member can read another member''s order';

  -- 2. Cannot insert an order directly (no insert policy).
  begin
    insert into shop_orders (member_id, total_cents) values (me, 0);
    raise exception 'FAIL: member inserted an order directly';
  exception when insufficient_privilege or others then
    if sqlerrm like 'FAIL%' then raise; end if;
  end;

  -- 3. Order through the RPC works and decrements stock.
  my_order := create_shop_order(
    jsonb_build_array(jsonb_build_object('variant_id', var_id, 'quantity', 2)), false, null);
  assert my_order.total_cents = 3000, 'FAIL: wrong total';
  assert my_order.payment_status = 'unpaid', 'FAIL: new order should be unpaid';

  -- 4. Cannot mark own order as paid / delivered (update silently affects 0 rows).
  update shop_orders
     set payment_status = 'paid', paid_at = now(), payment_method = 'transfer'
   where id = my_order.id;
  get diagnostics n = row_count;
  assert n = 0, 'FAIL: member updated payment_status';

  update shop_orders set delivery_status = 'delivered', delivered_at = now()
   where id = my_order.id;
  get diagnostics n = row_count;
  assert n = 0, 'FAIL: member updated delivery_status';

  -- 5. Cannot delete own order.
  delete from shop_orders where id = my_order.id;
  get diagnostics n = row_count;
  assert n = 0, 'FAIL: member deleted an order';

  -- 6. Cannot edit stock or price.
  update shop_item_variants set stock = 999 where id = var_id;
  get diagnostics n = row_count;
  assert n = 0, 'FAIL: member edited stock';
  update shop_items set price_cents = 0 where id = item;
  get diagnostics n = row_count;
  assert n = 0, 'FAIL: member edited a price';

  -- 7. Stock is enforced (1 left, ask for 2).
  begin
    perform create_shop_order(
      jsonb_build_array(jsonb_build_object('variant_id', var_id, 'quantity', 2)), false, null);
    raise exception 'FAIL: oversold stock';
  exception when others then
    if sqlerrm like 'FAIL%' then raise; end if;
  end;

  raise notice 'OK: all shop RLS checks passed';
end;
$$;

rollback;

-- ── Backorders (needs 0026_shop_backorders.sql) ─────────────────────────
-- Same two placeholders as above, plus the id of a BOARD member (needed because
-- restock_shop_variant is admin-only). Also rolled back.
begin;

do $$
declare
  me     uuid := '00000000-0000-0000-0000-000000000001';  -- ← normal member
  other  uuid := '00000000-0000-0000-0000-000000000002';  -- ← another member
  board  uuid := '00000000-0000-0000-0000-0000000000aa';  -- ← a board member (is_admin)
  item   uuid;
  var_id uuid;
  o1     shop_orders;
  o2     shop_orders;
  back1 int;
  back2 int;
  stock_now int;
begin
  insert into shop_items (name, price_cents, allow_backorder) values ('Test', 1000, true) returning id into item;
  insert into shop_item_variants (item_id, size, stock) values (item, 'M', 1) returning id into var_id;

  -- Member orders 3 with only 1 in stock, claiming they already took it.
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', me, 'role', 'authenticated')::text, true);
  o1 := create_shop_order(jsonb_build_array(jsonb_build_object('variant_id', var_id, 'quantity', 3)), true, null);

  select backordered_quantity into back1 from shop_order_lines where order_id = o1.id;
  assert back1 = 2, 'FAIL: expected 2 units backordered';
  assert o1.delivery_status = 'pending', 'FAIL: order with backordered units must not be delivered';
  select stock into stock_now from shop_item_variants where id = var_id;
  assert stock_now = 0, 'FAIL: available unit should have been reserved';

  -- A second member's order is backordered entirely, and queued behind the first.
  perform set_config('request.jwt.claims', json_build_object('sub', other, 'role', 'authenticated')::text, true);
  o2 := create_shop_order(jsonb_build_array(jsonb_build_object('variant_id', var_id, 'quantity', 2)), false, null);

  -- A member cannot restock.
  perform set_config('request.jwt.claims', json_build_object('sub', me, 'role', 'authenticated')::text, true);
  begin
    perform restock_shop_variant(var_id, 5);
    raise exception 'FAIL: member restocked';
  exception when others then
    if sqlerrm like 'FAIL%' then raise; end if;
  end;

  -- The board restocks 3 units: they go to the oldest pending order first.
  perform set_config('request.jwt.claims', json_build_object('sub', board, 'role', 'authenticated')::text, true);
  perform restock_shop_variant(var_id, 3);

  select backordered_quantity into back1 from shop_order_lines where order_id = o1.id;
  select backordered_quantity into back2 from shop_order_lines where order_id = o2.id;
  select stock into stock_now from shop_item_variants where id = var_id;
  assert back1 = 0, 'FAIL: oldest order should be covered first';
  assert back2 = 1, 'FAIL: next order should get the remaining unit';
  assert stock_now = 0, 'FAIL: no free stock should remain';

  raise notice 'OK: backorder checks passed';
end;
$$;

rollback;

-- ── Partial payment (needs 0027_shop_partial_payment.sql) ───────────────
-- Same three placeholders as the backorder block. Also rolled back.
begin;

do $$
declare
  me     uuid := '00000000-0000-0000-0000-000000000001';  -- ← normal member
  board  uuid := '00000000-0000-0000-0000-0000000000aa';  -- ← a board member (is_admin)
  item   uuid;
  var_id uuid;
  o      shop_orders;
  r      shop_orders;
begin
  insert into shop_items (name, price_cents, allow_backorder) values ('Test', 1000, true) returning id into item;
  insert into shop_item_variants (item_id, size, stock) values (item, 'M', 1) returning id into var_id;

  -- Member orders 3, only 1 in stock: total 3000, covered 1000.
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', me, 'role', 'authenticated')::text, true);
  o := create_shop_order(jsonb_build_array(jsonb_build_object('variant_id', var_id, 'quantity', 3)), false, null);
  assert o.total_cents = 3000, 'FAIL: wrong total';

  -- A member cannot mark an order paid.
  begin
    perform mark_shop_order_paid(o.id, 'transfer');
    raise exception 'FAIL: member marked an order paid';
  exception when others then
    if sqlerrm like 'FAIL%' then raise; end if;
  end;

  -- The board records the payment: only the covered 1000, so still not fully paid.
  perform set_config('request.jwt.claims', json_build_object('sub', board, 'role', 'authenticated')::text, true);
  perform mark_shop_order_paid(o.id, 'transfer');
  select * into r from shop_orders where id = o.id;
  assert r.paid_cents = 1000, 'FAIL: should record only the units covered by stock';
  assert r.payment_status = 'unpaid', 'FAIL: not fully paid yet, must stay unpaid';

  -- Nothing more to collect until stock arrives.
  begin
    perform mark_shop_order_paid(o.id, 'transfer');
    raise exception 'FAIL: charged units that are still pending restock';
  exception when others then
    if sqlerrm like 'FAIL%' then raise; end if;
  end;

  -- Stock arrives (2 units): the rest becomes payable and paying settles the order.
  perform restock_shop_variant(var_id, 2);
  perform mark_shop_order_paid(o.id, 'cash');
  select * into r from shop_orders where id = o.id;
  assert r.paid_cents = 3000, 'FAIL: should now be fully paid';
  assert r.payment_status = 'paid', 'FAIL: fully paid order must be marked paid';

  raise notice 'OK: partial payment checks passed';
end;
$$;

rollback;

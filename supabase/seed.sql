-- ════════════════════════════════════════════════════════════════════════
-- Bootstrap the FIRST admin (chicken-and-egg: no public sign-up and only
-- admins can create members, so the very first board member is seeded by hand).
--
-- HOW TO USE
-- 1) Create the auth user first (one of):
--      • Supabase Dashboard → Authentication → Add user → set email + password
--      • or the Admin API / `supabase` CLI
--    The on_auth_user_created trigger creates a matching profiles row.
-- 2) Replace the email below with that user's email and run this file
--    (Dashboard → SQL editor, or `supabase db execute`).
-- 3) Giving a board_position makes the member an admin (is_admin is derived).
-- ════════════════════════════════════════════════════════════════════════

update public.profiles
set
  board_position = 'presidenta',
  full_name      = coalesce(nullif(full_name, ''), 'Administradora'),
  member_roles   = '{diable}'
where email = 'CANVIA_AQUEST_CORREU@diableslescorts.cat';

-- Verify:
-- select id, email, full_name, board_position, is_admin from public.profiles;

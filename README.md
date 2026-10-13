# Colla de Diables de les Corts — intranet

Private management intranet for the Colla de Diables de les Corts: **bolos**
(performances), **reunions** (meetings) and **votacions** (polls), with member
profiles and email notifications.

- **Stack:** Next.js (App Router, TypeScript) · Supabase (Postgres + Auth +
  Storage) · Resend (email) · Tailwind CSS v4 · Docker.
- **Language:** the interface is in **Catalan**; the code is in **English**.
  All UI text lives in `src/i18n/ca.ts` — no Catalan strings in logic.
- **Access:** private. Every page requires login. No public sign-up — only
  admins (junta) create member accounts.

## Roles

- **admin** — a member with a board position (`board_position`: presidenta,
  vicepresidenta, secretària, tresorera, cap de foc, cap de tabals). Can
  create/edit/delete bolos, reunions and votacions, and manage members.
- **normal** — any other member. Can join/leave events, vote, comment and edit
  their own profile only.

Permissions are enforced with **Row Level Security in Postgres** (see
`supabase/migrations/0003_rls_policies.sql`), not just in the UI.

---

## Requirements

- **Docker** (with the Compose plugin). Nothing else needs to be installed
  locally to run the app.
- A **Supabase** cloud project.
- Optionally a **Resend** account for email notifications.

---

## 1. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

| Variable | Where to find it |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → service_role (**server only**) |
| `EMAILS_ENABLED` | `false` until a Resend sending domain is verified |
| `RESEND_API_KEY` | Resend → API Keys |
| `EMAIL_FROM` / `EMAIL_REPLY_TO` | Sender shown to members |
| `NEXT_PUBLIC_SITE_URL` | e.g. `http://localhost:3000` |

Secrets never live in the code — only in `.env.local` (git-ignored).

## 2. Set up the database

Apply every file in `supabase/migrations/` **in filename order** (Supabase
Dashboard → SQL editor, or the Supabase CLI):

1. `0001_core_schema.sql` — tables and enums
2. `0002_functions_triggers.sql` — `is_admin()`, guards, new-user trigger
3. `0003_rls_policies.sql` — Row Level Security
4. `0004_event_counts_view.sql` — per-event count view for the agenda cards
5. `0005_profile_guard_service_role.sql` — let server code manage member roles
6. `0006` … `0021` — later features (polls, songs, event options, badges, …)
7. `0022_hide_private_profile_columns.sql` — hides NIF + emergency contact
   from other members (column privileges + `get_member_private()`)
8. `0023_atomic_vote_and_option_rpcs.sql` — `cast_vote` and
   `set_option_selections`, used by the vote / option server actions
9. `0025_shop.sql` — the **botiga** (club clothing shop): `shop_items`,
   `shop_item_variants`, `shop_orders`, `shop_order_lines`, their RLS, and the
   `create_shop_order` RPC (see [Botiga](#5-botiga-club-shop))
10. `0026_shop_backorders.sql` — orders for out-of-stock items ("pendent de
    reposició") and the `restock_shop_variant` RPC; apply it **after** `0025`
11. `0027_shop_partial_payment.sql` — `paid_cents` and `mark_shop_order_paid`:
    members only pay for what is in stock; apply it **after** `0026`

> Apply `0022` and `0023` **before** deploying this version of the app: the
> app reads the profile with an explicit column list (`PROFILE_COLUMNS`) and
> votes through `cast_vote`. After `0022`, `select *` on `profiles` fails for
> logged-in users; when you add a column members should read, also run
> `grant select (new_column) on public.profiles to authenticated;` and add it
> to `src/lib/data/profile-columns.ts`.

Then create the **first admin** (chicken-and-egg bootstrap):

1. Supabase → Authentication → **Add user** (set email + password).
2. Edit `supabase/seed.sql`, put that email in, and run it. This gives the
   member a `board_position`, which makes them an admin.

From then on, admins create the rest of the members inside the app.

## 3. Run with Docker (Makefile)

```bash
make build    # build the Docker image
make start    # start the app  → http://localhost:3000
make stop     # stop the app
make logs     # follow logs
make restart  # stop + start
make clean    # remove containers/images/volumes for this project
```

`make dev` runs the dev server (live reload) inside the container.
Run `make help` to list all targets.

> The database is Supabase in the cloud, so `docker-compose.yml` runs only the
> Next.js app — no Postgres container. For fully offline development you can run
> a local Supabase stack with the Supabase CLI (`supabase start`) and point the
> env vars at it.

## 4. Email notifications (Resend)

When an admin creates a bolo, reunió or votació, all members get an email.

Sending to every member requires a **verified domain** in Resend (add the DNS
records Resend gives you for `diableslescorts.cat`). Until then, keep
`EMAILS_ENABLED=false`: the app logs what it *would* send and works normally.
Once the domain is verified, set `EMAILS_ENABLED=true` — no code changes.

## 5. Botiga (club shop)

Members order club clothing from **La colla → Botiga** (`/colla/botiga`). There
is no payment gateway: payment is **bank transfer only** and the board confirms
it by hand.

- **Delivery and payment are independent.** A member can take a garment from the
  warehouse and pay later (the "Ja l'he agafat del magatzem" toggle creates the
  order as delivered), or pay first and collect later. The board's tab shows
  what was ordered, delivered and paid at all times.
- **Transfer concept:** every order gets a unique concept, `DIABLES-0042 <name>`,
  shown on the confirmation screen, in "Les meves comandes" while unpaid, and in
  the emails. The IBAN is the club account shown in *La colla*
  (`src/content/colla.ts`) — change it there.
- **Out-of-stock items ("pendent de reposició").** If an item has
  *Admet comandes sense estoc* on (default), members can still order a size with
  no or too little stock. `create_shop_order` reserves what exists and records
  the rest on the line (`backordered_quantity`). Such an order is always pending
  delivery (the "Ja l'he agafat" toggle is ignored and the board can't mark it
  delivered) until every line is covered. The **Junta → Botiga → Reposició**
  view lists how many units of each size are still needed; when the board books
  received units (`restock_shop_variant`), they go first to the **oldest**
  pending orders and any surplus becomes free stock. Stock typed by hand in the
  catalogue editor is assigned the same way. **Pending pieces are not paid until they
  arrive:** an order tracks `paid_cents`, the member pays only what is covered by
  stock (`due now = covered − paid`), and "Marca pagada" records exactly that
  amount. When stock arrives, the amount due grows and the order reappears under
  *Pendents de cobrar*; the debt per member, the reminders and the emails use
  the amount due, not the order total. Members are not emailed when their
  pending pieces arrive.
- **Orders are not cancelled or deleted from the app.** Stock is only
  decremented, atomically, inside `create_shop_order`.
- **Security (RLS):** members can read active items and **only their own
  orders**; they have no insert/update/delete policy on orders, so they can't
  forge prices or mark an order paid/delivered. Orders are created only through
  `create_shop_order` (SECURITY DEFINER), which takes the price from the
  catalogue and checks stock under a row lock. The board (admins) can manage
  everything. `supabase/scripts/verify_shop_rls.sql` checks all of this; run it
  in the SQL editor after applying the migration (it rolls back).
- **Debtor block:** `shop_member_blocked()` is prepared but always returns
  `false`. Change its body to start refusing orders from members with unpaid
  ones.
- **Emails** (respect `EMAILS_ENABLED`): when an order is placed, one to the
  member (summary + transfer details) and one to the board. The board can also
  send payment reminders by hand (per member or to everyone) from the
  **Junta → Botiga** tab. There is no cron.
- **Junta → Botiga tab:** orders with quick filters (*Pendents d'entregar*,
  *Pendents de cobrar* — includes taken-but-unpaid —, *Tancades*), search by
  member or order number, one-click "mark paid" (date + method) and "mark
  delivered" (both can be undone), debt per member and total pending, catalogue
  management (items, sizes, stock, activate/deactivate) and a CSV export
  (`/api/admin/shop/orders/csv`).

---

## Local development without Docker

```bash
npm install
npm run dev        # http://localhost:3000
npm run typecheck  # type check
npm run lint       # ESLint (next/core-web-vitals + TypeScript)
npm test           # unit tests (Vitest)
npm run build      # production build
```

## Project structure

```
src/
  app/                 App Router routes
    (auth)/login/      login screen + auth actions
    (app)/             authenticated area (guarded by layout + middleware)
      bolos/  reunions/  colla/  colla/botiga/  membres/  musica/  foc/  perfil/
    api/               route handlers (.ics, notifications)
  components/
    ui/                generic reusable components (Button, Card, Tag, …)
    layout/            AppShell, TopNav, BottomTabBar, PageHeader
    bolos/ meetings/ polls/ members/ shop/   feature components
  lib/
    supabase/          browser / server / admin / middleware clients
    auth/              session + role helpers
    email/             Resend wrapper + templates
    calendar/          .ics + Google Calendar helpers
    utils/
  i18n/                ca.ts (all Catalan UI text) + t helper
  types/               database types
supabase/
  migrations/          schema + RLS
  seed.sql             first-admin bootstrap
```

## Deployment (Vercel)

Set the same environment variables in the Vercel project. Vercel builds the
Next.js app directly (the Dockerfile is for local/self-hosted use).

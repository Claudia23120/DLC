# Colla de Diables de les Corts — intranet

Private management intranet for the Colla de Diables de les Corts: **bolos**
(performances), **reunions** (meetings), **votacions** (polls) and
**comissions** (yearly working groups), with member profiles, a repertoire of
songs, fire-sheet (foc) tools and email notifications.

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
| `SITE_URL` | Public base URL for links in emails / `.ics` files, e.g. `http://localhost:3005` |

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
9. `0024` … `0025` — quota installments and member status tweaks
10. `0026_commissions.sql` — comissions and their members
11. `0027_duplicate_commissions.sql` — `duplicate_commissions()`, the junta's
    "duplicate for next year" button
12. `0028_remove_commissions_autoseed.sql` — drops the automatic yearly copy
    of commissions (`ensure_commissions_for_year`, `commission_years`)

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

Everything runs through Docker — no local Node install is needed.

```bash
make build      # build the Docker image
make start      # start the production build  → http://localhost:3005
make stop       # stop the app
make restart    # stop + start
make logs       # follow logs
make shell      # open a shell in the running container
make clean      # remove containers/images/volumes for this project

make dev        # stop prod and run the dev server with live reload (port 3005)
make typecheck  # TypeScript type check
make lint       # ESLint
make test       # unit tests (Vitest)
make check      # typecheck + lint + tests
```

`make dev` reads `.env.local` and mounts the project in a Node 22 container.
Run `make help` to list the main targets.

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

---

## Local development without Docker

Requires Node 22.12+.

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
    (auth)/            login, forgot / reset password
    (app)/             authenticated area (guarded by layout + middleware)
      bolos/  reunions/  colla/  membres/  musica/  foc/  perfil/  junta/
    auth/              email confirm / verify routes
    api/               route handlers (.ics, member CSV export)
  components/
    ui/                generic reusable components (Card, Tag, Modal, …)
    layout/            AppShell, TopNav, BottomTabBar, PageHeader
    bolos/ commissions/ junta/ members/ musica/ polls/   feature components
  content/             static texts (colla info, foc, music)
  lib/
    supabase/          browser / server / admin / middleware clients
    auth/              session + role helpers
    data/              Supabase queries per feature
    domain/            pure business logic (unit-tested)
    email/             Resend wrapper + templates
    calendar/          .ics + Google Calendar helpers
    hooks/  utils/
  i18n/                ca.ts (all Catalan UI text) + t helper
  types/               database types
supabase/
  migrations/          schema + RLS, one file per change
  schema.sql           all migrations concatenated
  seed.sql             first-admin bootstrap
```

## Deployment (Vercel)

Set the same environment variables in the Vercel project. Vercel builds the
Next.js app directly (the Dockerfile is for local/self-hosted use).

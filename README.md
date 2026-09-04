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

---

## Local development without Docker

```bash
npm install
npm run dev        # http://localhost:3000
npm run typecheck  # type check
npm run build      # production build
```

## Project structure

```
src/
  app/                 App Router routes
    (auth)/login/      login screen + auth actions
    (app)/             authenticated area (guarded by layout + middleware)
      bolos/  reunions/  colla/  membres/  musica/  foc/  perfil/
    api/               route handlers (.ics, notifications)
  components/
    ui/                generic reusable components (Button, Card, Tag, …)
    layout/            AppShell, TopNav, BottomTabBar, PageHeader
    bolos/ meetings/ polls/ members/   feature components
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

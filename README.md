# mateushr-portfolio

Personal portfolio for Mateus HR, targeting full-time CLT opportunities. Listings of public GitHub repos are auto-synced daily by a Claude Scheduled Agent and curated through a protected admin area.

## Stack

- **Next.js 16** — App Router, TypeScript strict, Tailwind v4
- **Supabase** — Postgres + Auth + RLS (backend-as-a-service)
- **Vercel** — hosting + edge runtime
- **Docker** — local dev only (Supabase CLI)
- **Claude Scheduled Agent** — daily cron that pulls new public repos from `mateushr23`, generates a PT-BR description, and upserts into Supabase

## Getting started

```bash
npm install
cp .env.example .env.local
# fill in the Supabase + Anthropic keys
npm run dev
```

Open http://localhost:3000.

## Structure

- `src/app/` — routes (App Router)
- `src/components/` — UI primitives and composed components
- `src/lib/supabase/` — Supabase client helpers
- `handoffs/` — per-stage artifacts from the multi-agent workflow

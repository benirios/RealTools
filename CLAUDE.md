# RealTools

CRE deal management SaaS. One Deal Hub per property. Broker creates deal → generates OM → sends to buyers → tracks opens.

## Stack

- Next.js 15 (App Router) + TypeScript
- Supabase (Auth + Postgres + Storage) — use `@supabase/ssr`, NEVER `@supabase/auth-helpers-nextjs`
- TailwindCSS + shadcn/ui
- Resend (email)
- Vercel (hosting)

## Critical Rules

- Server-side auth: always `getUser()`, NEVER `getSession()` — silent security hole
- Middleware matcher: explicitly exclude `/om/*` and `/api/track/*` from auth
- Service role key: server-only modules only, NEVER `NEXT_PUBLIC_*`
- RLS: every table gets RLS + policy in the same migration, no exceptions
- OM tracking: URL-based (`?ref=[token]`) is PRIMARY signal; pixel is secondary
- No Zustand/Redux — server components + server actions + `revalidatePath` only

## GSD Workflow

This project uses the GSD planning system. Planning artifacts live in `.planning/`.

- `/gsd-progress` — check current phase status
- `/gsd-discuss-phase N` — discuss phase N before planning
- `/gsd-plan-phase N` — create execution plan for phase N
- `/gsd-execute-phase N` — execute phase N plans
- `/gsd-verify-work` — verify phase deliverables

Always read `.planning/STATE.md` at session start for current context.

## Knowledge Graph (RAG)

`graphify-out/` holds a persistent knowledge graph of this codebase.

- `graphify-out/graph.json` — queryable graph (nodes, edges, communities)
- `graphify-out/GRAPH_REPORT.md` — god nodes, surprising connections, suggested questions
- `graphify-out/graph.html` — interactive visualization (open in browser)

**When to use:** before touching unfamiliar modules, tracing dependencies, or answering "what connects to X?" questions, run `/graphify query "<question>"` against the graph instead of grepping cold.

**Keep it fresh:** after adding significant new files, run `/graphify . --update` to merge them in.

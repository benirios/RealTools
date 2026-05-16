# Retrospective

## Milestone: v1.0 — milestone

**Shipped:** 2026-05-01
**Phases:** 3 | **Plans:** 13

### What Was Built

- Secure foundation with Supabase auth, typed clients, middleware, RLS schema, and app shell.
- Deal Hub with deal CRUD, notes, files, signed downloads, and public OM pages.
- Buyers CRM with tags and modal CRUD.
- Resend-backed Send OM flow with per-buyer tracked links.
- OM open tracking with URL primary signal and pixel fallback.
- Deal Hub activity log with send/open/note/file events.

### What Worked

- Phase decomposition kept the dependency chain clear: foundation → Deal Hub → buyer engagement.
- Plan summaries were enough to resume Phase 3 without restarting earlier work.
- TypeScript, lint, and production build caught integration issues cheaply.
- Code review found a real idempotency race in OM open tracking before close.

### What Was Inefficient

- ROADMAP and REQUIREMENTS state drifted behind actual phase summaries and needed cleanup at close.
- The parent git root is `/Users/beni/Dev`, which caused worktree and build-root warnings.
- Some GSD SDK generated text retained placeholder values such as `--phase` in STATE before cleanup.

### Patterns Established

- Use `server-only` modules for service-role clients and external provider singletons.
- Keep public OM and tracking routes independent of cookie-based Supabase server clients.
- Use conditional updates for first-event idempotency when multiple tracking paths can fire.
- Treat activity backfill as best-effort telemetry after primary user writes succeed.

### Key Lessons

- Live provider flows should remain `human_needed` until tested with real credentials and browser behavior.
- Summary frontmatter should be kept clean because later automation relies on it for accomplishments and review scope.
- Multi-project parent repos need explicit Next.js tracing root or a cleaner project-level git root before deployment hardening.

### Cost Observations

- Model mix: not measured.
- Sessions: multiple GSD sessions across planning, execution, and close.
- Notable: Inline execution was more reliable than worktree isolation in this parent-repo workspace.

## Cross-Milestone Trends

| Trend | Evidence | Action |
|-------|----------|--------|
| Planning artifacts can drift from code reality | ROADMAP/REQUIREMENTS lagged completed summaries | Prefer manager/progress checks after each phase |
| Parent workspace shape affects tooling | Next build inferred `/Users/beni` as root | Address in next milestone if deployment traces matter |

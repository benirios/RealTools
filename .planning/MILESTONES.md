# Milestones

## v1.0 milestone (Shipped: 2026-05-01)

**Phases completed:** 3 phases, 13 plans, 11 counted tasks

**What shipped:**

- Secure Next.js 15 App Router foundation with Supabase SSR clients, auth pages, middleware route protection, and RLS-backed database schema.
- Deal Hub workspace with deal CRUD, notes, file uploads/downloads through Supabase Storage, and public hosted OM pages.
- Buyers CRM with create/edit/delete, email/tag storage, modal flows, and table UI.
- Send OM workflow using Resend batch delivery, per-buyer `deal_buyers` tracking tokens, and unique `/om/[deal-id]?ref=[token]` links.
- URL-primary and pixel-secondary OM open tracking with idempotent first-open recording.
- Deal Hub activity timeline for `om_sent`, `om_opened`, `note_added`, and `file_uploaded` events.

**Known deferred items at close:** 2

- Phase 3 `03-HUMAN-UAT.md` remains `partial` with 4 pending live scenarios.
- Phase 3 `03-VERIFICATION.md` remains `human_needed` for live Resend/browser confirmation.

**Archives:**

- [v1.0-ROADMAP.md](milestones/v1.0-ROADMAP.md)
- [v1.0-REQUIREMENTS.md](milestones/v1.0-REQUIREMENTS.md)

---

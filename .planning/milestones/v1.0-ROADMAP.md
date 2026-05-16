# Roadmap: RealTools

## Overview

RealTools MVP delivers a three-phase dependency chain: secure foundation first, deal workspace second, buyer engagement and tracking third. Every phase is a prerequisite for the next — auth and schema unlock deal CRUD, deal CRUD unlocks the public OM page, and the OM page unlocks tracking. The result is a working end-to-end CRE deal management SaaS: broker signs up, creates deals, generates hosted OMs, sends to buyers, and sees who opened.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation** - Auth + complete DB schema with RLS + middleware with public route exclusions
- [ ] **Phase 2: Deal Hub** - Deal CRUD, notes, files, and public OM page
- [ ] **Phase 3: Buyers, Send, and Tracking** - Buyers CRM, send OM via Resend, per-buyer open tracking, activity log

## Phase Details

### Phase 1: Foundation
**Goal**: A secure, correctly-wired application shell exists — brokers can sign up, log in, and log out; the database schema is complete with RLS on every table; middleware correctly protects broker routes while leaving /om/* and /api/track/* open for unauthenticated access.
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, AUTH-03
**Success Criteria** (what must be TRUE):
  1. A new broker can create an account with email and password and is redirected to the dashboard on success
  2. A returning broker can log in and remain logged in across browser tab closes and page refreshes (session persists)
  3. A logged-in broker can log out from any page and is redirected to the login screen
  4. Visiting /om/[any-id] in a browser where no broker session exists does NOT redirect to login — the page renders (even if empty data) without auth interference
  5. All database tables (deals, notes, buyers, deal_buyers, activities, deal_files) exist in Supabase with RLS enabled and correct user-scoping policies
**Plans**: 4 plans
**UI hint**: yes

Plans:
- [x] 01-01-PLAN.md — Project scaffold + Supabase client factories
- [x] 01-02-PLAN.md — Database schema migrations (001/002/003)
- [x] 01-03-PLAN.md — Middleware + auth pages (login/signup/callback)
- [x] 01-04-PLAN.md — App shell (sidebar + route group layout + placeholder pages)

### Phase 2: Deal Hub
**Goal**: A broker has a complete deal workspace — they can create and manage deals, attach notes and files, and share a public hosted OM page with buyers, all within a single Deal Hub view per property.
**Depends on**: Phase 1
**Requirements**: DEAL-01, DEAL-02, DEAL-03, DEAL-04, NOTE-01, NOTE-02, NOTE-03, FILE-01, FILE-02, OM-01, OM-02, OM-03
**Success Criteria** (what must be TRUE):
  1. Broker sees a dashboard listing all their deals with status badges (active / negotiating / closed) and a New Deal button that opens a creation form
  2. Broker can create, edit, and delete a deal; deal fields include title, address, price, description, and status; only their own deals are visible
  3. Broker can add, edit, and delete notes on a deal from the Deal Hub page
  4. Broker can upload files to a deal (stored in Supabase Storage) and download them from the Deal Hub via signed URLs
  5. A public OM page exists at /om/[deal-id] showing deal title, property details, description, and images — accessible in a browser without being logged in
**Plans**: 4 plans
**UI hint**: yes

Plans:
- [ ] 02-00-PLAN.md — Wave 0 setup: shadcn components, next.config.ts, Storage buckets + RLS migration, sidebar fix
- [ ] 02-01-PLAN.md — Wave 1: Deals CRUD + dashboard (deal-actions, deal-card, deal-form-modal, delete-deal-dialog)
- [ ] 02-02-PLAN.md — Wave 2: Deal Hub page + Notes CRUD (note-actions, note-item, notes-section, deals/[id]/page)
- [ ] 02-03-PLAN.md — Wave 3: Files + OM page (file-actions, files-section, extend deals/[id]/page, om/[id]/page)

### Phase 3: Buyers, Send, and Tracking
**Goal**: The core product differentiator is live — broker manages a buyer pool, selects buyers for a deal, sends the OM link via email with per-buyer tracking tokens, and sees who opened the OM in an activity log.
**Depends on**: Phase 2
**Requirements**: BUYER-01, BUYER-02, BUYER-03, BUYER-04, SEND-01, SEND-02, TRACK-01, TRACK-02, TRACK-03, ACT-01, ACT-02
**Success Criteria** (what must be TRUE):
  1. Broker can create, view, edit, and delete buyers; each buyer has a name, email, and tags (e.g. retail, multifamily, budget range)
  2. Broker can select buyers from their pool and associate them with a specific deal from the Deal Hub
  3. Broker can send the OM link to selected buyers via email (Resend); each buyer receives a unique URL of the form /om/[deal-id]?ref=[token]
  4. When a buyer opens their unique OM link, the system records the first open event per buyer per deal (idempotent); the OM page also fires a tracking pixel as a secondary signal
  5. The Deal Hub shows a per-deal activity log with events for: OM sent (per buyer), note added, file uploaded, and OM opened (per buyer)
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 4/4 | Complete | 2026-04-27 |
| 2. Deal Hub | 0/4 | Ready to execute | - |
| 3. Buyers, Send, and Tracking | 0/TBD | Not started | - |

---
title: Plan
tags: [infolora, plan]
created: 2026-04-11
---

# Plan: Infolora backend

## Problem statement
Build a clean, modular backend for Infolora that exposes classroom temperatures and announcements to a frontend. Start with simulated TTN-like data, and be ready to integrate real TTN sensor webhooks later.

## Proposed approach
- Tech: Node.js + Express (TypeScript optional). SQLite for local dev, Postgres for production.
- Architecture: adapter layer for data sources (simulator <-> TTN), service layer for ingestion and business logic, REST API for frontend.
- Deliverables: API endpoints, data models, simulator, TTN webhook adapter, tests, deployment setup.

## Phases & Todos
- init-codebase: Initialize repository and folder structure (src/, scripts/, package.json, README).
- models-and-migrations: Implement data models (temperatures, announcements) and migrations.
- api-endpoints: Implement REST endpoints (temperatures endpoints, announcements CRUD, webhook ingestion).
- simulator: Build a simulator that emits TTN-like payloads to the webhook for testing.
- ttn-webhook: Implement webhook adapter: validation, timestamp normalization, device->room mapping, storage.
- tests-ci: Add integration tests and GitHub Actions pipeline.
- realtime-updates: Add SSE or WebSocket support for near-real-time updates.
- docs-and-notes: Keep Obsidian notes and changelog up to date.
- deploy: Dockerfile, env config, Postgres production setup, webhook security (HMAC/shared secret).

## Dependencies
- api-endpoints depends on models-and-migrations
- ttn-webhook depends on models-and-migrations and api-endpoints
- tests-ci depends on api-endpoints and simulator
- realtime-updates depends on api-endpoints
- deploy depends on tests-ci and ttn-webhook

## Next actions
1. Create repo skeleton and initial README (init-codebase).
2. Implement schema and migrations (models-and-migrations).
3. Implement API endpoints and webhook adapter (api-endpoints + ttn-webhook).
4. Build simulator and run integration tests (simulator + tests-ci).
5. Add realtime updates, finalize docs, and prepare deployment.

## Notes & links
- Keep simulator payloads identical to expected TTN webhooks.
- Use an adapter layer so switching data sources requires minimal code changes.
- Linked notes: [[Context]], [[Architecture]], [[API-Endpoints]], [[Data-Models]], [[Simulator]], [[TTN-Webhook]], [[TODOs]]

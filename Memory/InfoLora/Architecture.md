---
title: Architecture
tags: [infolora, architecture, backend]
created: 2026-04-11
---

# Architecture

Goal
- Backend for Infolora: expose temperatures and announcements to the frontend and ingest sensor data.

Components
- API server (Node.js/Express recommended)
- Data store (SQLite for dev, Postgres for production)
- Data-source adapter (simulator <-> TTN)
- Simulator service for generating TTN-like payloads

Data flow
Sensor -> TTN (or simulator) -> webhook adapter -> ingest -> store -> API -> frontend

Tech stack (recommended)
- Node.js + Express (TypeScript optional)
- SQLite for local dev, Postgres for prod
- Simple REST API, webhooks for ingestion

Folder structure suggestion
- src/
  - api/
  - models/
  - services/
  - adapters/
  - scripts/

Design decisions
- Keep adapter layer so switching data sources requires minimal changes.
- Keep models minimal and aligned with TTN payloads.

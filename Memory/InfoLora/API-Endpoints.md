---
title: API Endpoints
tags: [infolora, api]
created: 2026-04-11
---

# API Endpoints

List of planned endpoints (REST)

- GET /api/temperatures
  - Description: List latest temperatures; supports query params: room_id, since, limit
  - Response: [{ room_id, value, timestamp }]

- GET /api/temperatures/:room_id
  - Description: Latest readings for a room

- POST /api/temperatures/webhook
  - Description: Ingest TTN webhook payloads (or simulator payloads). Accepts JSON.
  - Example payload:
    {
      "device_id": "room_101_sensor",
      "temperature": 22.5,
      "timestamp": "2026-04-11T00:00:00Z"
    }

- GET /api/announcements
  - Description: List announcements ordered by priority/created_at

- POST /api/announcements
  - Description: Create an announcement
  - Body: { title, message, priority }

Notes
- All endpoints should return JSON and use standard HTTP status codes.
- Consider SSE or websockets for near-real-time updates later.

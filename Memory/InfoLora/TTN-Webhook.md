---
title: TTN Webhook Spec
tags: [infolora, ttn, webhook]
created: 2026-04-11
---

# TTN Webhook Spec

Inbound JSON (expected)

{
  "device_id": "room_101_sensor",
  "temperature": 22.5,
  "timestamp": "2026-04-11T00:00:00Z"
}

Ingest rules
- Validate device_id and timestamp
- Normalize timestamp to UTC ISO8601
- Map device_id to room_id (if necessary)
- Store temperature.value and timestamp

Security
- Optionally require a shared secret or HMAC in headers for production webhooks

Testing
- Use the simulator to POST identical payloads to /api/temperatures/webhook

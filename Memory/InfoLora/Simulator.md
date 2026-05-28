---
title: Simulator
tags: [infolora, simulator, ttn]
created: 2026-04-11
---

# Simulator

Purpose: produce TTN-like JSON payloads so the backend can be developed without real sensors.

Payload must match TTN structure used by the ingest endpoint:
{
  "device_id": "room_101_sensor",
  "temperature": 22.5,
  "timestamp": "ISO8601"
}

Options:
- Simple node script that emits a payload every N seconds to the webhook endpoint.
- CLI: node scripts/simulate.js --room room_101 --interval 30 --target http://localhost:3000/api/temperatures/webhook

Implementation notes:
- Simulator must allow setting temperature ranges per room and noise.
- Use the same adapter used for real TTN payloads so parsing logic is shared.

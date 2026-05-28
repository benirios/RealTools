---
title: Data Models
tags: [infolora, models, schema]
created: 2026-04-11
---

# Data Models

## Temperature
- room_id: string (e.g., "room_101")
- value: number (Celsius)
- timestamp: ISO8601 string
- device_id: string (optional; maps to TTN device)

SQL example (SQLite)

CREATE TABLE temperatures (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  room_id TEXT NOT NULL,
  value REAL NOT NULL,
  timestamp TEXT NOT NULL,
  device_id TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

## Announcement
- id: UUID or integer
- title: string
- message: string
- priority: integer (higher = more important)
- created_at: ISO8601

CREATE TABLE announcements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

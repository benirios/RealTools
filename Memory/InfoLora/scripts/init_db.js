"use strict";
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '..', 'data', 'infolora.db');
const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS temperatures (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id TEXT NOT NULL,
    value REAL NOT NULL,
    timestamp TEXT NOT NULL,
    device_id TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_temperatures_room_time ON temperatures (room_id, timestamp);`);
  db.run(`CREATE TABLE IF NOT EXISTS announcements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    priority INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );`);
  db.run('PRAGMA user_version = 1;');
});

db.close(err => {
  if (err) {
    console.error('Error closing DB', err);
    process.exit(1);
  }
  console.log(`DB initialized at ${dbPath}`);
});

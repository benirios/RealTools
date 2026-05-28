"use strict";
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '..', 'data', 'infolora.db');
const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const db = new sqlite3.Database(dbPath);

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) return reject(err);
      resolve(this);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

async function insertTemperature({ room_id, value, timestamp, device_id }) {
  const res = await run(
    'INSERT INTO temperatures (room_id, value, timestamp, device_id) VALUES (?, ?, ?, ?);',
    [room_id, value, timestamp, device_id]
  );
  return res.lastID;
}

async function getTemperatures({ room_id } = {}) {
  if (room_id) {
    return all(
      'SELECT room_id, value, timestamp, device_id FROM temperatures WHERE room_id = ? ORDER BY timestamp DESC LIMIT 100;',
      [room_id]
    );
  }
  return all(
    'SELECT room_id, value, timestamp, device_id FROM temperatures ORDER BY timestamp DESC LIMIT 100;'
  );
}

async function insertAnnouncement({ title, message, priority = 0 }) {
  const res = await run(
    'INSERT INTO announcements (title, message, priority) VALUES (?, ?, ?);',
    [title, message, priority]
  );
  return res.lastID;
}

async function getAnnouncements() {
  return all(
    'SELECT id, title, message, priority, created_at FROM announcements ORDER BY priority DESC, created_at DESC;'
  );
}

module.exports = {
  insertTemperature,
  getTemperatures,
  insertAnnouncement,
  getAnnouncements,
};

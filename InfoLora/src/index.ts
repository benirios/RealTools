import express from 'express';
import dotenv from 'dotenv';
import Database from 'better-sqlite3';

dotenv.config();
const app = express();
const dbPath = process.env.DATABASE_PATH || 'dev.db';
const db = new Database(dbPath);

// Ensure tables
db.exec(`
CREATE TABLE IF NOT EXISTS temperatures (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  room_id TEXT NOT NULL,
  value REAL NOT NULL,
  timestamp TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS announcements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority INTEGER DEFAULT 0,
  created_at TEXT NOT NULL
);
`);

app.use(express.json());

// SSE clients
const clients: Array<express.Response> = [];

function broadcast(event: string, payload: any) {
  const data = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const res of clients) {
    try { res.write(data); } catch (e) { /* ignore individual client errors */ }
  }
}

app.get('/temperatures', (req, res) => {
  const rows = db.prepare('SELECT * FROM temperatures ORDER BY datetime(timestamp) DESC LIMIT 200').all();
  res.json(rows);
});

app.get('/temperatures/:roomId', (req, res) => {
  const roomId = req.params.roomId;
  const rows = db.prepare('SELECT * FROM temperatures WHERE room_id = ? ORDER BY datetime(timestamp) DESC LIMIT 200').all(roomId);
  res.json(rows);
});

app.post('/announcements', (req, res) => {
  const { title, message, priority } = req.body;
  if (!title || !message) return res.status(400).json({ error: 'title and message required' });
  const now = new Date().toISOString();
  const info = db.prepare('INSERT INTO announcements (title,message,priority,created_at) VALUES (?,?,?,?)').run(title, message, priority ?? 0, now);
  const ann = { id: info.lastInsertRowid, title, message, priority: priority ?? 0, created_at: now };
  broadcast('announcement', ann);
  res.status(201).json(ann);
});

app.get('/announcements', (req, res) => {
  const rows = db.prepare('SELECT * FROM announcements ORDER BY datetime(created_at) DESC').all();
  res.json(rows);
});

app.post('/webhooks/ttn', (req, res) => {
  try {
    const { device_id, temperature, timestamp } = req.body;
    if (!device_id || typeof temperature !== 'number') return res.status(400).json({ error: 'invalid payload' });
    const ts = timestamp ? new Date(timestamp).toISOString() : new Date().toISOString();
    const info = db.prepare('INSERT INTO temperatures (room_id,value,timestamp) VALUES (?,?,?)').run(device_id, temperature, ts);
    const rec = { id: info.lastInsertRowid, room_id: device_id, value: temperature, timestamp: ts };
    broadcast('temperature', rec);
    res.status(201).json(rec);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

app.get('/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.write(': connected\n\n');
  clients.push(res);
  req.on('close', () => {
    const idx = clients.indexOf(res);
    if (idx >= 0) clients.splice(idx, 1);
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server listening on ${port}`));

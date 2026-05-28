const express = require('express');
const db = require('./db');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// GET /api/temperatures?room_id=room_101
app.get('/api/temperatures', async (req, res) => {
  try {
    const { room_id } = req.query;
    const rows = await db.getTemperatures({ room_id });
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'internal' });
  }
});

// POST /api/temperatures/webhook
// Expected payload: { device_id, temperature, timestamp }
app.post('/api/temperatures/webhook', async (req, res) => {
  const { device_id, temperature, timestamp } = req.body;
  if (!device_id || typeof temperature !== 'number' || !timestamp) {
    return res.status(400).json({ error: 'device_id, temperature, and timestamp required' });
  }
  const room_id = device_id.replace('_sensor','');
  try {
    const id = await db.insertTemperature({ room_id, value: temperature, timestamp, device_id });
    const entry = { id, room_id, value: temperature, timestamp, device_id };
    res.status(201).json({ ok: true, entry });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db_error' });
  }
});

// Announcements endpoints
app.get('/api/announcements', async (req, res) => {
  try {
    const rows = await db.getAnnouncements();
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'internal' });
  }
});

app.post('/api/announcements', async (req, res) => {
  const { title, message, priority = 0 } = req.body;
  if (!title || !message) return res.status(400).json({ error: 'title and message required' });
  try {
    const id = await db.insertAnnouncement({ title, message, priority });
    const created_at = new Date().toISOString();
    const ann = { id, title, message, priority, created_at };
    res.status(201).json(ann);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db_error' });
  }
});

app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));

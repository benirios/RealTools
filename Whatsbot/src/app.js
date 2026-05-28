const express = require('express');
const webhookRouter = require('./routes/webhook');

const app = express();

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));

app.get('/health', (_req, res) => {
  res.status(200).json({ ok: true });
});

app.use('/webhook', webhookRouter);

app.use((err, _req, res, _next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'internal_server_error' });
});

module.exports = { app };

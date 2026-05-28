const express = require('express');
const { env } = require('../config/env');
const { processIncomingMessage } = require('../services/messageHandler');

const router = express.Router();
const TWILIO_EMPTY_RESPONSE = '<?xml version="1.0" encoding="UTF-8"?><Response></Response>';

const extractTextEvents = (payload) => {
  if (!payload || payload.object !== 'whatsapp_business_account') {
    return [];
  }

  const events = [];

  for (const entry of payload.entry || []) {
    for (const change of entry.changes || []) {
      if (change.field !== 'messages') {
        continue;
      }

      const value = change.value || {};
      const profileName = value?.contacts?.[0]?.profile?.name || null;

      for (const message of value.messages || []) {
        if (message.type !== 'text') {
          continue;
        }

        const text = String(message?.text?.body || '').trim();
        if (!text) {
          continue;
        }

        events.push({
          waId: message.from,
          profileName,
          text,
          messageId: message.id,
        });
      }
    }
  }

  return events;
};

const extractTwilioEvent = (payload) => {
  const from = String(payload?.From || '').trim();
  const text = String(payload?.Body || '').trim();

  if (!from || !text) {
    return null;
  }

  const waId = from.replace(/^whatsapp:/i, '');
  const profileName = String(payload?.ProfileName || '').trim() || null;
  const messageId = String(payload?.MessageSid || '').trim() || null;

  return {
    waId,
    profileName,
    text,
    messageId,
  };
};

router.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === env.META_VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
});

router.post('/', async (req, res) => {
  const events = extractTextEvents(req.body);

  for (const event of events) {
    try {
      await processIncomingMessage(event);
    } catch (error) {
      console.error(`Failed to process message ${event.messageId}:`, error.message);
    }
  }

  res.sendStatus(200);
});

router.post('/twilio', async (req, res) => {
  const event = extractTwilioEvent(req.body);

  if (event) {
    try {
      await processIncomingMessage(event);
    } catch (error) {
      console.error(`Failed to process Twilio message ${event.messageId || 'unknown'}:`, error.message);
    }
  }

  res.status(200).type('text/xml').send(TWILIO_EMPTY_RESPONSE);
});

module.exports = router;

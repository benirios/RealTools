const axios = require('axios');
const twilio = require('twilio');
const { env } = require('../config/env');

let twilioClient;

const getTwilioClient = () => {
  if (!twilioClient) {
    twilioClient = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
  }

  return twilioClient;
};

const toTwilioAddress = (value) => {
  const raw = String(value || '').trim();
  if (!raw) {
    throw new Error('Missing destination number for Twilio message');
  }

  if (raw.toLowerCase().startsWith('whatsapp:')) {
    return raw;
  }

  if (raw.startsWith('+')) {
    return `whatsapp:${raw}`;
  }

  const digits = raw.replace(/[^\d]/g, '');
  return `whatsapp:+${digits}`;
};

const sendViaMeta = async ({ to, text }) => {
  const url = `https://graph.facebook.com/${env.META_GRAPH_VERSION}/${env.META_PHONE_NUMBER_ID}/messages`;

  const response = await axios.post(
    url,
    {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: text },
    },
    {
      headers: {
        Authorization: `Bearer ${env.META_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    },
  );

  return response.data?.messages?.[0]?.id || null;
};

const sendViaTwilio = async ({ to, text }) => {
  const client = getTwilioClient();
  const response = await client.messages.create({
    from: env.TWILIO_WHATSAPP_FROM,
    to: toTwilioAddress(to),
    body: text,
  });

  return response.sid || null;
};

const sendWhatsAppText = async ({ to, text }) => {
  if (env.WHATSAPP_PROVIDER === 'twilio') {
    return sendViaTwilio({ to, text });
  }

  return sendViaMeta({ to, text });
};

module.exports = { sendWhatsAppText };

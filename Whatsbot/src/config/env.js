const dotenv = require('dotenv');

dotenv.config({ quiet: true });

const toBoolean = (value, fallback = false) => {
  if (value === undefined) {
    return fallback;
  }

  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
};

const normalizeProvider = (value) => String(value || 'meta').toLowerCase().trim();

const env = {
  PORT: Number(process.env.PORT || 3000),
  NODE_ENV: process.env.NODE_ENV || 'development',
  WHATSAPP_PROVIDER: normalizeProvider(process.env.WHATSAPP_PROVIDER || 'meta'),
  META_VERIFY_TOKEN: process.env.META_VERIFY_TOKEN,
  META_ACCESS_TOKEN: process.env.META_ACCESS_TOKEN,
  META_PHONE_NUMBER_ID: process.env.META_PHONE_NUMBER_ID,
  META_GRAPH_VERSION: process.env.META_GRAPH_VERSION || 'v22.0',
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
  TWILIO_WHATSAPP_FROM: process.env.TWILIO_WHATSAPP_FROM,
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  ENABLE_AI_INTENT: toBoolean(process.env.ENABLE_AI_INTENT, false),
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-5-mini',
};

if (!['meta', 'twilio'].includes(env.WHATSAPP_PROVIDER)) {
  throw new Error('WHATSAPP_PROVIDER must be either "meta" or "twilio"');
}

const commonRequired = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
];

const providerRequired =
  env.WHATSAPP_PROVIDER === 'twilio'
    ? ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_WHATSAPP_FROM']
    : ['META_VERIFY_TOKEN', 'META_ACCESS_TOKEN', 'META_PHONE_NUMBER_ID'];

const missing = [...commonRequired, ...providerRequired].filter((key) => !env[key]);

if (missing.length > 0) {
  throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
}

if (!Number.isFinite(env.PORT) || env.PORT <= 0) {
  throw new Error('PORT must be a positive number');
}

if (env.ENABLE_AI_INTENT && !env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is required when ENABLE_AI_INTENT=true');
}

if (env.WHATSAPP_PROVIDER === 'twilio' && !env.TWILIO_WHATSAPP_FROM.startsWith('whatsapp:')) {
  throw new Error('TWILIO_WHATSAPP_FROM must start with "whatsapp:"');
}

module.exports = { env };

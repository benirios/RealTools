const defaults = {
  NODE_ENV: 'test',
  PORT: '3999',
  WHATSAPP_PROVIDER: 'meta',
  META_VERIFY_TOKEN: 'test-verify-token',
  META_ACCESS_TOKEN: 'test-access-token',
  META_PHONE_NUMBER_ID: '123456789',
  META_GRAPH_VERSION: 'v22.0',
  TWILIO_ACCOUNT_SID: 'ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  TWILIO_AUTH_TOKEN: 'test-auth-token',
  TWILIO_WHATSAPP_FROM: 'whatsapp:+14155238886',
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'test-supabase-key',
  ENABLE_AI_INTENT: 'false',
  OPENAI_MODEL: 'gpt-5-mini',
};

for (const [key, value] of Object.entries(defaults)) {
  if (!process.env[key]) {
    process.env[key] = value;
  }
}

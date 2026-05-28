# Whatsbot MVP

Lean WhatsApp chatbot MVP for clinics (booking simulation + upsell) using Express + WhatsApp Cloud API + Supabase.

## 1. Setup

1. Copy env file:
   ```bash
   cp .env.example .env
   ```
2. Fill `.env` with:
   - `WHATSAPP_PROVIDER` (`meta` or `twilio`)
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - For **Meta** provider:
     - `META_VERIFY_TOKEN`
     - `META_ACCESS_TOKEN`
     - `META_PHONE_NUMBER_ID`
   - For **Twilio** provider:
     - `TWILIO_ACCOUNT_SID`
     - `TWILIO_AUTH_TOKEN`
     - `TWILIO_WHATSAPP_FROM`
3. Install deps:
   ```bash
   npm install
   ```
4. Run app:
   ```bash
   npm run dev
   ```

## 2. Database setup (Supabase SQL editor)

Run:
```sql
\i src/db/schema.sql
```

If your SQL editor does not support `\i`, copy-paste the file content directly.

## 3. Webhook endpoints

- Verification: `GET /webhook`
- Inbound (Meta): `POST /webhook`
- Inbound (Twilio): `POST /webhook/twilio`
- Health: `GET /health`

## 4. Run tests

```bash
npm test
```

## 5. WhatsApp flow behavior

1. User sends `BOOK`
2. Bot asks service
3. Bot asks date
4. Bot asks time
5. Bot confirms booking simulation and asks upsell (`YES/NO`)
6. Bot records upsell response

## 6. Deploy (Railway)

1. Connect repo to Railway
2. Railway reads `railway.json` and uses `npm run start`
3. Add env vars from `.env.example`
4. Deploy
5. Set webhook URL in Meta dashboard:
   - `https://<your-app>.up.railway.app/webhook`
6. In Meta webhook settings, use the same `META_VERIFY_TOKEN` value during verification

## 7. Twilio Sandbox quick try

1. Set `WHATSAPP_PROVIDER=twilio` in `.env`.
2. In Twilio Console, open WhatsApp Sandbox and join it from your phone.
3. Expose local app:
   ```bash
   npm run dev
   npx ngrok http 3000
   ```
4. In Twilio Sandbox "When a message comes in", set:
   - `https://<ngrok-url>/webhook/twilio`
5. Send `BOOK` to the Twilio Sandbox number and follow the booking flow.

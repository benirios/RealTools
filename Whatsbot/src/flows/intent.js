const OpenAI = require('openai');
const { env } = require('../config/env');

const INTENTS = Object.freeze({
  BOOKING: 'booking',
  CANCEL: 'cancel',
  PRICING: 'pricing',
  GREETING: 'greeting',
  UNKNOWN: 'unknown',
});

const KEYWORDS = Object.freeze({
  [INTENTS.BOOKING]: ['book', 'booking', 'appointment', 'schedule'],
  [INTENTS.CANCEL]: ['cancel', 'reschedule', 'change', 'move'],
  [INTENTS.PRICING]: ['price', 'pricing', 'cost', 'fee', 'how much'],
  [INTENTS.GREETING]: ['hi', 'hello', 'hey', 'good morning', 'good evening'],
});

let openaiClient;

const getOpenAIClient = () => {
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  }

  return openaiClient;
};

const normalizeText = (text) =>
  String(text || '')
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const detectIntentWithRules = (normalizedText) => {
  if (!normalizedText) {
    return INTENTS.UNKNOWN;
  }

  for (const [intent, words] of Object.entries(KEYWORDS)) {
    if (words.some((word) => normalizedText.includes(word))) {
      return intent;
    }
  }

  return INTENTS.UNKNOWN;
};

const mapAiOutputToIntent = (rawOutput) => {
  const output = rawOutput.toLowerCase();

  if (output.includes(INTENTS.BOOKING)) {
    return INTENTS.BOOKING;
  }
  if (output.includes(INTENTS.CANCEL)) {
    return INTENTS.CANCEL;
  }
  if (output.includes(INTENTS.PRICING)) {
    return INTENTS.PRICING;
  }
  if (output.includes(INTENTS.GREETING)) {
    return INTENTS.GREETING;
  }

  return INTENTS.UNKNOWN;
};

const detectIntentWithAI = async (normalizedText) => {
  if (!env.OPENAI_API_KEY) {
    return INTENTS.UNKNOWN;
  }

  const client = getOpenAIClient();
  const response = await client.responses.create({
    model: env.OPENAI_MODEL,
    temperature: 0,
    max_output_tokens: 10,
    input: [
      {
        role: 'system',
        content:
          'Classify the user message into exactly one label: booking, cancel, pricing, greeting, unknown. Respond with only the label.',
      },
      { role: 'user', content: normalizedText },
    ],
  });

  const rawOutput = String(response.output_text || '').trim().toLowerCase();
  return mapAiOutputToIntent(rawOutput);
};

const detectIntent = async (text) => {
  const normalizedText = normalizeText(text);
  const intent = detectIntentWithRules(normalizedText);

  if (intent !== INTENTS.UNKNOWN || !env.ENABLE_AI_INTENT) {
    return intent;
  }

  try {
    return await detectIntentWithAI(normalizedText);
  } catch (error) {
    console.error('AI intent detection failed:', error.message);
    return INTENTS.UNKNOWN;
  }
};

module.exports = { INTENTS, detectIntent };


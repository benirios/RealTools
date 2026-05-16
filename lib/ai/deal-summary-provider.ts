import 'server-only'
import { AiDealSummarySchema, type AiDealSummary, type DealSummaryInput } from '@/lib/ai/deal-summary-schema'

type GenerateDealSummaryOptions = {
  input: DealSummaryInput
  temperature: number
}

type DealSummaryProvider = {
  provider: string
  model: string
  generate: (options: GenerateDealSummaryOptions) => Promise<AiDealSummary>
}

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>
    }
  }>
}

function parseTemperature(value: string | undefined) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.min(Math.max(parsed, 0), 1) : 0.3
}

export function getDealSummaryProviderConfig() {
  const provider = (process.env.AI_DEAL_SUMMARY_PROVIDER ?? 'gemini').trim().toLowerCase()
  const model = (process.env.AI_DEAL_SUMMARY_MODEL ?? process.env.GEMINI_MODEL ?? 'gemini-3-flash-preview').trim()
  const temperature = parseTemperature(process.env.AI_DEAL_SUMMARY_TEMPERATURE)

  return { provider, model, temperature }
}

function stripJsonFences(value: string) {
  return value
    .trim()
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/i, '')
    .trim()
}

function parseSummaryJson(value: string) {
  const parsed = JSON.parse(stripJsonFences(value))
  return AiDealSummarySchema.parse(parsed)
}

function buildPrompt(input: DealSummaryInput) {
  return [
    'You are generating a concise commercial real estate deal summary for brokers and investors.',
    'Use only the structured input data provided. Never invent facts. If data is missing, mention uncertainty.',
    'Keep the language commercial, practical, and explainable.',
    'Return only valid JSON with this exact shape:',
    '{"headline":"short investment-style summary","best_fit":["business type 1","business type 2","business type 3"],"strengths":["strength 1","strength 2","strength 3"],"risks":["risk 1","risk 2"],"investor_angle":"why this may interest investors","recommended_action":"what the user should do next","confidence":"low | medium | high"}',
    'Structured input:',
    JSON.stringify(input),
  ].join('\n')
}

async function retry<T>(operation: () => Promise<T>, attempts = 2): Promise<T> {
  let lastError: unknown
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
    }
  }

  throw lastError instanceof Error ? lastError : new Error('AI summary generation failed.')
}

function createGeminiProvider(model: string): DealSummaryProvider {
  return {
    provider: 'gemini',
    model,
    async generate({ input, temperature }) {
      const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY
      if (!apiKey) throw new Error('AI summary unavailable: missing Gemini API key.')

      const response = await retry(async () => {
        const result = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': apiKey,
            },
            body: JSON.stringify({
              contents: [
                {
                  role: 'user',
                  parts: [{ text: buildPrompt(input) }],
                },
              ],
              generationConfig: {
                temperature,
                responseMimeType: 'application/json',
              },
            }),
          }
        )

        if (!result.ok) {
          const body = await result.text()
          throw new Error(`Gemini summary request failed: ${result.status} ${body.slice(0, 200)}`)
        }

        return result.json() as Promise<GeminiResponse>
      })

      const text = response.candidates?.[0]?.content?.parts
        ?.map((part) => part.text ?? '')
        .join('')
        .trim()

      if (!text) throw new Error('Gemini returned an empty summary.')
      return parseSummaryJson(text)
    },
  }
}

export function createDealSummaryProvider(): DealSummaryProvider {
  const config = getDealSummaryProviderConfig()

  if (config.provider === 'gemini') {
    return createGeminiProvider(config.model)
  }

  throw new Error(`AI summary unavailable: unsupported provider "${config.provider}".`)
}

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
    'Gere um resumo conciso de negócio imobiliário comercial para corretores e investidores.',
    'Use somente os dados estruturados fornecidos. Nunca invente fatos. Se houver dados ausentes, mencione a incerteza.',
    'Todo texto de resposta deve estar em português do Brasil, com tom comercial, prático e explicável.',
    'Retorne somente JSON válido com exatamente este formato:',
    '{"headline":"resumo curto em estilo de investimento","best_fit":["tipo de negócio 1","tipo de negócio 2","tipo de negócio 3"],"strengths":["força 1","força 2","força 3"],"risks":["risco 1","risco 2"],"investor_angle":"por que isso pode interessar investidores","recommended_action":"o que o usuário deve fazer a seguir","confidence":"low | medium | high"}',
    'Dados estruturados:',
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

  throw lastError instanceof Error ? lastError : new Error('Falha ao gerar o resumo IA.')
}

function createGeminiProvider(model: string): DealSummaryProvider {
  return {
    provider: 'gemini',
    model,
    async generate({ input, temperature }) {
      const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY
      if (!apiKey) throw new Error('Resumo IA indisponível: chave de API do Gemini ausente.')

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
          throw new Error(`Falha na solicitação de resumo ao Gemini: ${result.status} ${body.slice(0, 200)}`)
        }

        return result.json() as Promise<GeminiResponse>
      })

      const text = response.candidates?.[0]?.content?.parts
        ?.map((part) => part.text ?? '')
        .join('')
        .trim()

      if (!text) throw new Error('O Gemini retornou um resumo vazio.')
      return parseSummaryJson(text)
    },
  }
}

export function createDealSummaryProvider(): DealSummaryProvider {
  const config = getDealSummaryProviderConfig()

  if (config.provider === 'gemini') {
    return createGeminiProvider(config.model)
  }

  throw new Error(`Resumo IA indisponível: provedor não suportado "${config.provider}".`)
}

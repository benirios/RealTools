import 'server-only'
import {
  OrganizedDescriptionSchema,
  type OrganizedDescription,
  type DescriptionOrganizerInput,
} from '@/lib/ai/description-organizer-schema'

type OpenAIResponse = {
  choices?: Array<{
    message?: { content?: string | null }
  }>
}

function getDescriptionOrganizerModel() {
  return (process.env.AI_DESCRIPTION_ORGANIZER_MODEL ?? process.env.AI_DEAL_SUMMARY_MODEL ?? 'google/gemini-2.5-flash-lite').trim()
}

function stripJsonFences(value: string) {
  return value
    .trim()
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/i, '')
    .trim()
}

function buildPrompt(input: DescriptionOrganizerInput) {
  return [
    'Reescreva esta descrição de imóvel comercial, coletada de um anúncio do OLX.',
    'Remova textos de boilerplate do site, código do anúncio, e qualquer dado de contato (telefone, WhatsApp, "fale conosco", "ver número", etc) — o contato com o proprietário é feito pelo fluxo de Memorando de Oportunidade do RealTools, não pelo anúncio original.',
    'Nunca invente fatos que não estejam presentes no texto original. Se não houver conteúdo real após a limpeza, retorne um único parágrafo dizendo que não há descrição disponível.',
    'Todo texto de resposta deve estar em português do Brasil.',
    'Retorne somente JSON válido com exatamente este formato:',
    '{"paragraphs":["parágrafo limpo 1","parágrafo limpo 2"],"highlights":["fato objetivo 1","fato objetivo 2"]}',
    `Título do anúncio: ${input.title}`,
    'Descrição original:',
    input.rawDescription,
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

  throw lastError instanceof Error ? lastError : new Error('Falha ao organizar a descrição.')
}

export async function generateOrganizedDescription(input: DescriptionOrganizerInput): Promise<OrganizedDescription> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) throw new Error('Organização de descrição indisponível: chave de API do OpenRouter ausente.')

  const model = getDescriptionOrganizerModel()

  const response = await retry(async () => {
    const result = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_tokens: 800,
        messages: [{ role: 'user', content: buildPrompt(input) }],
        response_format: { type: 'json_object' },
      }),
    })

    if (!result.ok) {
      const body = await result.text()
      throw new Error(`Falha na solicitação de organização de descrição ao OpenRouter: ${result.status} ${body.slice(0, 200)}`)
    }

    return result.json() as Promise<OpenAIResponse>
  })

  const text = response.choices?.[0]?.message?.content?.trim()
  if (!text) throw new Error('O OpenRouter retornou uma descrição organizada vazia.')

  return OrganizedDescriptionSchema.parse(JSON.parse(stripJsonFences(text)))
}

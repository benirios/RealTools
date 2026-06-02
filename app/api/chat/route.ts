import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import { createSupabaseServiceClient } from '@/lib/supabase/service'
import { buildImovelContext, buildClienteContext, buildNegocioContext } from '@/lib/ai/chat-context'

const MessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(4000),
})

const BodySchema = z.object({
  entityType: z.enum(['imovel', 'cliente', 'negocio']),
  entityId: z.string().uuid(),
  clientId: z.string().uuid().optional(),
  messages: z.array(MessageSchema).min(1).max(40),
})

type OpenRouterChunk = {
  choices?: Array<{ delta?: { content?: string | null } }>
}

// In-memory rate limiter — per-instance only. Replace with Upstash for multi-instance deployments.
const rateLimitMap = new Map<string, number[]>()
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 15

function isRateLimited(userId: string): boolean {
  const now = Date.now()
  const timestamps = (rateLimitMap.get(userId) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS)
  if (timestamps.length >= RATE_LIMIT_MAX) return true
  timestamps.push(now)
  rateLimitMap.set(userId, timestamps)
  return false
}

function getConfig() {
  const model = (process.env.AI_DEAL_SUMMARY_MODEL ?? 'google/gemini-flash-1.5').trim()
  const apiKey = process.env.OPENROUTER_API_KEY
  return { model, apiKey }
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  if (isRateLimited(userId)) {
    return NextResponse.json({ error: 'Muitas requisições. Tente novamente em um minuto.' }, { status: 429 })
  }

  const body = await req.json().catch(() => null)
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Requisição inválida', details: parsed.error.flatten() }, { status: 400 })
  }

  const { entityType, entityId, clientId, messages } = parsed.data
  const { model, apiKey } = getConfig()

  if (!apiKey) {
    return NextResponse.json({ error: 'Chave de API não configurada' }, { status: 503 })
  }

  const supabase = createSupabaseServiceClient()

  let systemPrompt: string
  try {
    if (entityType === 'imovel') {
      systemPrompt = await buildImovelContext(supabase, userId, entityId)
    } else if (entityType === 'cliente') {
      systemPrompt = await buildClienteContext(supabase, userId, entityId)
    } else {
      if (!clientId) {
        return NextResponse.json({ error: 'clientId obrigatório para negócio' }, { status: 400 })
      }
      systemPrompt = await buildNegocioContext(supabase, userId, entityId, clientId)
    }
  } catch {
    return NextResponse.json({ error: 'Erro ao carregar contexto' }, { status: 500 })
  }

  const upstream = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.5,
      stream: true,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
    }),
  })

  if (!upstream.ok) {
    const errText = await upstream.text()
    console.error(`[chat] upstream error ${upstream.status}: ${errText.slice(0, 500)}`)
    return NextResponse.json({ error: 'Serviço de IA indisponível. Tente novamente.' }, { status: 502 })
  }

  if (!upstream.body) {
    return NextResponse.json({ error: 'Sem resposta do provedor' }, { status: 502 })
  }

  const encoder = new TextEncoder()
  const decoder = new TextDecoder()

  const stream = new ReadableStream({
    async start(controller) {
      const reader = upstream.body!.getReader()
      let buffer = ''

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''

          for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed.startsWith('data:')) continue
            const data = trimmed.slice(5).trim()
            if (data === '[DONE]') continue

            try {
              const chunk = JSON.parse(data) as OpenRouterChunk
              const content = chunk.choices?.[0]?.delta?.content
              if (content) {
                controller.enqueue(encoder.encode(content))
              }
            } catch {
              // malformed chunk — skip
            }
          }
        }
      } finally {
        reader.releaseLock()
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'no-cache',
    },
  })
}

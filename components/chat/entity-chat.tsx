'use client'

import { useState, useRef, useEffect } from 'react'
import { Bot, ChevronDown, Loader2, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

type Message = {
  role: 'user' | 'assistant'
  content: string
}

type Props = {
  entityType: 'imovel' | 'cliente' | 'negocio'
  entityId: string
  clientId?: string
  title?: string
}

export function EntityChat({ entityType, entityId, clientId, title = 'Assistente IA' }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen])

  async function send() {
    const text = input.trim()
    if (!text || isStreaming) return

    const userMessage: Message = { role: 'user', content: text }
    const nextMessages = [...messages, userMessage]
    setMessages(nextMessages)
    setInput('')
    setIsStreaming(true)

    const assistantMessage: Message = { role: 'assistant', content: '' }
    setMessages([...nextMessages, assistantMessage])

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType,
          entityId,
          clientId,
          messages: nextMessages,
        }),
      })

      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({ error: 'Erro desconhecido' }))
        setMessages((prev) => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: 'assistant', content: `Erro: ${err.error ?? 'Tente novamente.'}` }
          return updated
        })
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        setMessages((prev) => {
          const updated = [...prev]
          const last = updated[updated.length - 1]
          updated[updated.length - 1] = { ...last, content: last.content + chunk }
          return updated
        })
      }
    } catch {
      setMessages((prev) => {
        const updated = [...prev]
        updated[updated.length - 1] = { role: 'assistant', content: 'Erro de conexão. Tente novamente.' }
        return updated
      })
    } finally {
      setIsStreaming(false)
      textareaRef.current?.focus()
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <section className="rounded-md border border-border bg-card">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 p-4 md:p-5 text-left"
      >
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <Bot className="size-4" />
          </span>
          <div>
            <p className="text-[15px] font-medium text-foreground">{title}</p>
            {messages.length > 0 && !isOpen && (
              <p className="text-xs text-muted-foreground">{messages.length} mensagem{messages.length !== 1 ? 's' : ''}</p>
            )}
          </div>
        </div>
        <ChevronDown className={cn('size-4 text-muted-foreground transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div className="border-t border-border">
          <div className="flex flex-col gap-3 p-4 md:p-5 max-h-[420px] overflow-y-auto">
            {messages.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Faça uma pergunta sobre este {entityType === 'cliente' ? 'cliente' : entityType === 'negocio' ? 'negócio' : 'imóvel'}.
              </p>
            ) : (
              messages.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    'max-w-[90%] rounded-md px-3 py-2 text-sm leading-relaxed',
                    msg.role === 'user'
                      ? 'self-end bg-primary text-primary-foreground'
                      : 'self-start bg-muted text-foreground'
                  )}
                >
                  {msg.role === 'user' ? (
                    msg.content
                  ) : msg.content ? (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                        ul: ({ children }) => <ul className="mb-2 ml-4 list-disc space-y-0.5 last:mb-0">{children}</ul>,
                        ol: ({ children }) => <ol className="mb-2 ml-4 list-decimal space-y-0.5 last:mb-0">{children}</ol>,
                        li: ({ children }) => <li>{children}</li>,
                        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                        em: ({ children }) => <em className="italic">{children}</em>,
                        h1: ({ children }) => <p className="mb-1 font-semibold">{children}</p>,
                        h2: ({ children }) => <p className="mb-1 font-semibold">{children}</p>,
                        h3: ({ children }) => <p className="mb-1 font-medium">{children}</p>,
                        code: ({ children }) => <code className="rounded bg-background px-1 py-0.5 font-mono text-xs">{children}</code>,
                        blockquote: ({ children }) => <blockquote className="border-l-2 border-border pl-3 text-muted-foreground">{children}</blockquote>,
                        hr: () => <hr className="my-2 border-border" />,
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <Loader2 className="size-3 animate-spin" />
                      <span className="text-xs">Gerando…</span>
                    </span>
                  )}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-border p-4 md:p-5">
            <div className="flex gap-2 items-end">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Pergunte algo… (Enter para enviar)"
                rows={2}
                className="resize-none flex-1"
                disabled={isStreaming}
              />
              <Button
                size="icon"
                onClick={send}
                disabled={!input.trim() || isStreaming}
                className="shrink-0"
              >
                {isStreaming ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

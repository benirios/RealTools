'use client'

import { useState, useTransition } from 'react'
import { Send, CheckCircle2, Clock, Eye, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { sendOmAction, getOmSendsForListingAction } from '@/lib/actions/om-actions'
import type { PersistedListingMatch } from '@/lib/investors/match-processing'

interface OmRecipientsCardProps {
  listingId: string
  listingTitle: string
  matches: PersistedListingMatch[]
  initialSends: Awaited<ReturnType<typeof getOmSendsForListingAction>>
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function OmRecipientsCard({ listingId, matches, initialSends }: OmRecipientsCardProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [sends, setSends] = useState(initialSends)
  const [result, setResult] = useState<{ status: 'sent' | 'error'; message?: string; count?: number } | null>(null)
  const [isPending, startTransition] = useTransition()

  const eligibleMatches = matches.filter((m) => m.investor_email)
  const noEmailMatches = matches.filter((m) => !m.investor_email)

  function toggleAll() {
    if (selected.size === eligibleMatches.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(eligibleMatches.map((m) => m.investor_id)))
    }
  }

  function toggle(investorId: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(investorId)) { next.delete(investorId) } else { next.add(investorId) }
      return next
    })
  }

  function handleSend() {
    if (!selected.size) return
    startTransition(async () => {
      const res = await sendOmAction(listingId, Array.from(selected))
      setResult(res.status === 'sent'
        ? { status: 'sent', count: res.count }
        : { status: 'error', message: res.message })
      if (res.status === 'sent') {
        setSelected(new Set())
        // Refresh sends list
        const fresh = await getOmSendsForListingAction(listingId)
        setSends(fresh)
      }
    })
  }

  return (
    <div className="rounded-md border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="flex items-center gap-2">
          <Send className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">Enviar OM por Email</h2>
        </div>
        {eligibleMatches.length > 0 && (
          <Button variant="ghost" size="sm" onClick={toggleAll} className="text-xs">
            {selected.size === eligibleMatches.length ? 'Desmarcar todos' : 'Selecionar todos'}
          </Button>
        )}
      </div>

      {/* Recipient picker */}
      {matches.length === 0 ? (
        <div className="px-5 py-8 text-center text-sm text-muted-foreground">
          Nenhum investidor matched com este imóvel ainda.
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {eligibleMatches.map((m) => (
            <li key={m.investor_id}>
              <label className="flex cursor-pointer items-center gap-3 px-5 py-3 hover:bg-muted/40">
                <input
                  type="checkbox"
                  checked={selected.has(m.investor_id)}
                  onChange={() => toggle(m.investor_id)}
                  className="h-4 w-4 rounded border-border"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{m.investor_name ?? 'Investidor'}</p>
                  <p className="truncate text-xs text-muted-foreground">{m.investor_email}</p>
                </div>
                {m.match_score != null && (
                  <Badge variant="secondary" className="shrink-0 text-xs">
                    {Math.round(m.match_score)}% match
                  </Badge>
                )}
              </label>
            </li>
          ))}
          {noEmailMatches.map((m) => (
            <li key={m.investor_id} className="flex items-center gap-3 px-5 py-3 opacity-50">
              <div className="h-4 w-4 rounded border border-border bg-muted shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-muted-foreground">{m.investor_name ?? 'Investidor'}</p>
                <p className="text-xs text-muted-foreground">Sem email cadastrado</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Send button + feedback */}
      {eligibleMatches.length > 0 && (
        <div className="border-t border-border px-5 py-3 flex items-center gap-3">
          <Button
            onClick={handleSend}
            disabled={!selected.size || isPending}
            size="sm"
            className="gap-2"
          >
            <Mail className="size-4" />
            {isPending ? 'Enviando…' : `Enviar para ${selected.size || 0} investidor${selected.size !== 1 ? 'es' : ''}`}
          </Button>
          {result && (
            <p className={`text-xs ${result.status === 'sent' ? 'text-green-600' : 'text-destructive'}`}>
              {result.status === 'sent' ? `✓ ${result.count} email${result.count !== 1 ? 's' : ''} enviado${result.count !== 1 ? 's' : ''}` : result.message}
            </p>
          )}
        </div>
      )}

      {/* Send history */}
      {sends.length > 0 && (
        <div className="border-t border-border">
          <p className="px-5 pt-4 pb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Histórico de envios</p>
          <ul className="divide-y divide-border">
            {sends.map((send) => (
              <li key={send.id} className="flex items-center gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-foreground">{send.investors?.name ?? 'Investidor'}</p>
                  <p className="text-xs text-muted-foreground">{send.investors?.email ?? '—'}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="size-3" />
                    {formatDate(send.om_sent_at)}
                  </div>
                  {send.om_opened_at ? (
                    <div className="flex items-center gap-1 text-xs text-green-600">
                      <Eye className="size-3" />
                      Aberto em {formatDate(send.om_opened_at)}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <CheckCircle2 className="size-3" />
                      Não aberto ainda
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

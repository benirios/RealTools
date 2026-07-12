'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { CheckCircle2, Clock, Eye, Mail, ChevronDown, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { sendOmAction, getOmSendsForListingAction } from '@/lib/actions/om-actions'
import { shareListingWithInvestorAction } from '@/lib/actions/client-opportunity-actions'
import type { PersistedListingMatch } from '@/lib/investors/match-processing'

interface OmRecipientsCardProps {
  listingId: string
  listingTitle: string
  matches: PersistedListingMatch[]
  initialSends: Awaited<ReturnType<typeof getOmSendsForListingAction>>
}

function statusVariant(status: string) {
  if (status === 'strong') return 'default' as const
  if (status === 'medium') return 'outline' as const
  return 'secondary' as const
}

const CONFIDENCE_LABELS: Record<string, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
}

const STRATEGY_LABELS: Record<string, string> = {
  any: 'Qualquer',
  rental_income: 'Renda de aluguel',
  retail: 'Varejo',
  warehouse_logistics: 'Galpão / logística',
  food_beverage: 'Alimentação',
  pharmacy: 'Farmácia',
  gym_fitness: 'Academia / fitness',
  flip: 'Revenda',
  own_business: 'Negócio próprio',
  land_banking: 'Reserva de terreno',
}

const RISK_LABELS: Record<string, string> = {
  any: 'qualquer',
  low: 'baixo',
  medium: 'médio',
  high: 'alto',
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function OmRecipientsCard({ listingId, matches, initialSends }: OmRecipientsCardProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [sends, setSends] = useState(initialSends)
  const [result, setResult] = useState<{ status: 'sent' | 'error'; message?: string; count?: number } | null>(null)
  const [shared, setShared] = useState<Set<string>>(new Set(matches.filter((m) => m.is_manual_share).map((m) => m.investor.id)))
  const [sharingId, setSharingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const eligibleMatches = matches.filter((m) => m.investor.email)

  function toggleAll() {
    if (selected.size === eligibleMatches.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(eligibleMatches.map((m) => m.investor.id)))
    }
  }

  function toggle(investorId: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(investorId)) { next.delete(investorId) } else { next.add(investorId) }
      return next
    })
  }

  function toggleExpanded(investorId: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(investorId)) { next.delete(investorId) } else { next.add(investorId) }
      return next
    })
  }

  function share(investorId: string) {
    setSharingId(investorId)
    startTransition(async () => {
      const res = await shareListingWithInvestorAction(listingId, investorId)
      if (res.ok) {
        toast.success(res.message)
        setShared((prev) => new Set(prev).add(investorId))
      } else {
        toast.error(res.message)
      }
      setSharingId(null)
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
        const fresh = await getOmSendsForListingAction(listingId)
        setSends(fresh)
      }
    })
  }

  return (
    <div className="rounded-md border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Compatibilidade ranqueada</p>
          <h2 className="text-sm font-semibold text-foreground">Investidores compatíveis</h2>
        </div>
        {eligibleMatches.length > 0 && (
          <Button variant="ghost" size="sm" onClick={toggleAll} className="text-xs">
            {selected.size === eligibleMatches.length ? 'Desmarcar todos' : 'Selecionar todos'}
          </Button>
        )}
      </div>

      {matches.length === 0 ? (
        <div className="px-5 py-8 text-center text-sm text-muted-foreground">
          Nenhum match persistido ainda. Recalcule os matches deste imóvel para preencher esta seção.
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {matches.map((match, index) => {
            const hasEmail = Boolean(match.investor.email)
            const isOpen = expanded.has(match.investor.id)
            return (
              <li key={match.investor.id}>
                <div className={`flex items-center gap-3 px-5 py-3 ${!hasEmail ? 'opacity-50' : ''}`}>
                  {hasEmail ? (
                    <input
                      type="checkbox"
                      checked={selected.has(match.investor.id)}
                      onChange={() => toggle(match.investor.id)}
                      className="h-4 w-4 shrink-0 rounded border-border"
                    />
                  ) : (
                    <div className="h-4 w-4 shrink-0 rounded border border-border bg-muted" title="Sem email cadastrado" />
                  )}
                  <span className="w-5 shrink-0 text-xs text-muted-foreground">#{index + 1}</span>
                  <Badge variant={statusVariant(match.match_status)} className="shrink-0">
                    {match.match_score}%
                  </Badge>
                  <div className="min-w-0 flex-1">
                    <Link href={`/investors/${match.investor.id}`} className="truncate text-sm font-medium text-foreground hover:underline">
                      {match.investor.name ?? 'Investidor'}
                    </Link>
                    <p className="truncate text-xs text-muted-foreground">
                      {STRATEGY_LABELS[match.investor.strategy ?? ''] ?? match.investor.strategy} · risco {RISK_LABELS[match.investor.risk_level ?? ''] ?? match.investor.risk_level}
                      {!hasEmail && ' · sem email'}
                    </p>
                  </div>
                  <Badge variant="outline" className="shrink-0 text-xs">{CONFIDENCE_LABELS[match.confidence] ?? match.confidence}</Badge>
                  {shared.has(match.investor.id) ? (
                    <Badge variant="secondary" className="shrink-0 gap-1 text-xs">
                      <Share2 className="size-3" />
                      Compartilhado
                    </Badge>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0 gap-1.5 text-xs"
                      disabled={isPending && sharingId === match.investor.id}
                      onClick={() => share(match.investor.id)}
                    >
                      <Share2 className="size-3.5" />
                      Compartilhar
                    </Button>
                  )}
                  <button
                    type="button"
                    onClick={() => toggleExpanded(match.investor.id)}
                    className="shrink-0 rounded p-1 text-muted-foreground hover:bg-muted/50"
                    aria-label={isOpen ? 'Recolher detalhes' : 'Ver detalhes'}
                  >
                    <ChevronDown className={`size-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                </div>

                {isOpen && (
                  <div className="border-t border-border bg-muted/25 px-5 py-4">
                    <p className="text-sm text-muted-foreground">{match.explanation}</p>
                    {match.recommended_action && (
                      <p className="mt-2 text-sm font-medium text-foreground">{match.recommended_action}</p>
                    )}
                    <div className="mt-3 grid gap-3 text-sm md:grid-cols-2">
                      <div className="rounded-md border border-border bg-background/50 p-3">
                        <p className="text-xs font-medium uppercase text-muted-foreground">Forças</p>
                        {match.strengths.length > 0 ? (
                          <ul className="mt-2 space-y-1 text-muted-foreground">
                            {match.strengths.slice(0, 3).map((strength) => <li key={strength}>{strength}</li>)}
                          </ul>
                        ) : (
                          <p className="mt-2 text-muted-foreground">Sem forças principais registradas.</p>
                        )}
                      </div>
                      <div className="rounded-md border border-border bg-background/50 p-3">
                        <p className="text-xs font-medium uppercase text-muted-foreground">Pontos de atenção</p>
                        {match.concerns.length > 0 ? (
                          <ul className="mt-2 space-y-1 text-muted-foreground">
                            {match.concerns.slice(0, 3).map((concern) => <li key={concern}>{concern}</li>)}
                          </ul>
                        ) : (
                          <p className="mt-2 text-muted-foreground">Sem preocupações principais registradas.</p>
                        )}
                      </div>
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">
                      B {match.breakdown.budget_fit} / L {match.breakdown.location_fit} / T {match.breakdown.property_type_fit} / S {match.breakdown.strategy_fit} / R {match.breakdown.risk_fit} / Tag {match.breakdown.tag_fit} / Q {match.breakdown.opportunity_quality}
                    </p>
                    <Button asChild variant="outline" size="sm" className="mt-3">
                      <Link href={`/investors/${match.investor.id}`}>Abrir investidor</Link>
                    </Button>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {eligibleMatches.length > 0 && (
        <div className="flex items-center gap-3 border-t border-border px-5 py-3">
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

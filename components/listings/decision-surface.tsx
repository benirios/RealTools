'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowUpRight,
  Building2,
  CheckCircle2,
  CircleAlert,
  ExternalLink,
  Filter,
  Loader2,
  RefreshCw,
  Search,
  Sparkles,
  Target,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { regenerateAiDealSummaryAction } from '@/lib/actions/ai-summary-actions'
import { enrichListingLocationAction, recalculateListingMatchesAction } from '@/lib/actions/location-insight-actions'
import { cn } from '@/lib/utils'
import type { AiDealSummary } from '@/lib/ai/deal-summary-schema'
import type { Json } from '@/types/supabase'
import type { MutableRefObject, ReactNode } from 'react'

export type DecisionOpportunity = {
  id: string
  title: string
  address: string | null
  location: string | null
  priceText: string | null
  priceAmount: number | null
  images: string[]
  propertyType: string | null
  commercialType: string | null
  confidence: number | null
  lat: number | null
  lng: number | null
  tags: string[]
  sourceUrl: string
  enrichmentStatus: string
  matchingStatus: string
  enrichmentLastProcessedAt: string | null
  matchingLastProcessedAt: string | null
  firstSeenAt: string | null
  lastProcessedAt: string | null
  score: {
    total: number
    fitLabel: string | null
    location: number | null
    demographics: number | null
    footTraffic: number | null
    competition: number | null
    investorFit: number | null
    risk: number | null
    breakdown: Json
    risks: Json
    signals: Json
    computedAt: string | null
  } | null
  aiSummary: AiDealSummary | null
  aiSummaryStatus: string
  aiSummaryGeneratedAt: string | null
  investorMatches: Array<{
    id: string
    investorName: string
    matchScore: number
    matchStatus: string
    explanation: string
    reasons: string[]
    investorTags: string[]
    investorPreferences: string[]
  }>
  nearbyBusinesses: Array<{
    name: string | null
    category: string | null
    distanceMeters: number | null
  }>
  localIntelligence: {
    consumerProfile: string | null
    avgIncome: number | null
    populationDensity: number | null
    confidenceScore: number | null
    updatedAt: string | null
  } | null
}

type Props = {
  opportunities: DecisionOpportunity[]
  loadError?: string | null
}

type FilterState = {
  query: string
  minScore: string
  propertyType: string
  matchFilter: string
  enrichmentStatus: string
  businessTag: string
}

const ALL = 'all'

function opportunityScore(opportunity: DecisionOpportunity) {
  return opportunity.score?.total ?? 0
}

function scoreTone(score: number) {
  if (score >= 80) return 'high'
  if (score >= 60) return 'medium'
  return 'low'
}

function scoreLabel(score: number | null | undefined) {
  if (typeof score !== 'number') return 'Sem score'
  return `${Math.round(score)}`
}

function primaryImage(opportunity: DecisionOpportunity) {
  return opportunity.images.find((image) => image.trim().length > 0) ?? null
}

function imageSrc(src: string) {
  return src.startsWith('http') ? `/api/proxy-image?url=${encodeURIComponent(src)}` : src
}

function statusVariant(status: string | null | undefined) {
  if (status === 'failed') return 'destructive' as const
  if (status === 'completed') return 'default' as const
  if (status === 'processing') return 'outline' as const
  return 'secondary' as const
}

function confidenceVariant(confidence: string | null | undefined) {
  if (confidence === 'high') return 'default' as const
  if (confidence === 'medium') return 'outline' as const
  return 'secondary' as const
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente',
  processing: 'Processando',
  completed: 'Concluído',
  failed: 'Falhou',
  strong: 'Forte',
  medium: 'Médio',
  weak: 'Fraco',
}

const CONFIDENCE_LABELS: Record<string, string> = {
  low: 'baixa',
  medium: 'média',
  high: 'alta',
}

function formatDate(value: string | null | undefined) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function formatMoney(opportunity: DecisionOpportunity) {
  if (opportunity.priceText) return opportunity.priceText
  if (opportunity.priceAmount === null) return null

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(opportunity.priceAmount)
}

function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined) return '-'
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(value)
}

function uniqueSorted(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value?.trim()))))
    .sort((a, b) => a.localeCompare(b))
}

function fitTags(opportunity: DecisionOpportunity) {
  return uniqueSorted([
    opportunity.score?.fitLabel,
    ...(opportunity.tags ?? []),
    ...(opportunity.aiSummary?.best_fit ?? []),
  ])
}

function jsonStrings(value: Json | null | undefined, limit = 3) {
  if (!Array.isArray(value)) return []

  return value.flatMap((item) => {
    if (typeof item === 'string') return [item]
    if (!item || typeof item !== 'object') return []
    const row = item as Record<string, unknown>
    const label = row.label ?? row.name ?? row.message ?? row.reason ?? row.title
    return typeof label === 'string' ? [label] : []
  }).slice(0, limit)
}

function scoreBreakdown(opportunity: DecisionOpportunity) {
  const score = opportunity.score
  if (!score) return []

  return [
    ['Localização', score.location],
    ['Demografia', score.demographics],
    ['Fluxo', score.footTraffic],
    ['Concorrência', score.competition],
    ['Fit investidor', score.investorFit],
    ['Risco', score.risk],
  ].flatMap(([label, value]) => (
    typeof value === 'number' ? [{ label: label as string, value }] : []
  ))
}

function summarySnippet(opportunity: DecisionOpportunity) {
  return opportunity.aiSummary?.headline
    ?? opportunity.aiSummary?.investor_angle
    ?? jsonStrings(opportunity.score?.signals, 1)[0]
    ?? 'Sem resumo IA ainda. Use o painel para regenerar quando houver score e contexto local.'
}

function filterOpportunities(opportunities: DecisionOpportunity[], filters: FilterState) {
  const query = filters.query.trim().toLowerCase()
  const minScore = filters.minScore.trim() ? Number(filters.minScore) : null

  return opportunities
    .filter((opportunity) => {
      const haystack = [
        opportunity.title,
        opportunity.address,
        opportunity.location,
        opportunity.propertyType,
        opportunity.commercialType,
      ].filter(Boolean).join(' ').toLowerCase()

      if (query && !haystack.includes(query)) return false
      if (minScore !== null && Number.isFinite(minScore) && opportunityScore(opportunity) < minScore) return false
      if (filters.propertyType !== ALL && opportunity.propertyType !== filters.propertyType) return false
      if (filters.enrichmentStatus !== ALL && opportunity.enrichmentStatus !== filters.enrichmentStatus) return false
      if (filters.businessTag !== ALL && !fitTags(opportunity).includes(filters.businessTag)) return false

      if (filters.matchFilter === 'has' && opportunity.investorMatches.length === 0) return false
      if (filters.matchFilter === 'none' && opportunity.investorMatches.length > 0) return false
      if (
        ![ALL, 'has', 'none'].includes(filters.matchFilter)
        && opportunity.matchingStatus !== filters.matchFilter
      ) return false

      return true
    })
    .sort((a, b) => opportunityScore(b) - opportunityScore(a))
}

function SelectFilter({
  label,
  value,
  onChange,
  children,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  children: ReactNode
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-10 bg-background">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>{children}</SelectContent>
      </Select>
    </div>
  )
}

function SelectedOpportunityPhoto({ opportunity }: { opportunity: DecisionOpportunity | null }) {
  const image = opportunity ? primaryImage(opportunity) : null

  return (
    <section className="min-h-[560px] rounded-md border border-border bg-card">
      <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Foto do imóvel selecionado</p>
          <h2 className="line-clamp-1 text-lg font-semibold text-foreground">
            {opportunity?.title ?? 'Nenhum imóvel selecionado'}
          </h2>
        </div>
        {opportunity && (
          <div className="flex flex-wrap gap-2 text-xs">
            <Badge variant="outline">{scoreLabel(opportunity.score?.total)}</Badge>
            <Badge variant={opportunity.investorMatches.length > 0 ? 'default' : 'outline'}>
              {opportunity.investorMatches.length} matches
            </Badge>
          </div>
        )}
      </div>

      <div className="relative h-[500px] overflow-hidden bg-muted">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageSrc(image)}
            alt={opportunity?.title ?? ''}
            className="size-full object-cover"
          />
        ) : (
          <div className="flex size-full flex-col items-center justify-center p-6 text-center">
            <Building2 className="mb-3 size-10 text-muted-foreground" />
            <h3 className="text-base font-semibold text-foreground">
              {opportunity ? 'Imóvel sem foto' : 'Nenhum imóvel selecionado'}
            </h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Selecione um card no ranking para ver a foto principal do imóvel.
            </p>
          </div>
        )}
        {opportunity && (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-16 text-white">
            <p className="line-clamp-1 text-sm font-semibold">{opportunity.title}</p>
            <p className="mt-1 line-clamp-1 text-xs text-white/80">
              {opportunity.address ?? opportunity.location ?? 'Sem endereço'}
            </p>
          </div>
        )}
      </div>
    </section>
  )
}

function OpportunityFeed({
  opportunities,
  selectedOpportunity,
  onSelect,
  cardRefs,
}: {
  opportunities: DecisionOpportunity[]
  selectedOpportunity: DecisionOpportunity | null
  onSelect: (opportunity: DecisionOpportunity) => void
  cardRefs: MutableRefObject<Map<string, HTMLButtonElement>>
}) {
  return (
    <section className="min-h-[560px] rounded-md border border-border bg-card">
      <div className="border-b border-border p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Ranking</p>
        <h2 className="text-lg font-semibold text-foreground">{opportunities.length} oportunidades</h2>
      </div>

      {opportunities.length === 0 ? (
        <div className="flex min-h-[480px] flex-col items-center justify-center p-6 text-center">
          <Filter className="mb-3 size-8 text-muted-foreground" />
          <h3 className="text-base font-semibold text-foreground">Nenhuma oportunidade nos filtros</h3>
          <p className="mt-1 text-sm text-muted-foreground">Ajuste busca, score ou status para voltar ao ranking.</p>
        </div>
      ) : (
        <div className="max-h-[500px] space-y-3 overflow-y-auto p-3">
          {opportunities.map((opportunity, index) => {
            const selected = selectedOpportunity?.id === opportunity.id
            const score = opportunity.score?.total ?? null
            const tags = fitTags(opportunity).slice(0, 3)

            return (
              <button
                key={opportunity.id}
                ref={(node) => {
                  if (node) cardRefs.current.set(opportunity.id, node)
                  else cardRefs.current.delete(opportunity.id)
                }}
                type="button"
                onClick={() => onSelect(opportunity)}
                className={cn(
                  'w-full rounded-md border bg-background p-4 text-left transition-colors hover:border-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/15',
                  selected ? 'border-foreground' : 'border-border'
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground">#{index + 1}</span>
                      <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">{opportunity.title}</h3>
                    </div>
                    <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                      {opportunity.address ?? opportunity.location ?? 'Sem endereço'}
                    </p>
                  </div>
                  <div className={cn(
                    'flex size-12 shrink-0 items-center justify-center rounded-md border text-base font-semibold',
                    scoreTone(opportunityScore(opportunity)) === 'high' && 'border-emerald-200 bg-emerald-50 text-emerald-700',
                    scoreTone(opportunityScore(opportunity)) === 'medium' && 'border-amber-200 bg-amber-50 text-amber-700',
                    scoreTone(opportunityScore(opportunity)) === 'low' && 'border-zinc-200 bg-zinc-100 text-zinc-700'
                  )}>
                    {scoreLabel(score)}
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {formatMoney(opportunity) && <Badge variant="outline">{formatMoney(opportunity)}</Badge>}
                  {opportunity.propertyType && <Badge variant="outline">{opportunity.propertyType}</Badge>}
                  <Badge variant={opportunity.investorMatches.length > 0 ? 'default' : 'outline'}>
                    {opportunity.investorMatches.length} matches
                  </Badge>
                  {opportunity.aiSummary?.confidence && (
                    <Badge variant={confidenceVariant(opportunity.aiSummary.confidence)}>
                      confiança {CONFIDENCE_LABELS[opportunity.aiSummary.confidence] ?? opportunity.aiSummary.confidence}
                    </Badge>
                  )}
                  {opportunity.confidence !== null && (
                    <Badge variant="outline">{opportunity.confidence}% comercial</Badge>
                  )}
                </div>

                {tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {tags.map((tag, tagIndex) => (
                      <span key={`${opportunity.id}-feed-tag-${tagIndex}-${tag}`} className="rounded-full bg-muted px-2 py-1 text-[11px] font-medium text-muted-foreground">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                  {summarySnippet(opportunity)}
                </p>
              </button>
            )
          })}
        </div>
      )}
    </section>
  )
}

function ActionButtons({ opportunity }: { opportunity: DecisionOpportunity }) {
  const router = useRouter()
  const [enrichPending, startEnrichTransition] = useTransition()
  const [matchPending, startMatchTransition] = useTransition()
  const [summaryPending, startSummaryTransition] = useTransition()

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={enrichPending}
        onClick={() => {
          startEnrichTransition(async () => {
            const result = await enrichListingLocationAction(opportunity.id)
            if (result.errors?.general?.[0]) toast.error(result.errors.general[0])
            else toast.success(result.message ?? 'Ponto reenriquecido.')
            router.refresh()
          })
        }}
      >
        {enrichPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Sparkles className="mr-2 size-4" />}
        Reenriquecer
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={matchPending}
        onClick={() => {
          startMatchTransition(async () => {
            const result = await recalculateListingMatchesAction(opportunity.id)
            if (result.errors?.general?.[0]) toast.error(result.errors.general[0])
            else toast.success(result.message ?? 'Matches recalculados.')
            router.refresh()
          })
        }}
      >
        {matchPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <RefreshCw className="mr-2 size-4" />}
        Recalcular matches
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={summaryPending}
        onClick={() => {
          startSummaryTransition(async () => {
            const result = await regenerateAiDealSummaryAction(opportunity.id)
            if (result.ok) toast.success(result.message)
            else toast.error(result.message)
            router.refresh()
          })
        }}
      >
        {summaryPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Sparkles className="mr-2 size-4" />}
        Regenerar IA
      </Button>
      <Button asChild size="sm" variant="ghost">
        <Link href={`/imoveis/${opportunity.id}`}>
          <ArrowUpRight className="mr-2 size-4" />
          Ver detalhe
        </Link>
      </Button>
    </div>
  )
}

function IntelligencePanel({ opportunity }: { opportunity: DecisionOpportunity | null }) {
  if (!opportunity) {
    return (
      <section className="rounded-md border border-border bg-card p-8 text-center">
        <Target className="mx-auto mb-3 size-8 text-muted-foreground" />
        <h2 className="text-base font-semibold text-foreground">Selecione uma oportunidade</h2>
        <p className="mt-1 text-sm text-muted-foreground">Clique em um pin ou card para abrir a inteligência do ponto.</p>
      </section>
    )
  }

  const breakdown = scoreBreakdown(opportunity)
  const risks = [
    ...(opportunity.aiSummary?.risks ?? []),
    ...jsonStrings(opportunity.score?.risks, 3),
  ].slice(0, 4)

  return (
    <section className="rounded-md border border-border bg-card">
      <div className="border-b border-border p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={statusVariant(opportunity.enrichmentStatus)}>Enriq. {STATUS_LABELS[opportunity.enrichmentStatus] ?? opportunity.enrichmentStatus}</Badge>
              <Badge variant={statusVariant(opportunity.matchingStatus)}>Match {STATUS_LABELS[opportunity.matchingStatus] ?? opportunity.matchingStatus}</Badge>
              {opportunity.aiSummary?.confidence && (
                <Badge variant={confidenceVariant(opportunity.aiSummary.confidence)}>
                  IA {CONFIDENCE_LABELS[opportunity.aiSummary.confidence] ?? opportunity.aiSummary.confidence}
                </Badge>
              )}
            </div>
            <h2 className="mt-3 text-2xl font-semibold leading-tight text-foreground">{opportunity.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{opportunity.address ?? opportunity.location ?? 'Sem endereço'}</p>
          </div>
          <ActionButtons opportunity={opportunity} />
        </div>
      </div>

      <div className="grid gap-5 p-5 xl:grid-cols-[0.9fr_1.1fr_1fr]">
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-md border border-border bg-background p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Score universal</p>
              <p className="mt-2 text-3xl font-semibold text-foreground">{scoreLabel(opportunity.score?.total)}</p>
              {opportunity.score?.fitLabel && <p className="mt-1 text-xs text-muted-foreground">{opportunity.score.fitLabel}</p>}
            </div>
            <div className="rounded-md border border-border bg-background p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Investidores</p>
              <p className="mt-2 text-3xl font-semibold text-foreground">{opportunity.investorMatches.length}</p>
              <p className="mt-1 text-xs text-muted-foreground">matches persistidos</p>
            </div>
          </div>

          <div className="rounded-md border border-border bg-background p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Dados do ponto</p>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Tipo</dt><dd className="text-right text-foreground">{opportunity.propertyType ?? '-'}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Preço</dt><dd className="text-right text-foreground">{formatMoney(opportunity) ?? '-'}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Área</dt><dd className="text-right text-foreground">-</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Processado</dt><dd className="text-right text-foreground">{formatDate(opportunity.lastProcessedAt)}</dd></div>
            </dl>
          </div>

          {breakdown.length > 0 && (
            <div className="rounded-md border border-border bg-background p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Detalhamento do score</p>
              <div className="mt-3 space-y-2">
                {breakdown.map((item) => (
                  <div key={item.label}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className="font-medium text-foreground">{scoreLabel(item.value)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div className="h-2 rounded-full bg-foreground" style={{ width: `${Math.min(Math.max(item.value, 0), 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="rounded-md border border-border bg-background p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Resumo IA do negócio</p>
              <span className="text-xs text-muted-foreground">{formatDate(opportunity.aiSummaryGeneratedAt)}</span>
            </div>
            {opportunity.aiSummary ? (
              <div className="mt-3 space-y-4">
                <div>
                  <h3 className="text-base font-semibold text-foreground">{opportunity.aiSummary.headline}</h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {opportunity.aiSummary.best_fit.map((fit, fitIndex) => (
                      <Badge key={`${opportunity.id}-best-fit-${fitIndex}-${fit}`} variant="outline">{fit}</Badge>
                    ))}
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Forças</p>
                    <ul className="mt-2 space-y-1 text-sm text-foreground">
                      {opportunity.aiSummary.strengths.map((item, itemIndex) => (
                        <li key={`${opportunity.id}-strength-${itemIndex}-${item}`}>- {item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Riscos</p>
                    <ul className="mt-2 space-y-1 text-sm text-foreground">
                      {opportunity.aiSummary.risks.map((item, itemIndex) => (
                        <li key={`${opportunity.id}-summary-risk-${itemIndex}-${item}`}>- {item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Ângulo do investidor</p>
                  <p className="mt-2 text-sm leading-relaxed text-foreground">{opportunity.aiSummary.investor_angle}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Ação recomendada</p>
                  <p className="mt-2 text-sm leading-relaxed text-foreground">{opportunity.aiSummary.recommended_action}</p>
                </div>
              </div>
            ) : (
              <div className="mt-3 rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
                Status: {STATUS_LABELS[opportunity.aiSummaryStatus] ?? opportunity.aiSummaryStatus}. Gere o resumo quando houver enriquecimento e score.
              </div>
            )}
          </div>

          {risks.length > 0 && (
            <div className="rounded-md border border-border bg-background p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Risco / confiança</p>
              <div className="mt-3 space-y-2">
                {risks.map((risk, riskIndex) => (
                  <div key={`${opportunity.id}-risk-${riskIndex}-${risk}`} className="flex gap-2 text-sm text-foreground">
                    <CircleAlert className="mt-0.5 size-4 shrink-0 text-amber-600" />
                    <span>{risk}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="rounded-md border border-border bg-background p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Matches de investidores</p>
            {opportunity.investorMatches.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">Nenhum match persistido ainda.</p>
            ) : (
              <div className="mt-3 space-y-3">
                {opportunity.investorMatches.slice(0, 4).map((match) => (
                  <div key={match.id} className="rounded-md border border-border bg-card p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{match.investorName}</p>
                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{match.explanation}</p>
                      </div>
                      <Badge variant={match.matchScore >= 75 ? 'default' : 'outline'}>{Math.round(match.matchScore)}</Badge>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {[...match.investorTags, ...match.investorPreferences, ...match.reasons].slice(0, 5).map((tag, tagIndex) => (
                        <span key={`${match.id}-tag-${tagIndex}-${tag}`} className="rounded-full bg-muted px-2 py-1 text-[11px] text-muted-foreground">{tag}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-md border border-border bg-background p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Inteligência local</p>
            {opportunity.localIntelligence ? (
              <div className="mt-3 space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 size-4 text-emerald-600" />
                  <p className="text-foreground">{opportunity.localIntelligence.consumerProfile ?? 'Perfil de consumo indisponível.'}</p>
                </div>
                <dl className="grid grid-cols-2 gap-3">
                  <div><dt className="text-xs text-muted-foreground">Renda média</dt><dd className="font-medium text-foreground">{formatNumber(opportunity.localIntelligence.avgIncome)}</dd></div>
                  <div><dt className="text-xs text-muted-foreground">Densidade</dt><dd className="font-medium text-foreground">{formatNumber(opportunity.localIntelligence.populationDensity)}</dd></div>
                  <div><dt className="text-xs text-muted-foreground">Confiança</dt><dd className="font-medium text-foreground">{formatNumber(opportunity.localIntelligence.confidenceScore)}</dd></div>
                  <div><dt className="text-xs text-muted-foreground">Atualizado</dt><dd className="font-medium text-foreground">{formatDate(opportunity.localIntelligence.updatedAt)}</dd></div>
                </dl>
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">Sem enriquecimento local.</p>
            )}
          </div>

          <div className="rounded-md border border-border bg-background p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Negócios próximos</p>
            {opportunity.nearbyBusinesses.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
                Indisponível até uma fonte confiável retornar negócios reais.
              </p>
            ) : (
              <div className="mt-3 space-y-2">
                {opportunity.nearbyBusinesses.slice(0, 5).map((business, index) => (
                  <div key={`${business.name}-${index}`} className="flex items-center justify-between gap-3 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">{business.name ?? 'Negócio local'}</p>
                      <p className="text-xs text-muted-foreground">{business.category ?? '-'}</p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {business.distanceMeters !== null ? `${Math.round(business.distanceMeters)}m` : '-'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export function DecisionSurface({ opportunities, loadError }: Props) {
  const [filters, setFilters] = useState<FilterState>({
    query: '',
    minScore: '',
    propertyType: ALL,
    matchFilter: ALL,
    enrichmentStatus: ALL,
    businessTag: ALL,
  })
  const [selectedOpportunity, setSelectedOpportunity] = useState<DecisionOpportunity | null>(() => {
    const ranked = [...opportunities].sort((a, b) => opportunityScore(b) - opportunityScore(a))
    return ranked[0] ?? null
  })
  const cardRefs = useRef(new Map<string, HTMLButtonElement>())

  const propertyTypes = useMemo(
    () => uniqueSorted(opportunities.map((opportunity) => opportunity.propertyType)),
    [opportunities]
  )
  const enrichmentStatuses = useMemo(
    () => uniqueSorted(opportunities.map((opportunity) => opportunity.enrichmentStatus)),
    [opportunities]
  )
  const businessTags = useMemo(
    () => uniqueSorted(opportunities.flatMap(fitTags)),
    [opportunities]
  )
  const filteredOpportunities = useMemo(
    () => filterOpportunities(opportunities, filters),
    [opportunities, filters]
  )

  useEffect(() => {
    if (filteredOpportunities.length === 0) {
      setSelectedOpportunity(null)
      return
    }

    const refreshedSelection = selectedOpportunity
      ? filteredOpportunities.find((opportunity) => opportunity.id === selectedOpportunity.id)
      : null

    if (!refreshedSelection) {
      setSelectedOpportunity(filteredOpportunities[0])
      return
    }

    if (refreshedSelection !== selectedOpportunity) {
      setSelectedOpportunity(refreshedSelection)
    }
  }, [filteredOpportunities, selectedOpportunity])

  useEffect(() => {
    if (!selectedOpportunity) return
    cardRefs.current.get(selectedOpportunity.id)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [selectedOpportunity])

  const photoCount = opportunities.filter((opportunity) => Boolean(primaryImage(opportunity))).length
  const highCount = opportunities.filter((opportunity) => opportunityScore(opportunity) >= 80).length
  const matchCount = opportunities.filter((opportunity) => opportunity.investorMatches.length > 0).length

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Superfície de decisão V1</p>
          <h1 className="text-3xl font-semibold leading-tight text-foreground">Terminal de oportunidades comerciais</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Foto do imóvel selecionado, ranking, score universal, resumo IA, matches de investidores e inteligência local em uma tela operacional.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-md border border-border bg-card px-4 py-3">
            <p className="text-xl font-semibold text-foreground">{opportunities.length}</p>
            <p className="text-xs text-muted-foreground">pontos</p>
          </div>
          <div className="rounded-md border border-border bg-card px-4 py-3">
            <p className="text-xl font-semibold text-foreground">{highCount}</p>
            <p className="text-xs text-muted-foreground">80+</p>
          </div>
          <div className="rounded-md border border-border bg-card px-4 py-3">
            <p className="text-xl font-semibold text-foreground">{matchCount}</p>
            <p className="text-xs text-muted-foreground">com match</p>
          </div>
        </div>
      </div>

      {loadError && (
        <div className="rounded-md border border-destructive/25 bg-destructive/10 p-4 text-sm text-destructive">
          {loadError}
        </div>
      )}

      <section className="rounded-md border border-border bg-card p-4">
        <div className="grid gap-3 xl:grid-cols-[1.3fr_0.5fr_0.75fr_0.75fr_0.75fr_0.9fr]">
          <div className="space-y-2">
            <Label htmlFor="decision-search" className="text-xs">Buscar título/endereço</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="decision-search"
                value={filters.query}
                onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))}
                placeholder="Nome, rua, bairro..."
                className="h-10 bg-background pl-9"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="decision-min-score" className="text-xs">Score mínimo</Label>
            <Input
              id="decision-min-score"
              type="number"
              min={0}
              max={100}
              value={filters.minScore}
              onChange={(event) => setFilters((current) => ({ ...current, minScore: event.target.value }))}
              placeholder="60"
              className="h-10 bg-background"
            />
          </div>
          <SelectFilter
            label="Tipo"
            value={filters.propertyType}
            onChange={(propertyType) => setFilters((current) => ({ ...current, propertyType }))}
          >
            <SelectItem value={ALL}>Todos</SelectItem>
            {propertyTypes.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}
          </SelectFilter>
          <SelectFilter
            label="Matches"
            value={filters.matchFilter}
            onChange={(matchFilter) => setFilters((current) => ({ ...current, matchFilter }))}
          >
            <SelectItem value={ALL}>Todos</SelectItem>
            <SelectItem value="has">Com matches</SelectItem>
            <SelectItem value="none">Sem matches</SelectItem>
            <SelectItem value="completed">Concluído</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="processing">Processando</SelectItem>
            <SelectItem value="failed">Falhou</SelectItem>
          </SelectFilter>
          <SelectFilter
            label="Enriquecimento"
            value={filters.enrichmentStatus}
            onChange={(enrichmentStatus) => setFilters((current) => ({ ...current, enrichmentStatus }))}
          >
            <SelectItem value={ALL}>Todos</SelectItem>
            {enrichmentStatuses.map((status) => <SelectItem key={status} value={status}>{STATUS_LABELS[status] ?? status}</SelectItem>)}
          </SelectFilter>
          <SelectFilter
            label="Fit/tag"
            value={filters.businessTag}
            onChange={(businessTag) => setFilters((current) => ({ ...current, businessTag }))}
          >
            <SelectItem value={ALL}>Todos</SelectItem>
            {businessTags.map((tag) => <SelectItem key={tag} value={tag}>{tag}</SelectItem>)}
          </SelectFilter>
        </div>
      </section>

      {opportunities.length === 0 && !loadError ? (
        <div className="flex min-h-[420px] flex-col items-center justify-center rounded-md border border-border bg-card px-6 text-center">
          <Building2 className="mb-4 size-10 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">Nenhum ponto comercial ainda</h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Importe pesquisas ou crie enriquecimentos para alimentar a superfície de decisão.
          </p>
          <Button asChild className="mt-5">
            <Link href="/listings/import">
              <ExternalLink className="mr-2 size-4" />
              Abrir pesquisas
            </Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
            <SelectedOpportunityPhoto opportunity={selectedOpportunity} />
            <OpportunityFeed
              opportunities={filteredOpportunities}
              selectedOpportunity={selectedOpportunity}
              onSelect={setSelectedOpportunity}
              cardRefs={cardRefs}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>{filteredOpportunities.length} no filtro</span>
            <span>·</span>
            <span>{photoCount} com foto</span>
            <span>·</span>
            <span>{opportunities.length - photoCount} sem foto</span>
          </div>

          <IntelligencePanel opportunity={selectedOpportunity} />
        </>
      )}
    </div>
  )
}

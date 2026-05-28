'use client'

import { useTransition } from 'react'
import { Loader2, RefreshCw, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { regenerateAiDealSummaryAction } from '@/lib/actions/ai-summary-actions'
import type { AiDealSummary } from '@/lib/ai/deal-summary-schema'
import type { Database } from '@/types/supabase'

type AiSummaryRow = Database['public']['Tables']['listing_ai_summaries']['Row']

type Props = {
  listingId: string
  summaryRow: AiSummaryRow | null
  summary: AiDealSummary | null
}

function statusVariant(status: string | null | undefined) {
  if (status === 'failed') return 'destructive' as const
  if (status === 'completed') return 'default' as const
  if (status === 'processing') return 'outline' as const
  return 'secondary' as const
}

function confidenceVariant(confidence: string) {
  if (confidence === 'high') return 'default' as const
  if (confidence === 'medium') return 'outline' as const
  return 'secondary' as const
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente',
  processing: 'Processando',
  completed: 'Concluído',
  failed: 'Falhou',
}

const CONFIDENCE_LABELS: Record<string, string> = {
  low: 'baixa',
  medium: 'média',
  high: 'alta',
}

function formatDate(value: string | null | undefined) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('pt-BR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export function AiDealSummaryCard({ listingId, summaryRow, summary }: Props) {
  const [isPending, startTransition] = useTransition()
  const status = summaryRow?.status ?? 'pending'

  return (
    <div className="space-y-4 rounded-md border border-border bg-card p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Resumo IA do negócio</p>
          <h2 className="text-lg font-semibold text-foreground">Resumo comercial do ponto</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {summaryRow?.provider && summaryRow?.model
              ? `${summaryRow.provider} · ${summaryRow.model} · ${formatDate(summaryRow.generated_at)}`
              : 'Gerado após enriquecimento e score universal.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant={statusVariant(status)}>{STATUS_LABELS[status] ?? status}</Badge>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() => {
              startTransition(async () => {
                const result = await regenerateAiDealSummaryAction(listingId)
                if (result.ok) toast.success(result.message)
                else toast.error(result.message)
              })
            }}
          >
            {isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <RefreshCw className="mr-2 size-4" />}
            Regenerar resumo IA
          </Button>
        </div>
      </div>

      {status === 'processing' && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Gerando resumo...
        </div>
      )}

      {status === 'failed' && (
        <div className="rounded-md border border-destructive/25 bg-destructive/10 p-3 text-sm text-destructive">
          {summaryRow?.error_message ?? 'Resumo IA indisponível.'}
        </div>
      )}

      {!summary && status !== 'processing' && status !== 'failed' && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="size-4" />
          O resumo IA fica disponível após enriquecimento, score e configuração do provedor.
        </div>
      )}

      {summary && (
        <div className="space-y-5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold text-foreground">{summary.headline}</h3>
              <Badge variant={confidenceVariant(summary.confidence)}>confiança {CONFIDENCE_LABELS[summary.confidence] ?? summary.confidence}</Badge>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Melhor encaixe</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {summary.best_fit.map((item) => (
                <Badge key={item} variant="outline">{item}</Badge>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Pontos fortes</p>
              <ul className="mt-2 space-y-1 text-sm text-foreground">
                {summary.strengths.map((item) => <li key={item}>- {item}</li>)}
              </ul>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Riscos</p>
              <ul className="mt-2 space-y-1 text-sm text-foreground">
                {summary.risks.map((item) => <li key={item}>- {item}</li>)}
              </ul>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Ângulo do investidor</p>
              <p className="mt-2 text-sm leading-relaxed text-foreground">{summary.investor_angle}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Ação recomendada</p>
              <p className="mt-2 text-sm leading-relaxed text-foreground">{summary.recommended_action}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

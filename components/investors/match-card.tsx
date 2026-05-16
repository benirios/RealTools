import { ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { InvestorDealMatch } from '@/lib/investors/matching'

type Listing = {
  id: string
  title: string
  price_text: string | null
  price_amount: number | null
  neighborhood: string | null
  location_text: string | null
  city: string | null
  state: string | null
  property_type: string | null
  commercial_type: string | null
  tags?: string[] | null
  source_url: string
}

type Props = InvestorDealMatch & {
  deal: Listing
}

function statusVariant(status: string) {
  if (status === 'strong') return 'default' as const
  if (status === 'medium') return 'outline' as const
  return 'secondary' as const
}

export function MatchCard({
  deal,
  match_score,
  match_status,
  confidence,
  explanation,
  strengths,
  concerns,
  recommended_action,
  breakdown,
}: Props) {
  const location = deal.neighborhood ?? deal.location_text ?? ([deal.city, deal.state].filter(Boolean).join(', ') || '-')
  const propertyType = deal.property_type ?? deal.commercial_type ?? '-'

  return (
    <div className="rounded-md border border-border bg-card p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-foreground">{deal.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{location}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Badge variant={statusVariant(match_status)}>{match_status}</Badge>
          <Badge variant="outline">{confidence}</Badge>
          <span className="text-2xl font-semibold text-foreground">{match_score}%</span>
        </div>
      </div>

      <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
        <div>
          <p className="text-xs uppercase text-muted-foreground">Preço</p>
          <p className="font-medium text-foreground">{deal.price_text ?? (deal.price_amount ? `R$ ${Number(deal.price_amount).toLocaleString('pt-BR')}` : '-')}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-muted-foreground">Tipo de imóvel</p>
          <p className="font-medium text-foreground">{propertyType}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-muted-foreground">Detalhamento</p>
          <p className="text-muted-foreground">
            B {breakdown.budget_fit} / L {breakdown.location_fit} / T {breakdown.property_type_fit} / S {breakdown.strategy_fit} / R {breakdown.risk_fit} / Tag {breakdown.tag_fit} / Q {breakdown.opportunity_quality}
          </p>
        </div>
      </div>

      <p className="mt-4 text-sm text-foreground">{explanation}</p>
      {recommended_action && (
        <p className="mt-2 text-sm font-medium text-foreground">{recommended_action}</p>
      )}

      {deal.tags && deal.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {deal.tags.slice(0, 6).map((tag) => (
            <span key={tag} className="rounded-full border border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-md border border-border bg-muted/25 p-3">
          <p className="text-xs font-medium uppercase text-muted-foreground">Forcas</p>
          {strengths.length > 0 ? (
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              {strengths.map((strength) => <li key={strength}>{strength}</li>)}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">Sem forcas principais registradas.</p>
          )}
        </div>
        <div className="rounded-md border border-border bg-muted/25 p-3">
          <p className="text-xs font-medium uppercase text-muted-foreground">Pontos de atencao</p>
          {concerns.length > 0 ? (
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              {concerns.map((concern) => <li key={concern}>{concern}</li>)}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">Sem preocupacoes principais registradas.</p>
          )}
        </div>
      </div>

      <Button asChild variant="outline" size="sm" className="mt-4">
        <a href={deal.source_url} target="_blank" rel="noreferrer">
          <ExternalLink className="mr-2 size-4" />
          Fonte
        </a>
      </Button>
    </div>
  )
}

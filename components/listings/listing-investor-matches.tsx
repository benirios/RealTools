import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { PersistedListingMatch } from '@/lib/investors/match-processing'

function statusVariant(status: string) {
  if (status === 'strong') return 'default' as const
  if (status === 'medium') return 'outline' as const
  return 'secondary' as const
}

function formatDate(value: string | null) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('pt-BR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export function ListingInvestorMatches({ matches }: { matches: PersistedListingMatch[] }) {
  return (
    <div className="space-y-4 rounded-md border border-border bg-card p-5">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Matches de investidores</p>
        <h2 className="text-lg font-semibold text-foreground">Compatibilidade ranqueada</h2>
      </div>

      {matches.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhum match persistido ainda. Recalcule os matches deste imóvel para preencher esta seção.
        </p>
      ) : (
        <div className="grid gap-3">
          {matches.map((match) => (
            <div key={match.id} className="rounded-md border border-border bg-muted/25 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <Link href={`/investors/${match.investor.id}`} className="font-medium text-foreground hover:underline">
                    {match.investor.name}
                  </Link>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {match.investor.strategy} · risco {match.investor.risk_level} · {formatDate(match.processed_at)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={statusVariant(match.match_status)}>{match.match_status}</Badge>
                  <Badge variant="outline">{match.confidence}</Badge>
                  <span className="text-2xl font-semibold text-foreground">{match.match_score}%</span>
                </div>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{match.explanation}</p>
              {match.recommended_action && (
                <p className="mt-2 text-sm font-medium text-foreground">{match.recommended_action}</p>
              )}
              <div className="mt-3 grid gap-3 text-sm md:grid-cols-2">
                <div className="rounded-md border border-border bg-background/50 p-3">
                  <p className="text-xs font-medium uppercase text-muted-foreground">Forcas</p>
                  {match.strengths.length > 0 ? (
                    <ul className="mt-2 space-y-1 text-muted-foreground">
                      {match.strengths.slice(0, 3).map((strength) => <li key={strength}>{strength}</li>)}
                    </ul>
                  ) : (
                    <p className="mt-2 text-muted-foreground">Sem forcas principais registradas.</p>
                  )}
                </div>
                <div className="rounded-md border border-border bg-background/50 p-3">
                  <p className="text-xs font-medium uppercase text-muted-foreground">Pontos de atencao</p>
                  {match.concerns.length > 0 ? (
                    <ul className="mt-2 space-y-1 text-muted-foreground">
                      {match.concerns.slice(0, 3).map((concern) => <li key={concern}>{concern}</li>)}
                    </ul>
                  ) : (
                    <p className="mt-2 text-muted-foreground">Sem preocupacoes principais registradas.</p>
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
          ))}
        </div>
      )}
    </div>
  )
}

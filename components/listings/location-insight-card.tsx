import { Badge } from '@/components/ui/badge'
import type { LocationDataSource, LocationInsightPersisted, NearbyBusiness } from '@/lib/schemas/location-insight'

function formatCurrency(value: number | null | undefined) {
  if (value === null || value === undefined) return '-'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined) return '-'
  return new Intl.NumberFormat('pt-BR', {
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDistance(value: number | null | undefined) {
  if (value === null || value === undefined) return null
  if (value < 1000) return `${formatNumber(value)} m`
  return `${(value / 1000).toFixed(1)} km`
}

export function LocationInsightCard({ insight }: { insight: LocationInsightPersisted }) {
  const businesses = ((Array.isArray(insight.nearbyBusinesses) ? insight.nearbyBusinesses : []) as NearbyBusiness[])
    .filter((business) => {
      const source = String(business.source ?? '').toLowerCase()
      return source !== 'mock' && source !== 'mock_places' && source !== 'demo'
    })
  const sources = (Array.isArray(insight.dataSources) ? insight.dataSources : []) as LocationDataSource[]

  return (
    <div className="space-y-5 rounded-md border border-border bg-card p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Inteligência de localização</p>
          <h2 className="text-lg font-semibold text-foreground">Contexto da área</h2>
        </div>
        <div className="flex items-center gap-2">
          {insight.confidenceScore != null && (
            <Badge variant="outline">{insight.confidenceScore}% confiança</Badge>
          )}
          <Badge variant="secondary">{insight.city}, {insight.state}</Badge>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Renda média</p>
          <p className="text-sm font-medium text-foreground">{formatCurrency(insight.avgIncome)}</p>
        </div>

        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Densidade populacional</p>
          <p className="text-sm font-medium text-foreground">
            {insight.populationDensity != null ? `${formatNumber(insight.populationDensity)} hab/km²` : '-'}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Perfil consumidor</p>
        <p className="text-sm leading-relaxed text-foreground">{insight.consumerProfile ?? '-'}</p>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Negócios próximos</p>
        {businesses.length > 0 ? (
          <ul className="grid gap-2 sm:grid-cols-2">
            {businesses.map((business, index) => (
              <li key={`${business.name ?? 'business'}-${index}`} className="rounded-md border border-border bg-muted/40 px-3 py-2">
                <p className="text-sm font-medium text-foreground">{business.name ?? 'Negócio próximo'}</p>
                <p className="text-xs text-muted-foreground">
                  {[business.category, formatDistance(business.distanceMeters)].filter(Boolean).join(' · ')}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            Negócios próximos indisponíveis. Esta seção só aparece quando uma fonte confiável, como Google Places, retorna dados reais.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Fontes</p>
        {sources.length > 0 ? (
          <ul className="space-y-1 text-sm text-muted-foreground">
            {sources.map((source, index) => (
              <li key={`${source.provider ?? 'source'}-${index}`}>
                <span className="font-medium text-foreground">{source.provider ?? 'source'}</span>
                {' '}
                {source.note ?? ''}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Sem fontes registradas.</p>
        )}
      </div>
    </div>
  )
}

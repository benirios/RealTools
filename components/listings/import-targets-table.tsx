import { Badge } from '@/components/ui/badge'
import { RunOlxImportButton } from '@/components/listings/import-actions'

export type ImportTarget = {
  id: string
  source: string
  country: string
  state: string
  city: string
  search_term: string
  is_active: boolean
}

export function ImportTargetsTable({ targets }: { targets: ImportTarget[] }) {
  if (targets.length === 0) {
    return (
      <div className="rounded-md border border-border bg-card p-6 text-sm text-muted-foreground">
        Nenhum alvo de importação ainda.
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-md border border-border bg-card">
      <div className="hidden grid-cols-[0.8fr_0.7fr_1fr_1.2fr_0.7fr_auto] gap-4 border-b border-border bg-secondary px-4 py-3 md:grid">
        {['Fonte', 'Estado', 'Cidade', 'Termo de busca', 'Status', 'Ação'].map((label) => (
          <span key={label} className="text-[11px] font-medium uppercase text-muted-foreground">{label}</span>
        ))}
      </div>
      <div className="divide-y divide-border/70">
        {targets.map((target) => (
          <div
            key={target.id}
            className="grid gap-3 px-4 py-4 md:grid-cols-[0.8fr_0.7fr_1fr_1.2fr_0.7fr_auto] md:items-center"
          >
            <span className="text-sm font-medium text-foreground">{target.source}</span>
            <span className="text-sm text-muted-foreground">{target.state}</span>
            <span className="text-sm text-muted-foreground">{target.city}</span>
            <span className="text-sm text-muted-foreground">{target.search_term}</span>
            <Badge variant={target.is_active ? 'default' : 'outline'}>
              {target.is_active ? 'Ativo' : 'Inativo'}
            </Badge>
            <div className="md:text-right">
              {target.source === 'olx' && target.is_active ? (
                <RunOlxImportButton targetId={target.id} />
              ) : (
                <span className="text-xs text-muted-foreground">Somente manual</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

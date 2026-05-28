import Link from 'next/link'
import { ArrowRight, MapPin } from 'lucide-react'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

// Status badge config — D-13: subtle semantic tint + border, no saturated fills
const statusConfig = {
  active:      { label: 'Ativo',           className: 'bg-foreground text-background border border-foreground' },
  negotiating: { label: 'Em negociação',   className: 'bg-card text-foreground border border-foreground' },
  closed:      { label: 'Fechado',         className: 'bg-muted text-muted-foreground border border-border' },
} as const

export function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status as keyof typeof statusConfig] ?? statusConfig.active
  return <Badge className={config.className}>{config.label}</Badge>
}

type Deal = {
  id: string
  title: string
  address: string | null
  price: string | null
  status: string
}

export function DealCard({ deal }: { deal: Deal }) {
  return (
    <Link href={`/deals/${deal.id}`} className="block group">
      <Card className="border-border bg-card transition-colors hover:border-foreground">
        <CardContent className="pt-6 pb-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <h3 className="text-[15px] font-medium text-foreground leading-snug">{deal.title}</h3>
            <StatusBadge status={deal.status} />
          </div>
          {deal.address && (
            <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="size-4 shrink-0" />
              <span className="truncate">{deal.address}</span>
            </p>
          )}
          {deal.price && (
            <p className="text-sm font-medium text-foreground mt-1">{deal.price}</p>
          )}
        </CardContent>
        <CardFooter className="pb-5 pt-2">
          <span className="inline-flex items-center gap-1 text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground transition-colors group-hover:text-foreground">
            Abrir negócio
            <ArrowRight className="size-3.5" />
          </span>
        </CardFooter>
      </Card>
    </Link>
  )
}

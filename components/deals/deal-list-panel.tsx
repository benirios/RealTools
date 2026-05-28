'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Building2, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DealFormModal } from './deal-form-modal'

type Deal = {
  id: string
  title: string
  address: string | null
  price: string | null
  status: string
  created_at: string | null
  description: string | null
}

function relativeTime(dateStr: string | null): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / 86_400_000)
  if (diffDays === 0) return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  if (diffDays === 1) return 'Ontem'
  if (diffDays < 7) return ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][date.getDay()]
  return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
}

const statusColor: Record<string, string> = {
  active: '#22c55e',
  negotiating: '#3b82f6',
  closed: '#6b7280',
}
const statusLabel: Record<string, string> = {
  active: 'Ativo',
  negotiating: 'Negociando',
  closed: 'Fechado',
}

export function DealListPanel({
  deals,
  selectedId,
  statusFilter,
}: {
  deals: Deal[]
  selectedId: string
  statusFilter: string
}) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    if (!query.trim()) return deals
    const q = query.toLowerCase()
    return deals.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        (d.address?.toLowerCase().includes(q) ?? false) ||
        (d.description?.toLowerCase().includes(q) ?? false)
    )
  }, [deals, query])

  return (
    <div className="flex w-[300px] shrink-0 flex-col border-r border-border">
      <div className="border-b border-border p-2">
        <div className="flex items-center gap-2 rounded-md bg-muted px-2.5 py-1.5">
          <Search className="size-3.5 shrink-0 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar negócios…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 px-4 py-16 text-center">
            <Building2 className="size-8 text-muted-foreground/30" />
            <p className="text-xs text-muted-foreground">
              {query ? 'Nenhum resultado.' : 'Nenhum negócio aqui.'}
            </p>
            {!query && (
              <DealFormModal
                trigger={
                  <button className="text-xs text-foreground underline underline-offset-2">
                    Criar primeiro negócio
                  </button>
                }
              />
            )}
          </div>
        ) : (
          filtered.map((deal) => {
            const color = statusColor[deal.status] ?? '#6b7280'
            const label = statusLabel[deal.status] ?? deal.status
            const href = `/dashboard${statusFilter ? `?status=${statusFilter}&selected=${deal.id}` : `?selected=${deal.id}`}`
            return (
              <Link
                key={deal.id}
                href={href}
                className={cn(
                  'block border-b border-border px-4 py-3 transition-colors hover:bg-accent/40',
                  selectedId === deal.id && 'bg-accent/60'
                )}
              >
                <div className="mb-1 flex items-start justify-between gap-2">
                  <span className="truncate text-[13px] font-medium text-foreground leading-snug">
                    {deal.title}
                  </span>
                  <span className="mt-0.5 shrink-0 text-[11px] text-muted-foreground">
                    {relativeTime(deal.created_at)}
                  </span>
                </div>
                <div className="mb-1 flex items-center gap-2">
                  <span className="flex items-center gap-1 text-[11px] font-medium" style={{ color }}>
                    <span className="size-1.5 rounded-full" style={{ backgroundColor: color }} />
                    {label}
                  </span>
                  {deal.price && (
                    <span className="text-[11px] font-medium" style={{ color }}>
                      {deal.price}
                    </span>
                  )}
                </div>
                {(deal.address ?? deal.description) && (
                  <p className="line-clamp-1 text-[11px] text-muted-foreground">
                    {deal.address ?? deal.description}
                  </p>
                )}
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}

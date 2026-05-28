'use client'

import { useCallback, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Building2, Loader2, MapPin, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import type { Database } from '@/types/supabase'

type ListingRow = Database['public']['Tables']['listings']['Row']
export type ListingSummary = Pick<
  ListingRow,
  'id' | 'title' | 'price_text' | 'price_amount' | 'city' | 'neighborhood' | 'state' | 'address_text' | 'location_text' | 'commercial_type' | 'property_type' | 'confidence' | 'source_url' | 'first_seen_at' | 'images'
> & {
  enrichment_status: string
  matching_status: string
}

function formatDate(value: string | null) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value))
}

function statusVariant(status: string) {
  if (status === 'failed') return 'destructive' as const
  if (status === 'completed') return 'default' as const
  return 'outline' as const
}

function formatPrice(listing: ListingSummary) {
  if (listing.price_text) return listing.price_text
  if (listing.price_amount === null || listing.price_amount === undefined) return null
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(Number(listing.price_amount))
}

export function ImoveisGrid({ listings }: { listings: ListingSummary[] }) {
  const router = useRouter()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteSingleId, setDeleteSingleId] = useState<string | null>(null)

  const allSelected = listings.length > 0 && listings.every((l) => selected.has(l.id))
  const someSelected = selected.size > 0

  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const toggleSelectAll = useCallback(() => {
    if (allSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(listings.map((l) => l.id)))
    }
  }, [allSelected, listings])

  async function runDelete(ids: string[]) {
    setDeleting(true)
    try {
      const res = await fetch('/api/imoveis/bulk', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Falha ao excluir')
      const count: number = data.deletedCount ?? ids.length
      toast.success(`${count} imóv${count !== 1 ? 'eis excluídos' : 'el excluído'} com sucesso.`)
      setSelected(new Set())
      setConfirmOpen(false)
      setDeleteSingleId(null)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Falha ao excluir imóveis.')
    } finally {
      setDeleting(false)
    }
  }

  function openBulkConfirm() {
    setDeleteSingleId(null)
    setConfirmOpen(true)
  }

  function openSingleConfirm(id: string) {
    setDeleteSingleId(id)
    setSelected(new Set())
    setConfirmOpen(true)
  }

  function handleConfirmClick(e: React.MouseEvent) {
    e.preventDefault()
    const ids = deleteSingleId ? [deleteSingleId] : Array.from(selected)
    runDelete(ids)
  }

  const pendingCount = deleteSingleId ? 1 : selected.size

  if (listings.length === 0) {
    return null
  }

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground select-none">
          <Checkbox
            checked={allSelected}
            onCheckedChange={toggleSelectAll}
            aria-label="Selecionar todos os visíveis"
          />
          {someSelected
            ? `${selected.size} selecionado${selected.size !== 1 ? 's' : ''}`
            : 'Selecionar todos'}
        </label>

        <Button
          variant="destructive"
          size="sm"
          disabled={!someSelected || deleting}
          onClick={openBulkConfirm}
        >
          <Trash2 className="mr-1.5 size-4" />
          Excluir selecionados
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {listings.map((listing) => {
          const thumb = listing.images?.[0]
          const location = [listing.neighborhood, listing.city, listing.state].filter(Boolean).join(', ')
          const isSelected = selected.has(listing.id)

          return (
            <div
              key={listing.id}
              className={`group relative isolate flex flex-col overflow-hidden rounded-lg border bg-card transition-colors hover:border-foreground ${isSelected ? 'border-foreground ring-2 ring-foreground/20' : 'border-border'}`}
            >
              {/* Checkbox overlay — top-left */}
              <div
                className="absolute left-2 top-2 z-10"
                onClick={(e) => e.stopPropagation()}
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => toggleSelect(listing.id)}
                  aria-label={`Selecionar ${listing.title}`}
                  className="bg-card/90 shadow"
                />
              </div>

              <Link
                href={`/imoveis/${listing.id}`}
                className="flex flex-1 flex-col"
                tabIndex={0}
              >
                {thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`/api/proxy-image?url=${encodeURIComponent(thumb)}`}
                    alt={listing.title}
                    className="h-44 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-44 items-center justify-center bg-secondary">
                    <Building2 className="size-10 text-muted-foreground/40" />
                  </div>
                )}

                <div className="flex flex-1 flex-col gap-3 p-4">
                  <div className="space-y-1">
                    <h2 className="line-clamp-2 text-sm font-medium leading-snug text-foreground">
                      {listing.title}
                    </h2>
                    {formatPrice(listing) && (
                      <p className="text-base font-semibold text-foreground">{formatPrice(listing)}</p>
                    )}
                  </div>

                  {location && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="size-3 shrink-0" />
                      <span className="truncate">{location}</span>
                    </div>
                  )}

                  <div className="mt-auto flex items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-1.5">
                      {listing.commercial_type && (
                        <Badge variant="outline" className="text-xs">{listing.commercial_type}</Badge>
                      )}
                      {listing.confidence != null && (
                        <Badge variant="outline" className="text-xs">
                          {listing.confidence}% comercial
                        </Badge>
                      )}
                      <Badge variant={statusVariant(listing.enrichment_status)} className="text-xs">
                        Enriq. {listing.enrichment_status}
                      </Badge>
                      <Badge variant={statusVariant(listing.matching_status)} className="text-xs">
                        Match {listing.matching_status}
                      </Badge>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">{formatDate(listing.first_seen_at)}</span>
                  </div>
                </div>
              </Link>

              {/* Single delete — bottom-right, visible on hover */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  openSingleConfirm(listing.id)
                }}
                aria-label={`Excluir ${listing.title}`}
                className="absolute bottom-2 right-2 z-10 flex size-7 items-center justify-center rounded-md bg-card/90 text-muted-foreground opacity-0 shadow transition-opacity hover:text-destructive group-hover:opacity-100 focus:opacity-100"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          )
        })}
      </div>

      <AlertDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          if (!deleting) setConfirmOpen(open)
        }}
      >
        <AlertDialogContent className="bg-card border-border text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-semibold text-foreground">
              Excluir {pendingCount} imóv{pendingCount !== 1 ? 'eis' : 'el'}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Tem certeza que deseja excluir {pendingCount} imóv{pendingCount !== 1 ? 'eis' : 'el'}? Esta ação removerá {pendingCount !== 1 ? 'os imóveis' : 'o imóvel'} da base de dados e não poderá ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <AlertDialogCancel
              disabled={deleting}
              className="border-border text-foreground hover:bg-muted"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmClick}
              disabled={deleting}
              className="bg-destructive text-white hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : `Excluir ${pendingCount !== 1 ? 'todos' : ''}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

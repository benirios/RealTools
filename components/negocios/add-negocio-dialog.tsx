'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { Loader2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { createNegocioAction, type NegocioState } from '@/lib/actions/negocio-actions'

type Client = { id: string; name: string }
type Listing = { id: string; title: string; city: string | null; neighborhood: string | null }

type Props = {
  clients: Client[]
  listings: Listing[]
}

const initialState: NegocioState = {}

const STATUS_OPTIONS = [
  { value: 'suggested', label: 'Sugerida' },
  { value: 'saved', label: 'Salva' },
  { value: 'sent', label: 'Enviada' },
  { value: 'interested', label: 'Interessado' },
  { value: 'negotiating', label: 'Negociando' },
  { value: 'rejected', label: 'Rejeitada' },
  { value: 'closed', label: 'Fechada' },
]

function listingLabel(l: Listing) {
  const loc = [l.neighborhood, l.city].filter(Boolean).join(', ')
  return loc ? `${l.title} — ${loc}` : l.title
}

export function AddNegocioDialog({ clients, listings }: Props) {
  const [open, setOpen] = useState(false)
  const [state, formAction, isPending] = useActionState(createNegocioAction, initialState)
  const previousPending = useRef(false)

  useEffect(() => {
    if (previousPending.current && !isPending && !state.errors) {
      setOpen(false)
      toast.success('Negócio criado.')
    }
    previousPending.current = isPending
  }, [isPending, state])

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 size-4" />
        Novo negócio
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card text-foreground sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Novo Negócio</DialogTitle>
            <DialogDescription>
              Vincule um cliente a um imóvel e defina o status da negociação.
            </DialogDescription>
          </DialogHeader>

          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label>Cliente <span className="text-destructive">*</span></Label>
              <Select name="clientId" disabled={isPending}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {state.errors?.clientId && (
                <p className="text-xs text-destructive">{state.errors.clientId[0]}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Imóvel <span className="text-destructive">*</span></Label>
              <Select name="opportunityId" disabled={isPending}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um imóvel" />
                </SelectTrigger>
                <SelectContent>
                  {listings.map((l) => (
                    <SelectItem key={l.id} value={l.id}>{listingLabel(l)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {state.errors?.opportunityId && (
                <p className="text-xs text-destructive">{state.errors.opportunityId[0]}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select name="status" defaultValue="suggested" disabled={isPending}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea id="notes" name="notes" disabled={isPending} rows={3} placeholder="Anotações sobre a negociação..." />
            </div>

            {state.errors?.general && (
              <p className="text-xs text-destructive">{state.errors.general[0]}</p>
            )}

            <DialogFooter className="gap-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={isPending}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                Criar negócio
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

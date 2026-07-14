'use client'

import { useActionState, useEffect, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, CircleDollarSign, Handshake, Heart, Loader2, Search, Send, Star, ThumbsDown, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  recalculateClientWorkspaceMatchesAction,
  removeClientOpportunityAction,
  runClientOlxSearchImportAction,
  updateClientOpportunityNotesAction,
  updateClientOpportunityStatusAction,
  type ClientSearchImportState,
} from '@/lib/actions/client-opportunity-actions'

type Status = 'suggested' | 'saved' | 'sent' | 'interested' | 'rejected' | 'negotiating' | 'closed'

const initialSearchState: ClientSearchImportState = {}

export function RecalculateClientWorkspaceButton({ clientId }: { clientId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  return (
    <Button
      variant="outline"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          const result = await recalculateClientWorkspaceMatchesAction(clientId)
          if (result.ok) {
            toast.success(result.message)
            router.refresh()
          } else {
            toast.error(result.message)
          }
        })
      }}
    >
      {isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Check className="mr-2 size-4" />}
      Recalcular para este cliente
    </Button>
  )
}

export function ClientOpportunityPipelineActions({
  clientId,
  opportunityId,
}: {
  clientId: string
  opportunityId: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function update(status: Status) {
    startTransition(async () => {
      const result = await updateClientOpportunityStatusAction(clientId, opportunityId, status)
      if (result.ok) {
        toast.success(result.message)
        router.refresh()
      } else {
        toast.error(result.message)
      }
    })
  }

  function remove() {
    startTransition(async () => {
      const result = await removeClientOpportunityAction(clientId, opportunityId)
      if (result.ok) {
        toast.success(result.message)
        router.refresh()
      } else {
        toast.error(result.message)
      }
    })
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" variant="outline" disabled={isPending} onClick={() => update('saved')}>
        {isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Star className="mr-2 size-4" />}
        Salva
      </Button>
      <Button size="sm" variant="outline" disabled={isPending} onClick={() => update('sent')}>
        <Send className="mr-2 size-4" />
        Enviada
      </Button>
      <Button size="sm" variant="outline" disabled={isPending} onClick={() => update('interested')}>
        <Heart className="mr-2 size-4" />
        Interessado
      </Button>
      <Button size="sm" variant="outline" disabled={isPending} onClick={() => update('negotiating')}>
        <Handshake className="mr-2 size-4" />
        Negociando
      </Button>
      <Button size="sm" variant="outline" disabled={isPending} onClick={() => update('closed')}>
        <CircleDollarSign className="mr-2 size-4" />
        Fechada
      </Button>
      <Button size="sm" variant="ghost" disabled={isPending} onClick={() => update('rejected')}>
        <ThumbsDown className="mr-2 size-4" />
        Rejeitada
      </Button>
      <Button size="sm" variant="ghost" disabled={isPending} onClick={remove}>
        <Trash2 className="mr-2 size-4" />
        Remover
      </Button>
    </div>
  )
}

export function ClientOpportunityNotesForm({
  clientId,
  opportunityId,
  status,
  notes,
}: {
  clientId: string
  opportunityId: string
  status: Status
  notes: string | null
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  return (
    <form
      ref={formRef}
      action={(formData) => {
        startTransition(async () => {
          const result = await updateClientOpportunityNotesAction(formData)
          if (result.ok) {
            toast.success(result.message)
            router.refresh()
          } else {
            toast.error(result.message)
          }
        })
      }}
      className="space-y-3"
    >
      <input type="hidden" name="clientId" value={clientId} />
      <input type="hidden" name="opportunityId" value={opportunityId} />
      <div className="grid gap-3 md:grid-cols-[180px_1fr_auto] md:items-end">
        <div className="space-y-2">
          <Label htmlFor={`${opportunityId}-status`}>Status</Label>
          <select
            id={`${opportunityId}-status`}
            name="status"
            defaultValue={status}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
          >
            <option value="suggested">Sugerida</option>
            <option value="saved">Salva</option>
            <option value="sent">Enviada</option>
            <option value="interested">Interessado</option>
            <option value="rejected">Rejeitada</option>
            <option value="negotiating">Negociando</option>
            <option value="closed">Fechada</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${opportunityId}-notes`}>Notas do cliente</Label>
          <Textarea
            id={`${opportunityId}-notes`}
            name="notes"
            defaultValue={notes ?? ''}
            placeholder="Contexto da conversa, objeções, próximos passos..."
            className="min-h-20"
          />
        </div>
        <Button type="submit" disabled={isPending}>
          {isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
          Salvar notas
        </Button>
      </div>
    </form>
  )
}

export function FindClientOpportunitiesForm({
  clientId,
  defaultLocation,
  defaultSearchTerm,
}: {
  clientId: string
  defaultLocation: string
  defaultSearchTerm: string
}) {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(runClientOlxSearchImportAction, initialSearchState)
  const previousPending = useRef(false)

  useEffect(() => {
    if (previousPending.current && !isPending && state.message && !state.errors) {
      toast.success(state.message)
      router.refresh()
    }
    previousPending.current = isPending
  }, [isPending, router, state])

  return (
    <form action={formAction} className="space-y-4 rounded-md border border-border bg-card p-4">
      <input type="hidden" name="clientId" value={clientId} />
      <div>
        <h2 className="text-base font-semibold text-foreground">Encontrar oportunidades para este cliente</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Os imóveis encontrados ficam em Achados para você revisar e favoritar. Você pode compartilhá-los com outros clientes depois.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_1fr_100px_100px]">
        <div className="space-y-2">
          <Label htmlFor="client-location-query">Região</Label>
          <Input
            id="client-location-query"
            name="locationQuery"
            defaultValue={defaultLocation}
            disabled={isPending}
            placeholder="Campo Grande, Rio de Janeiro"
            required
          />
          {state.errors?.locationQuery && <p className="text-xs text-destructive">{state.errors.locationQuery[0]}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="client-search-term">Termo</Label>
          <Input
            id="client-search-term"
            name="searchTerm"
            defaultValue={defaultSearchTerm}
            disabled={isPending}
            placeholder="ponto comercial"
            required
          />
          {state.errors?.searchTerm && <p className="text-xs text-destructive">{state.errors.searchTerm[0]}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="client-state">UF</Label>
          <Input id="client-state" name="state" disabled={isPending} placeholder="RJ" maxLength={2} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="client-max-listings">Máx.</Label>
          <Input id="client-max-listings" name="maxListings" type="number" min={1} max={50} defaultValue={25} disabled={isPending} />
        </div>
      </div>
      {state.errors?.general && <p className="text-xs text-destructive">{state.errors.general[0]}</p>}
      <Button type="submit" disabled={isPending}>
        {isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Search className="mr-2 size-4" />}
        Buscar para este cliente
      </Button>
    </form>
  )
}

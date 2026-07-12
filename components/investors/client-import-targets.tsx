'use client'

import { useActionState, useEffect, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Play, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  createClientImportTargetAction,
  deleteClientImportTargetAction,
  runClientImportTargetAction,
  toggleClientImportTargetAction,
  type CreateImportTargetState,
} from '@/lib/actions/client-opportunity-actions'

export type ClientImportTarget = {
  id: string
  source: string
  country: string
  state: string | null
  city: string | null
  search_term: string
  is_active: boolean
}

const initialState: CreateImportTargetState = {}

export function CreateClientImportTargetForm({ clientId }: { clientId: string }) {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(createClientImportTargetAction, initialState)
  const previousPending = useRef(false)

  useEffect(() => {
    if (previousPending.current && !isPending && state.message && !state.errors) {
      toast.success(state.message)
      router.refresh()
    }
    previousPending.current = isPending
  }, [isPending, router, state])

  return (
    <form action={formAction} className="grid gap-3 rounded-md border border-border bg-card p-4 lg:grid-cols-[1fr_100px_1fr_auto]">
      <input type="hidden" name="clientId" value={clientId} />
      <input type="hidden" name="source" value="olx" />
      <div className="space-y-2">
        <Label htmlFor="ct-city">Cidade</Label>
        <Input id="ct-city" name="city" disabled={isPending} placeholder="Recife" required />
        {state.errors?.city && <p className="text-xs text-destructive">{state.errors.city[0]}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="ct-state">UF</Label>
        <Input id="ct-state" name="state" disabled={isPending} placeholder="PE" maxLength={2} required />
        {state.errors?.state && <p className="text-xs text-destructive">{state.errors.state[0]}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="ct-term">Termo</Label>
        <Input id="ct-term" name="searchTerm" disabled={isPending} placeholder="ponto comercial" required />
        {state.errors?.searchTerm && <p className="text-xs text-destructive">{state.errors.searchTerm[0]}</p>}
      </div>
      <div className="flex items-end">
        <Button type="submit" disabled={isPending} className="w-full lg:w-auto">
          {isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
          Salvar alvo
        </Button>
      </div>
      {state.errors?.general && <p className="text-xs text-destructive lg:col-span-4">{state.errors.general[0]}</p>}
    </form>
  )
}

export function ClientImportTargetsList({ clientId, targets }: { clientId: string; targets: ClientImportTarget[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  if (targets.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
        Nenhum alvo de importação salvo para este cliente ainda.
      </div>
    )
  }

  function run(targetId: string) {
    startTransition(async () => {
      const res = await runClientImportTargetAction(clientId, targetId)
      if (res.ok) toast.success(res.message)
      else toast.error(res.message)
      router.refresh()
    })
  }

  function toggle(targetId: string, nextActive: boolean) {
    startTransition(async () => {
      await toggleClientImportTargetAction(clientId, targetId, nextActive)
      router.refresh()
    })
  }

  function remove(targetId: string) {
    startTransition(async () => {
      await deleteClientImportTargetAction(clientId, targetId)
      router.refresh()
    })
  }

  return (
    <div className="overflow-hidden rounded-md border border-border bg-card">
      <ul className="divide-y divide-border">
        {targets.map((target) => (
          <li key={target.id} className="flex items-center gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {target.city}{target.state ? `, ${target.state}` : ''}
              </p>
              <p className="truncate text-xs text-muted-foreground">{target.search_term}</p>
            </div>
            <Badge variant={target.is_active ? 'default' : 'outline'}>{target.is_active ? 'Ativo' : 'Inativo'}</Badge>
            <Button size="sm" variant="outline" disabled={isPending || !target.is_active} onClick={() => run(target.id)}>
              <Play className="mr-2 size-3.5" />
              Buscar agora
            </Button>
            <Button size="sm" variant="ghost" disabled={isPending} onClick={() => toggle(target.id, !target.is_active)}>
              {target.is_active ? 'Desativar' : 'Ativar'}
            </Button>
            <Button size="sm" variant="ghost" disabled={isPending} onClick={() => remove(target.id)} aria-label="Remover alvo">
              <Trash2 className="size-3.5 text-destructive" />
            </Button>
          </li>
        ))}
      </ul>
    </div>
  )
}

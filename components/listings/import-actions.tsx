'use client'

import { useActionState, useEffect, useRef, useState, useTransition } from 'react'
import { Loader2, Play, Plus, RefreshCw, Search, Trash2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  clearImportRunsAction,
  createImportTargetAction,
  deleteImportTargetAction,
  reenrichImportRunAction,
  runOlxImportAction,
  runOlxSearchImportAction,
  seedDefaultImportTargetsAction,
  toggleImportTargetAction,
  type CreateImportTargetState,
  type OlxSearchImportState,
} from '@/lib/actions/listing-import-actions'

const initialOlxSearchImportState: OlxSearchImportState = {}
const initialCreateImportTargetState: CreateImportTargetState = {}

export function RunOlxImportButton({ targetId }: { targetId: string }) {
  const [isPending, startTransition] = useTransition()

  return (
    <Button
      size="sm"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          const result = await runOlxImportAction(targetId)
          if (result.ok) {
            toast.success(result.message)
          } else {
            toast.error(result.message)
          }
        })
      }}
    >
      {isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Play className="mr-2 size-4" />}
      Executar OLX
    </Button>
  )
}

export function ClearImportRunsButton() {
  const [isPending, startTransition] = useTransition()

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          const result = await clearImportRunsAction()
          if (result.ok) {
            toast.success(result.message)
          } else {
            toast.error(result.message)
          }
        })
      }}
    >
      {isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Trash2 className="mr-2 size-4" />}
      Limpar histórico
    </Button>
  )
}

export function ReenrichImportRunButton({ runId }: { runId: string }) {
  const [isPending, startTransition] = useTransition()

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          const result = await reenrichImportRunAction(runId)
          if (result.ok) {
            toast.success(result.message)
          } else {
            toast.error(result.message)
          }
        })
      }}
    >
      {isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <RefreshCw className="mr-2 size-4" />}
      Reenriquecer importação
    </Button>
  )
}

export function SeedDefaultTargetsButton() {
  const [isPending, startTransition] = useTransition()

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          const result = await seedDefaultImportTargetsAction()
          if (result.ok) {
            toast.success(result.message)
          } else {
            toast.error(result.message)
          }
        })
      }}
    >
      {isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Upload className="mr-2 size-4" />}
      Adicionar alvos padrão
    </Button>
  )
}

export function OlxSearchImportForm() {
  const [state, formAction, isPending] = useActionState(runOlxSearchImportAction, initialOlxSearchImportState)
  const previousPending = useRef(false)

  useEffect(() => {
    if (previousPending.current && !isPending && state.message && !state.errors) {
      toast.success(state.message)
    }
    previousPending.current = isPending
  }, [isPending, state])

  return (
    <form action={formAction} className="space-y-4 rounded-md border border-border bg-card p-4">
      <div>
        <h2 className="text-base font-semibold text-foreground">Buscar no OLX Agora</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Digite um endereço, cidade ou região e o RealTools coletará os imóveis correspondentes do OLX.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr_120px_120px]">
        <div className="space-y-2">
          <Label htmlFor="locationQuery">Endereço, cidade ou região</Label>
          <Input
            id="locationQuery"
            name="locationQuery"
            disabled={isPending}
            placeholder="Boa Viagem, Recife"
            required
          />
          {state.errors?.locationQuery && (
            <p className="text-xs text-destructive">{state.errors.locationQuery[0]}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="searchTerm">Termo de busca</Label>
          <Input
            id="searchTerm"
            name="searchTerm"
            disabled={isPending}
            defaultValue="ponto comercial"
            placeholder="loja, sala comercial, galpao"
            required
          />
          {state.errors?.searchTerm && (
            <p className="text-xs text-destructive">{state.errors.searchTerm[0]}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="state">Estado</Label>
          <Input
            id="state"
            name="state"
            disabled={isPending}
            placeholder="PE"
            maxLength={2}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxListings">Máx.</Label>
          <Input
            id="maxListings"
            name="maxListings"
            type="number"
            min={1}
            max={50}
            defaultValue={25}
            disabled={isPending}
          />
        </div>
      </div>

      {state.errors?.general && (
        <p className="text-xs text-destructive">{state.errors.general[0]}</p>
      )}

      <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
        {isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Search className="mr-2 size-4" />}
        Buscar e importar
      </Button>
    </form>
  )
}

export function ToggleImportTargetButton({ targetId, isActive }: { targetId: string; isActive: boolean }) {
  const [isPending, startTransition] = useTransition()

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          const result = await toggleImportTargetAction(targetId, !isActive)
          if (result.ok) {
            toast.success(result.message)
          } else {
            toast.error(result.message)
          }
        })
      }}
    >
      {isPending ? <Loader2 className="size-4 animate-spin" /> : isActive ? 'Desativar' : 'Ativar'}
    </Button>
  )
}

export function DeleteImportTargetButton({ targetId }: { targetId: string }) {
  const [isPending, setIsPending] = useState(false)

  async function handleDelete() {
    setIsPending(true)
    const result = await deleteImportTargetAction(targetId)
    setIsPending(false)
    if (result.ok) {
      toast.success(result.message)
    } else {
      toast.error(result.message)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" aria-label="Remover alvo">
          <Trash2 className="size-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="bg-card border-border text-foreground">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-semibold text-foreground">Remover alvo de importação?</AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground">
            Esta ação não pode ser desfeita. Execuções de importação já realizadas com este alvo não serão afetadas.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <AlertDialogCancel className="border-border text-foreground hover:bg-muted">Manter</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isPending}
            className="bg-destructive text-white hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Remover'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export function CreateImportTargetForm() {
  const [state, formAction, isPending] = useActionState(createImportTargetAction, initialCreateImportTargetState)
  const formRef = useRef<HTMLFormElement>(null)
  const previousPending = useRef(false)

  useEffect(() => {
    if (previousPending.current && !isPending && state.message && !state.errors) {
      toast.success(state.message)
      formRef.current?.reset()
    }
    previousPending.current = isPending
  }, [isPending, state])

  return (
    <form ref={formRef} action={formAction} className="space-y-3 rounded-md border border-border bg-card p-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Novo alvo de importação</h3>
        <p className="mt-1 text-xs text-muted-foreground">Salve uma busca OLX para reutilizar em execuções futuras.</p>
      </div>

      <div className="grid gap-3 lg:grid-cols-[100px_1fr_1.4fr]">
        <div className="space-y-2">
          <Label htmlFor="target-state">Estado</Label>
          <Input id="target-state" name="state" placeholder="PE" maxLength={2} disabled={isPending} required />
          {state.errors?.state && <p className="text-xs text-destructive">{state.errors.state[0]}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="target-city">Cidade</Label>
          <Input id="target-city" name="city" placeholder="Recife" disabled={isPending} required />
          {state.errors?.city && <p className="text-xs text-destructive">{state.errors.city[0]}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="target-searchTerm">Termo de busca</Label>
          <Input id="target-searchTerm" name="searchTerm" placeholder="loja, sala comercial, galpao" disabled={isPending} required />
          {state.errors?.searchTerm && <p className="text-xs text-destructive">{state.errors.searchTerm[0]}</p>}
        </div>
      </div>

      <input type="hidden" name="source" value="olx" />
      <input type="hidden" name="country" value="BR" />

      {state.errors?.general && <p className="text-xs text-destructive">{state.errors.general[0]}</p>}

      <Button type="submit" disabled={isPending} size="sm">
        {isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Plus className="mr-2 size-4" />}
        Adicionar alvo
      </Button>
    </form>
  )
}

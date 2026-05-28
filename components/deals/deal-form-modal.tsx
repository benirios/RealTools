'use client'

import { useActionState, useState, useEffect, useRef } from 'react'
import { Loader2, Plus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createDealAction, updateDealAction } from '@/lib/actions/deal-actions'
import { type DealState } from '@/lib/schemas/deal'
import { toast } from 'sonner'

type Deal = {
  id: string
  title: string
  address: string | null
  price: string | null
  status: string
  description?: string | null
}

type Props = {
  deal?: Deal          // undefined = create mode, defined = edit mode
  trigger?: React.ReactNode  // custom trigger (defaults to "New Deal" button)
}

const initialState: DealState = {}

export function DealFormModal({ deal, trigger }: Props) {
  const isEdit = !!deal

  const [open, setOpen] = useState(false)
  const [state, formAction, isPending] = useActionState(
    isEdit ? updateDealAction : createDealAction,
    initialState
  )

  // Detect transition from pending → not pending with no errors → success
  const prevPending = useRef(false)
  useEffect(() => {
    if (prevPending.current && !isPending && !state.errors) {
      setOpen(false)
      toast.success(isEdit ? 'Negócio atualizado.' : 'Negócio criado.')
    }
    prevPending.current = isPending
  }, [isPending, state, isEdit])

  return (
    <>
      {trigger ? (
        <div onClick={() => setOpen(true)}>{trigger}</div>
      ) : (
        <Button
          onClick={() => setOpen(true)}
        >
          <Plus className="size-4 mr-2" />
          Novo Negócio
        </Button>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-border text-foreground sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-foreground">
              {isEdit ? 'Editar Negócio' : 'Novo Negócio'}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {isEdit ? 'Atualize os dados do negócio.' : 'Preencha os dados abaixo.'}
            </DialogDescription>
          </DialogHeader>
          <form action={formAction} className="space-y-4">
            {isEdit && (
              <input type="hidden" name="dealId" value={deal.id} />
            )}
            {/* Deal title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium text-foreground">Título do negócio</Label>
              <Input
                id="title"
                name="title"
                defaultValue={deal?.title}
                placeholder="Centro Comercial Av. Paulista"
                disabled={isPending}
              />
              {state.errors?.title && (
                <p className="text-sm text-destructive">{state.errors.title[0]}</p>
              )}
            </div>
            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="address" className="text-sm font-medium text-foreground">Endereço</Label>
              <Input
                id="address"
                name="address"
                defaultValue={deal?.address ?? ''}
                placeholder="Av. Paulista, 1000, São Paulo, SP"
                disabled={isPending}
              />
              {state.errors?.address && (
                <p className="text-sm text-destructive">{state.errors.address[0]}</p>
              )}
            </div>
            {/* Asking price */}
            <div className="space-y-2">
              <Label htmlFor="price" className="text-sm font-medium text-foreground">Preço pedido</Label>
              <Input
                id="price"
                name="price"
                type="text"
                defaultValue={deal?.price ?? ''}
                placeholder="$4,500,000"
                disabled={isPending}
              />
              {state.errors?.price && (
                <p className="text-sm text-destructive">{state.errors.price[0]}</p>
              )}
            </div>
            {/* Status */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">Status</Label>
              <Select name="status" defaultValue={deal?.status ?? 'active'} disabled={isPending}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border text-foreground">
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="negotiating">Em negociação</SelectItem>
                  <SelectItem value="closed">Fechado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium text-foreground">Descrição</Label>
              <Textarea
                id="description"
                name="description"
                rows={4}
                defaultValue={deal?.description ?? ''}
                placeholder="Descreva o imóvel, a oportunidade e os principais destaques…"
                disabled={isPending}
              />
            </div>
            {state.errors?.general && (
              <p className="text-sm text-destructive">{state.errors.general[0]}</p>
            )}
            <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => setOpen(false)}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar Negócio'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

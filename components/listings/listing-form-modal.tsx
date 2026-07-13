'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { Loader2, Pencil, Plus } from 'lucide-react'
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
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TagInput } from '@/components/ui/tag-input'
import { Textarea } from '@/components/ui/textarea'
import { createManualListingAction, updateManualListingAction } from '@/lib/actions/manual-listing-actions'
import type { ManualListingState } from '@/lib/schemas/manual-listing'

export type ListingFormListing = {
  id: string
  title: string
  price_amount: number | null
  price_text: string | null
  property_type: string | null
  commercial_type: string | null
  is_commercial: boolean | null
  address_text: string | null
  neighborhood: string | null
  city: string | null
  state: string | null
  description: string | null
  images: string[] | null
}

type Props = {
  investorId?: string
  listing?: ListingFormListing
  trigger?: React.ReactNode
}

const initialState: ManualListingState = {}

export function ListingFormModal({ investorId, listing, trigger }: Props) {
  const isEdit = Boolean(listing)
  const [open, setOpen] = useState(false)
  const [state, formAction, isPending] = useActionState(
    isEdit ? updateManualListingAction : createManualListingAction,
    initialState
  )
  const previousPending = useRef(false)

  useEffect(() => {
    if (previousPending.current && !isPending && !state.errors) {
      setOpen(false)
      toast.success('Imóvel salvo.')
    }
    previousPending.current = isPending
  }, [isPending, state])

  return (
    <>
      {trigger ? (
        <div onClick={() => setOpen(true)}>{trigger}</div>
      ) : (
        <Button onClick={() => setOpen(true)}>
          {isEdit ? <Pencil className="mr-2 size-4" /> : <Plus className="mr-2 size-4" />}
          {isEdit ? 'Editar Imóvel' : 'Novo Imóvel'}
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto bg-card text-foreground sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Editar Imóvel' : 'Novo Imóvel'}</DialogTitle>
            <DialogDescription>
              {isEdit
                ? 'Atualize as informações deste imóvel.'
                : 'Cadastre um imóvel manualmente com as mesmas informações que a busca automática coleta.'}
            </DialogDescription>
          </DialogHeader>

          <form action={formAction} className="space-y-5">
            {isEdit
              ? <input type="hidden" name="listingId" value={listing!.id} />
              : <input type="hidden" name="investorId" value={investorId} />}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="title">Título</Label>
                <Input id="title" name="title" defaultValue={listing?.title} disabled={isPending} />
                {state.errors?.title && <p className="text-xs text-destructive">{state.errors.title[0]}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="priceAmount">Preço (R$)*</Label>
                <Input id="priceAmount" name="priceAmount" type="number" required defaultValue={listing?.price_amount ?? ''} disabled={isPending} />
                {state.errors?.priceAmount && <p className="text-xs text-destructive">{state.errors.priceAmount[0]}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="priceText">Preço (texto, opcional)</Label>
                <Input id="priceText" name="priceText" placeholder="R$ 1.200.000" defaultValue={listing?.price_text ?? ''} disabled={isPending} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="propertyType">Tipo de imóvel</Label>
                <Input id="propertyType" name="propertyType" placeholder="loja, galpão, sala..." defaultValue={listing?.property_type ?? ''} disabled={isPending} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="commercialType">Tipo comercial</Label>
                <Input id="commercialType" name="commercialType" defaultValue={listing?.commercial_type ?? ''} disabled={isPending} />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Checkbox id="isCommercial" name="isCommercial" defaultChecked={listing?.is_commercial ?? true} disabled={isPending} />
                <Label htmlFor="isCommercial" className="font-normal">É um imóvel comercial</Label>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="addressText">Endereço*</Label>
                <Input id="addressText" name="addressText" required defaultValue={listing?.address_text ?? ''} disabled={isPending} />
                {state.errors?.addressText && <p className="text-xs text-destructive">{state.errors.addressText[0]}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="neighborhood">Bairro</Label>
                <Input id="neighborhood" name="neighborhood" defaultValue={listing?.neighborhood ?? ''} disabled={isPending} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="city">Cidade</Label>
                  <Input id="city" name="city" defaultValue={listing?.city ?? ''} disabled={isPending} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">Estado</Label>
                  <Input id="state" name="state" defaultValue={listing?.state ?? ''} disabled={isPending} />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea id="description" name="description" rows={4} defaultValue={listing?.description ?? ''} disabled={isPending} />
            </div>

            <div className="space-y-2">
              <Label>Imagens (URLs)</Label>
              <TagInput name="images" defaultValue={listing?.images ?? []} disabled={isPending} placeholder="Cole uma URL de imagem e pressione Enter" />
              {state.errors?.images && <p className="text-xs text-destructive">{state.errors.images[0]}</p>}
            </div>

            {state.errors?.general && <p className="text-xs text-destructive">{state.errors.general[0]}</p>}

            <p className="text-xs text-muted-foreground">* obrigatório</p>

            <DialogFooter className="gap-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={isPending}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                Salvar Imóvel
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

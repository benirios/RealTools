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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TagInput } from '@/components/ui/tag-input'
import { Textarea } from '@/components/ui/textarea'
import { createInvestorAction, updateInvestorAction } from '@/lib/actions/investor-actions'
import type { InvestorState } from '@/lib/schemas/investor'

export type InvestorFormInvestor = {
  id: string
  name: string
  email: string | null
  phone: string | null
  budget_min: number | null
  budget_max: number | null
  preferred_neighborhoods: string[] | null
  property_types: string[] | null
  strategy: string
  risk_level: string
  desired_yield: number | null
  tags: string[] | null
  notes: string | null
}

type Props = {
  investor?: InvestorFormInvestor
  trigger?: React.ReactNode
}

const initialState: InvestorState = {}

export function InvestorFormModal({ investor, trigger }: Props) {
  const isEdit = Boolean(investor)
  const [open, setOpen] = useState(false)
  const [state, formAction, isPending] = useActionState(
    isEdit ? updateInvestorAction : createInvestorAction,
    initialState
  )
  const previousPending = useRef(false)

  useEffect(() => {
    if (previousPending.current && !isPending && !state.errors) {
      setOpen(false)
      toast.success('Investidor salvo.')
    }
    previousPending.current = isPending
  }, [isPending, state])

  return (
    <>
      {trigger ? (
        <div onClick={() => setOpen(true)}>{trigger}</div>
      ) : (
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 size-4" />
          Novo Investidor
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto bg-card text-foreground sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Editar Investidor' : 'Novo Investidor'}</DialogTitle>
            <DialogDescription>
              Registre as preferências de correspondência. Campos vazios são tratados como flexíveis.
            </DialogDescription>
          </DialogHeader>

          <form action={formAction} className="space-y-5">
            {investor && <input type="hidden" name="investorId" value={investor.id} />}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input id="name" name="name" defaultValue={investor?.name} disabled={isPending} />
                {state.errors?.name && <p className="text-xs text-destructive">{state.errors.name[0]}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" defaultValue={investor?.email ?? ''} disabled={isPending} />
                {state.errors?.email && <p className="text-xs text-destructive">{state.errors.email[0]}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input id="phone" name="phone" defaultValue={investor?.phone ?? ''} disabled={isPending} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="budgetMin">Orçamento mín.</Label>
                  <Input id="budgetMin" name="budgetMin" type="number" defaultValue={investor?.budget_min ?? ''} disabled={isPending} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="budgetMax">Orçamento máx.</Label>
                  <Input id="budgetMax" name="budgetMax" type="number" defaultValue={investor?.budget_max ?? ''} disabled={isPending} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Estratégia</Label>
                <Select name="strategy" defaultValue={investor?.strategy ?? 'any'} disabled={isPending}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Qualquer</SelectItem>
                    <SelectItem value="rental_income">Renda de aluguel</SelectItem>
                    <SelectItem value="retail">Varejo</SelectItem>
                    <SelectItem value="warehouse_logistics">Galpao / logistica</SelectItem>
                    <SelectItem value="food_beverage">Alimentacao</SelectItem>
                    <SelectItem value="pharmacy">Farmacia</SelectItem>
                    <SelectItem value="gym_fitness">Academia / fitness</SelectItem>
                    <SelectItem value="flip">Revenda</SelectItem>
                    <SelectItem value="own_business">Negócio próprio</SelectItem>
                    <SelectItem value="land_banking">Reserva de terreno</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Nível de risco</Label>
                <Select name="riskLevel" defaultValue={investor?.risk_level ?? 'any'} disabled={isPending}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Qualquer</SelectItem>
                    <SelectItem value="low">Baixo</SelectItem>
                    <SelectItem value="medium">Médio</SelectItem>
                    <SelectItem value="high">Alto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="desiredYield">Rendimento desejado (%)</Label>
                <Input id="desiredYield" name="desiredYield" type="number" step="0.1" defaultValue={investor?.desired_yield ?? ''} disabled={isPending} />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Bairros preferidos</Label>
                <TagInput name="preferredNeighborhoods" defaultValue={investor?.preferred_neighborhoods ?? []} disabled={isPending} placeholder="Boa Viagem" />
              </div>
              <div className="space-y-2">
                <Label>Tipos de imóvel</Label>
                <TagInput name="propertyTypes" defaultValue={investor?.property_types ?? []} disabled={isPending} placeholder="loja" />
              </div>
              <div className="space-y-2">
                <Label>Etiquetas</Label>
                <TagInput name="tags" defaultValue={investor?.tags ?? []} disabled={isPending} placeholder="alto_rendimento" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea id="notes" name="notes" defaultValue={investor?.notes ?? ''} disabled={isPending} />
            </div>

            {state.errors?.budgetMin && <p className="text-xs text-destructive">{state.errors.budgetMin[0]}</p>}
            {state.errors?.general && <p className="text-xs text-destructive">{state.errors.general[0]}</p>}

            <DialogFooter className="gap-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={isPending}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                Salvar Investidor
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

'use client'

import { useTransition } from 'react'
import { Database, Loader2, RefreshCw, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { deleteInvestorAction, recalculateAllMatchesAction, recalculateInvestorMatchesAction, seedDemoInvestorsAction } from '@/lib/actions/investor-actions'

export function SeedDemoInvestorsButton() {
  const [isPending, startTransition] = useTransition()

  return (
    <Button
      variant="outline"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          const result = await seedDemoInvestorsAction()
          if (result.ok) {
            toast.success(result.message)
          } else {
            toast.error(result.message)
          }
        })
      }}
    >
      {isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Database className="mr-2 size-4" />}
      Adicionar investidores demo
    </Button>
  )
}

export function RecalculateAllMatchesButton() {
  const [isPending, startTransition] = useTransition()

  return (
    <Button
      variant="outline"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          const result = await recalculateAllMatchesAction()
          if (result.ok) {
            toast.success(result.message)
          } else {
            toast.error(result.message)
          }
        })
      }}
    >
      {isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <RefreshCw className="mr-2 size-4" />}
      Recalcular todos matches
    </Button>
  )
}

export function RecalculateInvestorMatchesButton({ investorId }: { investorId: string }) {
  const [isPending, startTransition] = useTransition()

  return (
    <Button
      variant="outline"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          const result = await recalculateInvestorMatchesAction(investorId)
          if (result.ok) {
            toast.success(result.message)
          } else {
            toast.error(result.message)
          }
        })
      }}
    >
      {isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <RefreshCw className="mr-2 size-4" />}
      Recalcular matches
    </Button>
  )
}

export function DeleteInvestorButton({ investorId }: { investorId: string }) {
  const [isPending, startTransition] = useTransition()

  return (
    <Button
      variant="ghost"
      size="icon"
      disabled={isPending}
      aria-label="Excluir investidor"
      onClick={() => {
        if (!confirm('Excluir este investidor?')) return
        startTransition(async () => {
          const result = await deleteInvestorAction(investorId)
          if (result.error) {
            toast.error(result.error)
          } else {
            toast.success('Investidor excluído.')
          }
        })
      }}
    >
      {isPending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
    </Button>
  )
}

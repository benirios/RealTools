import Link from 'next/link'
import { Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { InvestorFormModal, type InvestorFormInvestor } from '@/components/investors/investor-form-modal'
import { DeleteInvestorButton } from '@/components/investors/investor-actions'

type Props = {
  investors: InvestorFormInvestor[]
}

function formatBudget(investor: InvestorFormInvestor) {
  const min = investor.budget_min ? `R$ ${Number(investor.budget_min).toLocaleString('pt-BR')}` : 'Any'
  const max = investor.budget_max ? `R$ ${Number(investor.budget_max).toLocaleString('pt-BR')}` : 'Any'
  return `${min} - ${max}`
}

export function InvestorsTable({ investors }: Props) {
  if (investors.length === 0) {
    return (
      <div className="rounded-md border border-border bg-card p-8 text-center">
        <h2 className="text-lg font-semibold text-foreground">Nenhum investidor ainda.</h2>
        <p className="mb-6 mt-2 text-sm text-muted-foreground">
          Crie um perfil de investidor ou adicione investidores demo para testar as correspondências.
        </p>
        <InvestorFormModal />
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-md border border-border bg-card">
      <div className="hidden grid-cols-[1.2fr_1fr_0.8fr_0.8fr_1fr_auto] gap-4 border-b border-border bg-secondary px-4 py-3 md:grid">
        {['Investidor', 'Orçamento', 'Estratégia', 'Risco', 'Etiquetas', 'Ações'].map((label) => (
          <span key={label} className="text-[11px] font-medium uppercase text-muted-foreground">{label}</span>
        ))}
      </div>
      <div className="divide-y divide-border/70">
        {investors.map((investor) => (
          <div
            key={investor.id}
            className="grid gap-3 px-4 py-4 text-sm md:grid-cols-[1.2fr_1fr_0.8fr_0.8fr_1fr_auto] md:items-center"
          >
            <div>
              <Link href={`/investors/${investor.id}`} className="font-medium text-foreground hover:underline">
                {investor.name}
              </Link>
              <p className="mt-1 text-xs text-muted-foreground">{investor.email ?? investor.phone ?? 'Sem contato'}</p>
            </div>
            <span className="text-muted-foreground">{formatBudget(investor)}</span>
            <Badge variant="outline">{investor.strategy}</Badge>
            <Badge variant="outline">{investor.risk_level}</Badge>
            <div className="flex flex-wrap gap-1">
              {(investor.tags ?? []).slice(0, 3).map((tag) => (
                <span key={tag} className="rounded-full border border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {tag}
                </span>
              ))}
            </div>
            <div className="flex items-center justify-end gap-2">
              <InvestorFormModal
                investor={investor}
                trigger={
                  <Button variant="ghost" size="icon" aria-label="Editar investidor">
                    <Pencil className="size-4" />
                  </Button>
                }
              />
              <DeleteInvestorButton investorId={investor.id} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

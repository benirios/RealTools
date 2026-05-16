import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { InvestorFormModal } from '@/components/investors/investor-form-modal'
import { RecalculateInvestorMatchesButton } from '@/components/investors/investor-actions'
import { MatchCard } from '@/components/investors/match-card'
import { loadPersistedMatchesForInvestor } from '@/lib/investors/match-processing'
import type { Database } from '@/types/supabase'

type PageProps = {
  params: Promise<{ id: string }>
}

type InvestorRow = Database['public']['Tables']['investors']['Row']

function formatBudget(investor: InvestorRow) {
  const min = investor.budget_min ? `R$ ${Number(investor.budget_min).toLocaleString('pt-BR')}` : 'Any'
  const max = investor.budget_max ? `R$ ${Number(investor.budget_max).toLocaleString('pt-BR')}` : 'Any'
  return `${min} - ${max}`
}

export default async function InvestorDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: investor } = await (supabase.from('investors') as any)
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single() as { data: InvestorRow | null }

  if (!investor) notFound()

  const matches = await loadPersistedMatchesForInvestor(supabase, user.id, investor.id)

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-3 mb-2">
          <Link href="/investors">Voltar para Investidores</Link>
        </Button>
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold leading-tight text-foreground">{investor.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {investor.email ?? investor.phone ?? 'Sem contato'} · Orçamento {formatBudget(investor)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <RecalculateInvestorMatchesButton investorId={investor.id} />
            <InvestorFormModal investor={investor} />
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-md border border-border bg-card p-4">
          <p className="text-xs font-medium uppercase text-muted-foreground">Estratégia</p>
          <p className="mt-2 text-lg font-semibold text-foreground">{investor.strategy}</p>
        </div>
        <div className="rounded-md border border-border bg-card p-4">
          <p className="text-xs font-medium uppercase text-muted-foreground">Risco</p>
          <p className="mt-2 text-lg font-semibold text-foreground">{investor.risk_level}</p>
        </div>
        <div className="rounded-md border border-border bg-card p-4">
          <p className="text-xs font-medium uppercase text-muted-foreground">Rendimento alvo</p>
          <p className="mt-2 text-lg font-semibold text-foreground">{investor.desired_yield ? `${investor.desired_yield}%` : 'Qualquer'}</p>
        </div>
        <div className="rounded-md border border-border bg-card p-4">
          <p className="text-xs font-medium uppercase text-muted-foreground">Correspondências</p>
          <p className="mt-2 text-lg font-semibold text-foreground">{matches.length}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {[...(investor.preferred_neighborhoods ?? []), ...(investor.property_types ?? []), ...(investor.tags ?? [])].map((tag) => (
          <Badge key={tag} variant="outline">{tag}</Badge>
        ))}
      </div>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Correspondências Classificadas</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Pontuação persistida baseada em orçamento, localização, tipo, estratégia, risco, etiquetas, score universal e inteligência local.
          </p>
        </div>

        {matches.length === 0 ? (
          <div className="rounded-md border border-border bg-card p-6 text-sm text-muted-foreground">
            Nenhum imóvel salvo disponível ainda. Execute uma importação do OLX primeiro.
          </div>
        ) : (
          <div className="grid gap-3">
            {matches.map((match) => (
              <MatchCard key={match.deal.id} {...match} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

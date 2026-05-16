import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Briefcase, CheckCircle2, CircleDollarSign, Clock3 } from 'lucide-react'
import { DealCard } from '@/components/deals/deal-card'
import { DealFormModal } from '@/components/deals/deal-form-modal'

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: deals } = await (supabase.from('deals') as any)
    .select('id, title, address, price, status')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false }) as {
      data: { id: string; title: string; address: string | null; price: string | null; status: string }[] | null
    }

  const dealList = deals ?? []
  const totalDeals = dealList.length
  const activeDeals = dealList.filter((deal) => deal.status === 'active').length
  const negotiatingDeals = dealList.filter((deal) => deal.status === 'negotiating').length
  const closedDeals = dealList.filter((deal) => deal.status === 'closed').length

  const summaryCards = [
    { label: 'Total de negócios', value: totalDeals, icon: Briefcase, className: 'bg-foreground text-background' },
    { label: 'Ativos', value: activeDeals, icon: CheckCircle2, className: 'bg-card text-foreground' },
    { label: 'Em negociação', value: negotiatingDeals, icon: Clock3, className: 'bg-card text-foreground' },
    { label: 'Fechados', value: closedDeals, icon: CircleDollarSign, className: 'bg-card text-muted-foreground' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-medium leading-tight text-foreground">Negócios</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerencie oportunidades, arquivos e atividades em um só lugar.
          </p>
        </div>
        <DealFormModal />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map(({ label, value, icon: Icon, className }) => (
          <div
            key={label}
            className="rounded-md border border-border bg-card p-5"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                  {label}
                </p>
                <p className="mt-2 text-3xl font-medium leading-none text-foreground">
                  {value}
                </p>
              </div>
              <span className={`flex size-12 items-center justify-center rounded-full border border-border ${className}`}>
                <Icon className="size-5" />
              </span>
            </div>
          </div>
        ))}
      </div>

      {dealList.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card px-6 py-16 text-center">
          <span className="mb-4 flex size-16 items-center justify-center rounded-full border border-foreground bg-card text-foreground">
            <Briefcase className="size-6" />
          </span>
          <h2 className="text-lg font-semibold text-foreground">Nenhum negócio ainda.</h2>
          <p className="mt-2 mb-6 max-w-sm text-sm text-muted-foreground">
            Crie um negócio para começar a organizar o workspace, OM e histórico de atividades em um só lugar.
          </p>
          <DealFormModal />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {dealList.map((deal) => (
            <DealCard key={deal.id} deal={deal} />
          ))}
        </div>
      )}
    </div>
  )
}

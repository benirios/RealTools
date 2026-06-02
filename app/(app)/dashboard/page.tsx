import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { Building2 } from 'lucide-react'
import { createSupabaseServiceClient } from '@/lib/supabase/service'
import { DealListPanel } from '@/components/deals/deal-list-panel'
import { DealDetailPanel } from '@/components/deals/deal-detail-panel'
import type { Database } from '@/types/supabase'

type DealRow = Database['public']['Tables']['deals']['Row']
type NoteRow = Database['public']['Tables']['notes']['Row']
type DealFileRow = Database['public']['Tables']['deal_files']['Row']
type ActivityRow = Database['public']['Tables']['activities']['Row']

type SearchParams = Record<string, string | string[] | undefined>

function firstParam(sp: SearchParams | undefined, key: string) {
  const v = sp?.[key]
  return Array.isArray(v) ? (v[0] ?? '') : (v ?? '')
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>
}) {
  const sp = await searchParams
  const selectedId = firstParam(sp, 'selected')
  const statusFilter = firstParam(sp, 'status')

  const { userId } = await auth()
  if (!userId) redirect('/auth/login')

  const supabase = createSupabaseServiceClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let dealsQuery = (supabase.from('deals') as any)
    .select('id, title, address, price, status, created_at, description')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (statusFilter) dealsQuery = dealsQuery.eq('status', statusFilter)

  const { data: dealsData } = await dealsQuery as { data: DealRow[] | null }
  const deals = dealsData ?? []

  let selectedDeal: DealRow | null = null
  let dealNotes: NoteRow[] = []
  let dealFiles: (DealFileRow & { signedUrl: string | null })[] = []
  let dealActivities: ActivityRow[] = []

  if (selectedId) {
    const [dealResult, notesResult, filesResult, activitiesResult] = await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from('deals') as any)
        .select('*')
        .eq('id', selectedId)
        .eq('user_id', userId)
        .single() as Promise<{ data: DealRow | null }>,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from('notes') as any)
        .select('*')
        .eq('deal_id', selectedId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false }) as Promise<{ data: NoteRow[] | null }>,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from('deal_files') as any)
        .select('*')
        .eq('deal_id', selectedId)
        .order('created_at', { ascending: false }) as Promise<{ data: DealFileRow[] | null }>,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from('activities') as any)
        .select('*')
        .eq('deal_id', selectedId)
        .order('created_at', { ascending: false }) as Promise<{ data: ActivityRow[] | null }>,
    ])

    selectedDeal = dealResult.data
    dealNotes = notesResult.data ?? []
    dealActivities = activitiesResult.data ?? []

    const rawFiles = filesResult.data ?? []
    dealFiles = await Promise.all(
      rawFiles.map(async (f) => {
        const { data } = await supabase.storage
          .from('deal-files')
          .createSignedUrl(f.storage_path, 3600)
        return { ...f, signedUrl: data?.signedUrl ?? null }
      })
    )
  }

  return (
    <div className="flex h-full w-full overflow-hidden">
      <DealListPanel deals={deals} selectedId={selectedId} statusFilter={statusFilter} />

      <div className="flex flex-1 flex-col overflow-hidden">
        {selectedDeal ? (
          <DealDetailPanel
            deal={selectedDeal}
            notes={dealNotes}
            files={dealFiles}
            activities={dealActivities}
            userId={userId}
          />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <div className="flex size-14 items-center justify-center rounded-full border border-border bg-card">
              <Building2 className="size-6 text-muted-foreground/50" />
            </div>
            <p className="text-sm text-muted-foreground">Selecione um negócio para ver os detalhes</p>
          </div>
        )}
      </div>
    </div>
  )
}

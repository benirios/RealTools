import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Building2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/deals/deal-card'
import { DealFormModal } from '@/components/deals/deal-form-modal'
import { DeleteDealDialog } from '@/components/deals/delete-deal-dialog'
import { NotesSection } from '@/components/notes/notes-section'
import { FilesSection } from '@/components/files/files-section'
import { ActivityLogSection } from '@/components/deals/activity-log-section'
import type { Database } from '@/types/supabase'

type DealRow = Database['public']['Tables']['deals']['Row']
type NoteRow = Database['public']['Tables']['notes']['Row']
type DealFileRow = Database['public']['Tables']['deal_files']['Row']
type ActivityRow = Database['public']['Tables']['activities']['Row']

export default async function DealHubPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Parallel fetch — never fetch per-component (RESEARCH.md Anti-Pattern)
  // All queries use `as any` cast to bypass supabase-js 2.104.x PostgrestVersion=never inference bug
  const [
    dealResult,
    notesResult,
    filesResult,
    activitiesResult,
  ] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from('deals') as any)
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single() as Promise<{ data: DealRow | null; error: unknown }>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from('notes') as any)
      .select('*')
      .eq('deal_id', id)
      .order('created_at', { ascending: false }) as Promise<{ data: NoteRow[] | null; error: unknown }>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from('deal_files') as any)
      .select('*')
      .eq('deal_id', id)
      .order('created_at', { ascending: false }) as Promise<{ data: DealFileRow[] | null; error: unknown }>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from('activities') as any)
      .select('*')
      .eq('deal_id', id)
      .order('created_at', { ascending: false }) as Promise<{ data: ActivityRow[] | null; error: unknown }>,
  ])

  if (!dealResult.data) notFound()

  const deal = dealResult.data
  const notes: NoteRow[] = notesResult.data ?? []
  const activities: ActivityRow[] = activitiesResult.data ?? []

  // Generate signed URLs server-side — 1-hour expiry, one request per file
  const rawFiles = filesResult.data ?? []
  const filesWithUrls = await Promise.all(
    rawFiles.map(async (f) => {
      const { data } = await supabase.storage
        .from('deal-files')
        .createSignedUrl(f.storage_path, 3600)
      return { ...f, signedUrl: data?.signedUrl ?? null }
    })
  )

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Voltar para Negócios
      </Link>

      <section className="rounded-md border border-border bg-card p-4 md:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="max-w-4xl text-2xl font-semibold leading-tight text-foreground md:text-[28px]">
                {deal.title}
              </h1>
              <StatusBadge status={deal.status} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-md border border-border/70 bg-secondary p-3">
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Endereço
                </p>
                <p className="text-sm text-foreground">{deal.address ?? '—'}</p>
              </div>
              <div className="rounded-md border border-border/70 bg-secondary p-3">
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Preço pedido
                </p>
                <p className="text-sm text-foreground">{deal.price ?? '—'}</p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            <DealFormModal
              deal={deal}
              trigger={
                <Button variant="outline" size="sm">
                  Editar
                </Button>
              }
            />
            <DeleteDealDialog dealId={deal.id} />
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <div className="space-y-6">
          <Card>
            <CardContent className="space-y-3 pt-6">
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-md bg-muted text-muted-foreground">
                  <Building2 className="size-4" />
                </span>
                <h2 className="text-[15px] font-medium text-foreground">Detalhes do negócio</h2>
              </div>
              {deal.description ? (
                <div>
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Descrição
                  </p>
                  <p className="text-sm leading-6 text-foreground">{deal.description}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma descrição adicionada.</p>
              )}
            </CardContent>
          </Card>

          <NotesSection notes={notes} dealId={deal.id} />

          <FilesSection files={filesWithUrls} dealId={deal.id} userId={user.id} />
        </div>

        <div className="space-y-6">
          <ActivityLogSection activities={activities} />
        </div>
      </div>
    </div>
  )
}

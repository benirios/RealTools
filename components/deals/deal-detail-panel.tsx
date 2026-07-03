import Link from 'next/link'
import { ChevronLeft, ExternalLink, FileText, Clock } from 'lucide-react'
import { DealFormModal } from './deal-form-modal'
import { DeleteDealDialog } from './delete-deal-dialog'
import { NotesSection } from '@/components/notes/notes-section'
import type { Database } from '@/types/supabase'

type DealRow = Database['public']['Tables']['deals']['Row']
type NoteRow = Database['public']['Tables']['notes']['Row']
type DealFileRow = Database['public']['Tables']['deal_files']['Row']
type ActivityRow = Database['public']['Tables']['activities']['Row']
type DealFile = DealFileRow & { signedUrl: string | null }

const STATUS = {
  active:      { label: 'Ativo',          color: '#22c55e' },
  negotiating: { label: 'Em Negociação',   color: '#3b82f6' },
  closed:      { label: 'Fechado',         color: '#6b7280' },
} as const

function fmtDate(d: string | null) {
  if (!d) return ''
  return new Intl.DateTimeFormat('pt-BR', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(d))
}

function fmtShort(d: string | null) {
  if (!d) return ''
  return new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short' }).format(new Date(d))
}

export function DealDetailPanel({
  deal,
  notes,
  files,
  activities,
}: {
  deal: DealRow
  notes: NoteRow[]
  files: DealFile[]
  activities: ActivityRow[]
  userId: string
}) {
  const status = STATUS[deal.status as keyof typeof STATUS] ?? STATUS.active

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-2">
        <div className="flex items-center gap-1">
          <Link
            href="/dashboard"
            className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <ChevronLeft className="size-4" />
          </Link>
          <Link
            href={`/deals/${deal.id}`}
            className="ml-1 flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <ExternalLink className="size-3" />
            Abrir completo
          </Link>
        </div>
        <div className="flex items-center gap-1">
          <DealFormModal
            deal={deal}
            trigger={
              <button className="rounded-md px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
                Editar
              </button>
            }
          />
          <DeleteDealDialog dealId={deal.id} />
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Status line + title */}
        <div className="mb-5">
          <p className="mb-1 flex items-center gap-2 text-xs">
            <span style={{ color: status.color }} className="font-medium">{status.label}</span>
            <span className="text-muted-foreground">—</span>
            <span className="text-muted-foreground">{fmtDate(deal.created_at)}</span>
          </p>
          <h1 className="text-xl font-semibold text-foreground leading-snug">{deal.title}</h1>
        </div>

        {/* Metadata card */}
        <div className="mb-5 flex items-start gap-3 rounded-md border border-border bg-card/50 p-3">
          <div
            className="flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold"
            style={{ backgroundColor: status.color + '20', color: status.color }}
          >
            {deal.title.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{deal.title}</p>
            {deal.address && (
              <p className="mt-0.5 truncate text-xs text-muted-foreground">{deal.address}</p>
            )}
            {deal.price && (
              <p className="mt-0.5 text-xs font-medium" style={{ color: status.color }}>
                {deal.price}
              </p>
            )}
          </div>
          <span
            className="shrink-0 rounded border px-2 py-0.5 text-[10px] font-medium"
            style={{
              color: status.color,
              borderColor: `${status.color}40`,
              backgroundColor: `${status.color}10`,
            }}
          >
            Comercial
          </span>
        </div>

        {/* Description */}
        {deal.description && (
          <div className="mb-5 rounded-md border border-border bg-card/50 p-4">
            <p className="mb-2 text-[10px] font-medium uppercase tracking-widest text-muted-foreground/60">
              Descrição
            </p>
            <p className="text-sm text-foreground/90 leading-relaxed">{deal.description}</p>
          </div>
        )}

        {/* Notes */}
        <div className="mb-5">
          <NotesSection notes={notes} dealId={deal.id} />
        </div>

        {/* Status selector */}
        <div className="mb-5">
          <p className="mb-2 text-[10px] font-medium uppercase tracking-widest text-muted-foreground/60">
            Status
          </p>
          <div className="flex gap-2">
            {(['active', 'negotiating', 'closed'] as const).map((s) => {
              const cfg = STATUS[s]
              const isCurrent = deal.status === s
              return (
                <div
                  key={s}
                  className="flex-1 rounded-md border px-2 py-2 text-center text-[11px] font-medium"
                  style={
                    isCurrent
                      ? { backgroundColor: cfg.color, color: '#000', borderColor: cfg.color }
                      : { borderColor: '#2a2a28', color: '#555' }
                  }
                >
                  {cfg.label}
                </div>
              )
            })}
          </div>
        </div>

        {/* Files */}
        {files.length > 0 && (
          <div className="mb-5">
            <p className="mb-2 text-[10px] font-medium uppercase tracking-widest text-muted-foreground/60">
              Arquivos ({files.length})
            </p>
            <div className="space-y-2">
              {files.map((file) => (
                <div key={file.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <FileText className="size-3.5 shrink-0" />
                  {file.signedUrl ? (
                    <a
                      href={file.signedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="truncate transition-colors hover:text-foreground"
                    >
                      {file.file_name}
                    </a>
                  ) : (
                    <span className="truncate">{file.file_name}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Activities */}
        {activities.length > 0 && (
          <div className="mb-5">
            <p className="mb-2 text-[10px] font-medium uppercase tracking-widest text-muted-foreground/60">
              Atividade recente
            </p>
            <div className="space-y-1.5">
              {activities.slice(0, 5).map((activity) => (
                <div key={activity.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="size-3 shrink-0" />
                  <span className="flex-1 capitalize">{activity.event_type.replaceAll('_', ' ')}</span>
                  <span className="shrink-0">{fmtShort(activity.created_at)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

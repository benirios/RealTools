'use client'

import { useState } from 'react'
import { Upload, FileText, Download, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { insertDealFileAction, deleteDealFileAction } from '@/lib/actions/file-actions'
import { toast } from 'sonner'

type DealFile = {
  id: string
  file_name: string
  storage_path: string
  signedUrl: string | null
  deal_id: string
}

export function FilesSection({
  files,
  dealId,
  userId,
}: {
  files: DealFile[]
  dealId: string
  userId: string
}) {
  const [uploading, setUploading] = useState(false)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // 50MB limit
    if (file.size > 50 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo de 50MB.')
      e.target.value = ''
      return
    }

    setUploading(true)
    const supabase = createSupabaseBrowserClient()
    // Path: {user_id}/{deal_id}/{timestamp}-{filename} — required by Storage RLS policy
    const path = `${userId}/${dealId}/${Date.now()}-${file.name}`

    const { error: uploadError } = await supabase.storage
      .from('deal-files')
      .upload(path, file, { upsert: false })

    if (uploadError) {
      toast.error('Falha ao enviar arquivo.')
      setUploading(false)
      e.target.value = ''
      return
    }

    const result = await insertDealFileAction({
      dealId,
      storagePath: path,
      fileName: file.name,
    })

    setUploading(false)
    e.target.value = ''

    if (result.error) {
      toast.error('Arquivo enviado, mas o registro falhou. Atualize a página.')
    } else {
      toast.success('Arquivo enviado.')
    }
  }

  return (
    <section className="rounded-md border border-border bg-card p-4 md:p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-full border border-border bg-card text-foreground">
            <FileText className="size-4" />
          </span>
          <h2 className="text-[15px] font-medium text-foreground">Arquivos</h2>
        </div>
        <label className="cursor-pointer">
          <span className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted">
            {uploading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Enviando…</span>
              </>
            ) : (
              <>
                <Upload className="size-4" />
                <span>Enviar Arquivo</span>
              </>
            )}
          </span>
          <input
            type="file"
            className="sr-only"
            onChange={handleFileChange}
            disabled={uploading}
          />
        </label>
      </div>

      {files.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">Nenhum arquivo enviado ainda.</p>
      ) : (
        <div className="space-y-2">
          {files.map((file) => (
            <FileRow key={file.id} file={file} />
          ))}
        </div>
      )}
    </section>
  )
}

function FileRow({ file }: { file: DealFile }) {
  const [deletePending, setDeletePending] = useState(false)

  async function handleDelete() {
    setDeletePending(true)
    const result = await deleteDealFileAction({
      fileId:      file.id,
      storagePath: file.storage_path,
      dealId:      file.deal_id,
    })
    setDeletePending(false)
    if (result.error) {
      toast.error('Falha ao excluir. Tente novamente.')
    } else {
      toast.success('Excluído.')
    }
  }

  return (
    <div className="flex min-h-12 items-center justify-between rounded-md border border-border/70 bg-secondary px-4 py-3 transition-colors hover:bg-muted">
      <div className="flex items-center gap-2 min-w-0">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-card text-foreground">
          <FileText className="size-4" />
        </span>
        <span className="truncate text-sm text-foreground">{file.file_name}</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {file.signedUrl && (
          <a
            href={file.signedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            aria-label={`Baixar ${file.file_name}`}
          >
            <Download className="size-4" />
            Baixar
          </a>
        )}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              aria-label="Excluir arquivo"
            >
              <Trash2 className="size-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-card border-border text-foreground">
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir Arquivo?</AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                Este arquivo será excluído permanentemente do armazenamento.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-border text-foreground hover:bg-muted">
                Manter
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={deletePending}
                className="bg-destructive hover:bg-destructive/90 text-white"
              >
                {deletePending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Excluir'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}

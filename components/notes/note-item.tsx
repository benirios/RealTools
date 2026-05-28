'use client'

import { useActionState, useState, useRef, useEffect } from 'react'
import { Pencil, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
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
import { updateNoteAction, deleteNoteAction, type NoteState } from '@/lib/actions/note-actions'
import { toast } from 'sonner'

type Note = {
  id: string
  content: string
  created_at: string | null
  updated_at: string | null
  deal_id: string
}

const initialEditState: NoteState = {}

export function NoteItem({ note }: { note: Note }) {
  const [editing, setEditing] = useState(false)
  const [deletePending, setDeletePending] = useState(false)
  const [editState, editAction, isEditPending] = useActionState(updateNoteAction, initialEditState)

  // Detect transition from pending → not pending with no errors → success (exit edit mode)
  const prevPending = useRef(false)
  useEffect(() => {
    if (prevPending.current && !isEditPending && !editState.errors) {
      setEditing(false)
      toast.success('Nota atualizada.')
    }
    prevPending.current = isEditPending
  }, [isEditPending, editState])

  async function handleDelete() {
    setDeletePending(true)
    const result = await deleteNoteAction(note.id, note.deal_id)
    setDeletePending(false)
    if (result.error) {
      toast.error('Falha ao excluir. Tente novamente.')
    } else {
      toast.success('Excluída.')
    }
  }

  const displayDate = note.updated_at ?? note.created_at
  const timestamp = displayDate
    ? new Date(displayDate).toLocaleDateString('pt-BR', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : ''

  if (editing) {
    return (
      <div className="rounded-md border border-border/70 bg-secondary px-4 py-3">
        <form action={editAction}>
          <input type="hidden" name="note_id" value={note.id} />
          <input type="hidden" name="deal_id" value={note.deal_id} />
          <Textarea
            name="content"
            defaultValue={note.content}
            rows={3}
            className="w-full"
            disabled={isEditPending}
          />
          {editState.errors?.content && (
            <p className="text-sm text-destructive mt-1">{editState.errors.content[0]}</p>
          )}
          {editState.errors?.general && (
            <p className="text-sm text-destructive mt-1">{editState.errors.general[0]}</p>
          )}
          <div className="flex justify-end gap-2 mt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => setEditing(false)}
              disabled={isEditPending}
            >
              Descartar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isEditPending}
            >
              {isEditPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar Nota'}
            </Button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className="group min-h-12 rounded-md border border-border/70 bg-secondary px-4 py-3 transition-colors hover:bg-muted">
      <p className="text-sm leading-6 text-foreground">{note.content}</p>
      <div className="flex items-center justify-between mt-2">
        <time className="text-xs text-muted-foreground">{timestamp}</time>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => setEditing(true)}
            aria-label="Editar nota"
          >
            <Pencil className="size-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                aria-label="Excluir nota"
              >
                <Trash2 className="size-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-card border-border text-foreground">
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir Nota?</AlertDialogTitle>
                <AlertDialogDescription className="text-muted-foreground">
                  Esta nota será excluída permanentemente.
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
    </div>
  )
}

'use client'

import { useActionState, useState, useRef, useEffect } from 'react'
import { NotebookText, Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { NoteItem } from './note-item'
import { createNoteAction, type NoteState } from '@/lib/actions/note-actions'
import { toast } from 'sonner'

type Note = {
  id: string
  content: string
  created_at: string | null
  updated_at: string | null
  deal_id: string
}

const initialState: NoteState = {}

export function NotesSection({ notes, dealId }: { notes: Note[]; dealId: string }) {
  const [showAdd, setShowAdd] = useState(false)
  const [state, formAction, isPending] = useActionState(createNoteAction, initialState)
  const formRef = useRef<HTMLFormElement>(null)

  // Detect success: pending→not pending with no errors → hide form and reset
  const prevPending = useRef(false)
  useEffect(() => {
    if (prevPending.current && !isPending && !state.errors) {
      setShowAdd(false)
      formRef.current?.reset()
      toast.success('Nota adicionada.')
    }
    prevPending.current = isPending
  }, [isPending, state])

  return (
    <section className="rounded-md border border-border bg-card p-4 md:p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <NotebookText className="size-4" />
          </span>
          <h2 className="text-[15px] font-medium text-foreground">Notas</h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground"
          onClick={() => setShowAdd(!showAdd)}
        >
          <Plus className="size-4 mr-1" />
          Adicionar Nota
        </Button>
      </div>

      {showAdd && (
        <form ref={formRef} action={formAction} className="mb-4">
          <input type="hidden" name="deal_id" value={dealId} />
          <Textarea
            name="content"
            placeholder="Escreva uma nota…"
            rows={3}
            className="w-full"
            disabled={isPending}
          />
          {state.errors?.content && (
            <p className="text-sm text-destructive mt-1">{state.errors.content[0]}</p>
          )}
          {state.errors?.general && (
            <p className="text-sm text-destructive mt-1">{state.errors.general[0]}</p>
          )}
          <div className="flex justify-end gap-2 mt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => setShowAdd(false)}
              disabled={isPending}
            >
              Descartar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isPending}
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar Nota'}
            </Button>
          </div>
        </form>
      )}

      {notes.length === 0 && !showAdd ? (
        <p className="text-sm text-muted-foreground text-center py-4">Nenhuma nota ainda.</p>
      ) : (
        <div className="space-y-2">
          {notes.map((note) => (
            <NoteItem key={note.id} note={note} />
          ))}
        </div>
      )}
    </section>
  )
}

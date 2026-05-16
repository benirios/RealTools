'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'
import type { Database } from '@/types/supabase'

// Explicit table types to work around supabase-js 2.104.x __InternalSupabase
// PostgrestVersion inference issue that causes from() to return Relation=never.
type NoteInsert = Database['public']['Tables']['notes']['Insert']
type NoteUpdate = Database['public']['Tables']['notes']['Update']

const NoteSchema = z.object({
  content: z.string().min(1, 'Note content is required'),
  deal_id: z.string().uuid(),
})

const NoteUpdateSchema = z.object({
  content: z.string().min(1, 'Note content is required'),
})

export type NoteState = {
  errors?: {
    content?: string[]
    deal_id?: string[]
    general?: string[]
  }
}

export async function createNoteAction(
  _prevState: NoteState,
  formData: FormData
): Promise<NoteState> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const parsed = NoteSchema.safeParse({
    content: formData.get('content'),
    deal_id: formData.get('deal_id'),
  })

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const insertData: NoteInsert = {
    content: parsed.data.content,
    deal_id: parsed.data.deal_id,
    user_id: user.id,
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('notes') as any).insert(insertData)

  if (error) return { errors: { general: ['Failed to save note. Please try again.'] } }

  try {
    const serviceClient = createSupabaseServiceClient()
    // Best-effort telemetry: primary note creation has already succeeded.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (serviceClient.from('activities') as any).insert({
      deal_id: parsed.data.deal_id,
      event_type: 'note_added',
      metadata: {},
    })
  } catch {
    // Do not block note creation on telemetry failure.
  }

  revalidatePath(`/deals/${parsed.data.deal_id}`)
  return {}
}

export async function updateNoteAction(
  _prevState: NoteState,
  formData: FormData
): Promise<NoteState> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const noteId = formData.get('note_id') as string
  const dealId = formData.get('deal_id') as string
  if (!noteId || !dealId) return { errors: { general: ['Missing note ID.'] } }

  const parsed = NoteUpdateSchema.safeParse({
    content: formData.get('content'),
  })

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const updateData: NoteUpdate = {
    content: parsed.data.content,
    updated_at: new Date().toISOString(),
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('notes') as any)
    .update(updateData)
    .eq('id', noteId)
    .eq('user_id', user.id)

  if (error) return { errors: { general: ['Failed to save note. Please try again.'] } }

  revalidatePath(`/deals/${dealId}`)
  return {}
}

export async function deleteNoteAction(
  noteId: string,
  dealId: string
): Promise<{ error?: string }> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('notes') as any)
    .delete()
    .eq('id', noteId)
    .eq('user_id', user.id)

  if (error) return { error: 'Failed to delete. Please try again.' }

  revalidatePath(`/deals/${dealId}`)
  return {}
}

'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createSupabaseServerClient } from '@/lib/supabase/server'

const LoginSchema = z.object({
  email: z.string().email('Informe um email válido'),
  password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres'),
})

export type LoginState = {
  errors?: {
    email?: string[]
    password?: string[]
    general?: string[]
  }
}

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const parsed = LoginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)

  if (error) {
    // Map Supabase's "Invalid login credentials" message to the broker-facing copy from UI-SPEC line 195.
    return { errors: { general: ['Email ou senha incorretos'] } }
  }

  redirect('/decision-surface')
}

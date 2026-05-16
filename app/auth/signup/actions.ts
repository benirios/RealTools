'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createSupabaseServerClient } from '@/lib/supabase/server'

const SignUpSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export type SignUpState = {
  errors?: {
    email?: string[]
    password?: string[]
    general?: string[]
  }
}

export async function signUpAction(
  _prevState: SignUpState,
  formData: FormData
): Promise<SignUpState> {
  const parsed = SignUpSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      // Even with email confirmation disabled in dashboard, set this so future re-enable works.
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  })

  if (error) {
    // Supabase returns "User already registered" or similar — map to the UI-SPEC copy.
    const message = error.message.toLowerCase().includes('already')
      ? 'An account with this email already exists'
      : 'Something went wrong. Please try again.'
    return { errors: { general: [message] } }
  }

  redirect('/dashboard')
}

'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { InvestorSchema, type InvestorState } from '@/lib/schemas/investor'
import { createInvestor, deleteInvestor, DEMO_INVESTORS, updateInvestor } from '@/lib/investors/data'
import { recalculateAllMatches, recalculateMatchesForInvestor } from '@/lib/investors/match-processing'

function parseJsonArray(value: FormDataEntryValue | null): string[] {
  if (!value) return []
  try {
    const parsed = JSON.parse(String(value))
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : []
  } catch {
    return []
  }
}

function parseInvestorForm(formData: FormData) {
  return InvestorSchema.safeParse({
    name:                   formData.get('name'),
    email:                  formData.get('email') || undefined,
    phone:                  formData.get('phone') || undefined,
    budgetMin:              formData.get('budgetMin'),
    budgetMax:              formData.get('budgetMax'),
    preferredNeighborhoods: parseJsonArray(formData.get('preferredNeighborhoods')),
    propertyTypes:          parseJsonArray(formData.get('propertyTypes')),
    strategy:               formData.get('strategy') || 'any',
    riskLevel:              formData.get('riskLevel') || 'any',
    desiredYield:           formData.get('desiredYield'),
    tags:                   parseJsonArray(formData.get('tags')),
    notes:                  formData.get('notes') || undefined,
  })
}

export async function createInvestorAction(
  _prevState: InvestorState,
  formData: FormData
): Promise<InvestorState> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const parsed = parseInvestorForm(formData)
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors }

  const { data, error } = await createInvestor(supabase, user.id, parsed.data)
  if (error) return { errors: { general: ['Failed to save investor. Please try again.'] } }

  if (data?.id) {
    await recalculateMatchesForInvestor(supabase, user.id, data.id)
  }

  revalidatePath('/investors')
  return {}
}

export async function updateInvestorAction(
  _prevState: InvestorState,
  formData: FormData
): Promise<InvestorState> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const investorId = String(formData.get('investorId') ?? '')
  if (!investorId) return { errors: { general: ['Missing investor ID.'] } }

  const parsed = parseInvestorForm(formData)
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors }

  const { error } = await updateInvestor(supabase, user.id, investorId, parsed.data)
  if (error) return { errors: { general: ['Failed to save investor. Please try again.'] } }

  await recalculateMatchesForInvestor(supabase, user.id, investorId, true)

  revalidatePath('/investors')
  revalidatePath(`/investors/${investorId}`)
  return {}
}

export async function deleteInvestorAction(investorId: string): Promise<{ error?: string }> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { error } = await deleteInvestor(supabase, user.id, investorId)
  if (error) return { error: 'Failed to delete investor. Please try again.' }

  revalidatePath('/investors')
  return {}
}

export async function seedDemoInvestorsAction(): Promise<{ ok: boolean; message: string }> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  let saved = 0
  for (const investor of DEMO_INVESTORS) {
    const { error } = await createInvestor(supabase, user.id, investor)
    if (!error) saved += 1
  }

  if (saved > 0) {
    await recalculateAllMatches(supabase, user.id, true)
  }

  revalidatePath('/investors')
  return {
    ok: saved > 0,
    message: `${saved} demo investors created.`,
  }
}

export async function recalculateInvestorMatchesAction(investorId: string): Promise<{ ok: boolean; message: string }> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const result = await recalculateMatchesForInvestor(supabase, user.id, investorId, true)

  revalidatePath('/investors')
  revalidatePath(`/investors/${investorId}`)

  return result.error
    ? { ok: false, message: result.error }
    : { ok: true, message: `${result.matchedCount} matches recalculated for this investor.` }
}

export async function recalculateAllMatchesAction(): Promise<{ ok: boolean; message: string }> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const result = await recalculateAllMatches(supabase, user.id, true)

  revalidatePath('/investors')
  revalidatePath('/imoveis')

  return result.error
    ? { ok: false, message: result.error }
    : { ok: true, message: `${result.matchedCount} total matches recalculated.` }
}

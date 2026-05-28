'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'
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
  const { userId } = await auth()
  if (!userId) redirect('/auth/login')

  const parsed = parseInvestorForm(formData)
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors }

  const supabase = createSupabaseServiceClient()
  const { data, error } = await createInvestor(supabase, userId, parsed.data)
  if (error) return { errors: { general: ['Não foi possível salvar o investidor. Tente novamente.'] } }

  if (data?.id) {
    await recalculateMatchesForInvestor(supabase, userId, data.id)
  }

  revalidatePath('/investors')
  return {}
}

export async function updateInvestorAction(
  _prevState: InvestorState,
  formData: FormData
): Promise<InvestorState> {
  const { userId } = await auth()
  if (!userId) redirect('/auth/login')

  const investorId = String(formData.get('investorId') ?? '')
  if (!investorId) return { errors: { general: ['ID do investidor ausente.'] } }

  const parsed = parseInvestorForm(formData)
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors }

  const supabase = createSupabaseServiceClient()
  const { error } = await updateInvestor(supabase, userId, investorId, parsed.data)
  if (error) return { errors: { general: ['Não foi possível salvar o investidor. Tente novamente.'] } }

  await recalculateMatchesForInvestor(supabase, userId, investorId, true)

  revalidatePath('/investors')
  revalidatePath(`/investors/${investorId}`)
  return {}
}

export async function deleteInvestorAction(investorId: string): Promise<{ error?: string }> {
  const { userId } = await auth()
  if (!userId) redirect('/auth/login')

  const supabase = createSupabaseServiceClient()
  const { error } = await deleteInvestor(supabase, userId, investorId)
  if (error) return { error: 'Não foi possível excluir o investidor. Tente novamente.' }

  revalidatePath('/investors')
  return {}
}

export async function seedDemoInvestorsAction(): Promise<{ ok: boolean; message: string }> {
  const { userId } = await auth()
  if (!userId) redirect('/auth/login')

  const supabase = createSupabaseServiceClient()
  let saved = 0
  for (const investor of DEMO_INVESTORS) {
    const { error } = await createInvestor(supabase, userId, investor)
    if (!error) saved += 1
  }

  if (saved > 0) {
    await recalculateAllMatches(supabase, userId, true)
  }

  revalidatePath('/investors')
  return {
    ok: saved > 0,
    message: `${saved} clientes demo criados.`,
  }
}

export async function recalculateInvestorMatchesAction(investorId: string): Promise<{ ok: boolean; message: string }> {
  const { userId } = await auth()
  if (!userId) redirect('/auth/login')

  const supabase = createSupabaseServiceClient()
  const result = await recalculateMatchesForInvestor(supabase, userId, investorId, true)

  revalidatePath('/investors')
  revalidatePath(`/investors/${investorId}`)

  return result.error
    ? { ok: false, message: result.error }
    : { ok: true, message: `${result.matchedCount} matches recalculados para este investidor.` }
}

export async function recalculateAllMatchesAction(): Promise<{ ok: boolean; message: string }> {
  const { userId } = await auth()
  if (!userId) redirect('/auth/login')

  const supabase = createSupabaseServiceClient()
  const result = await recalculateAllMatches(supabase, userId, true)

  revalidatePath('/investors')
  revalidatePath('/imoveis')

  return result.error
    ? { ok: false, message: result.error }
    : { ok: true, message: `${result.matchedCount} matches totais recalculados.` }
}

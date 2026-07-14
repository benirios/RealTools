'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'
import { ManualListingSchema, type ManualListingState } from '@/lib/schemas/manual-listing'
import { recalculateMatchesForInvestor } from '@/lib/investors/match-processing'

function parseImages(value: FormDataEntryValue | null): string[] {
  if (!value) return []
  try {
    const parsed = JSON.parse(String(value))
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : []
  } catch {
    return []
  }
}

function parseManualListingForm(formData: FormData) {
  return ManualListingSchema.safeParse({
    title:          formData.get('title'),
    priceAmount:    formData.get('priceAmount'),
    priceText:      formData.get('priceText') || undefined,
    propertyType:   formData.get('propertyType') || undefined,
    commercialType: formData.get('commercialType') || undefined,
    isCommercial:   formData.get('isCommercial') === 'on',
    addressText:    formData.get('addressText') || undefined,
    neighborhood:   formData.get('neighborhood') || undefined,
    city:           formData.get('city') || undefined,
    state:          formData.get('state') || undefined,
    description:    formData.get('description') || undefined,
    images:         parseImages(formData.get('images')),
  })
}

export async function createManualListingAction(
  _prevState: ManualListingState,
  formData: FormData
): Promise<ManualListingState> {
  const { userId } = await auth()
  if (!userId) redirect('/auth/login')

  const investorId = String(formData.get('investorId') ?? '')
  if (!investorId) return { errors: { general: ['Cliente ausente.'] } }

  const parsed = parseManualListingForm(formData)
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors }

  const supabase = createSupabaseServiceClient()
  const now = new Date().toISOString()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('listings') as any)
    .insert({
      user_id:         userId,
      investor_id:     investorId,
      source:          'manual',
      source_url:      null,
      title:           parsed.data.title,
      price_amount:    parsed.data.priceAmount ?? null,
      price_text:      parsed.data.priceText ?? null,
      property_type:   parsed.data.propertyType ?? null,
      commercial_type: parsed.data.commercialType ?? null,
      is_commercial:   parsed.data.isCommercial,
      address_text:    parsed.data.addressText ?? null,
      neighborhood:    parsed.data.neighborhood ?? null,
      city:            parsed.data.city ?? null,
      state:           parsed.data.state ?? null,
      description:     parsed.data.description ?? null,
      images:          parsed.data.images,
      confidence:      100,
      is_favorited:    true,
      first_seen_at:   now,
      last_seen_at:    now,
    })
    .select('id')
    .single()

  if (error || !data) return { errors: { general: ['Não foi possível salvar o imóvel. Tente novamente.'] } }

  await recalculateMatchesForInvestor(supabase, userId, investorId, true)

  revalidatePath(`/investors/${investorId}`)
  return {}
}

export async function updateManualListingAction(
  _prevState: ManualListingState,
  formData: FormData
): Promise<ManualListingState> {
  const { userId } = await auth()
  if (!userId) redirect('/auth/login')

  const listingId = String(formData.get('listingId') ?? '')
  if (!listingId) return { errors: { general: ['ID do imóvel ausente.'] } }

  const parsed = parseManualListingForm(formData)
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors }

  const supabase = createSupabaseServiceClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (supabase.from('listings') as any)
    .select('id, investor_id')
    .eq('id', listingId)
    .eq('user_id', userId)
    .maybeSingle() as { data: { id: string; investor_id: string | null } | null }

  if (!existing) return { errors: { general: ['Imóvel não encontrado.'] } }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('listings') as any)
    .update({
      title:           parsed.data.title,
      price_amount:    parsed.data.priceAmount ?? null,
      price_text:      parsed.data.priceText ?? null,
      property_type:   parsed.data.propertyType ?? null,
      commercial_type: parsed.data.commercialType ?? null,
      is_commercial:   parsed.data.isCommercial,
      address_text:    parsed.data.addressText ?? null,
      neighborhood:    parsed.data.neighborhood ?? null,
      city:            parsed.data.city ?? null,
      state:           parsed.data.state ?? null,
      description:     parsed.data.description ?? null,
      images:          parsed.data.images,
      updated_at:      new Date().toISOString(),
    })
    .eq('id', listingId)
    .eq('user_id', userId)

  if (error) return { errors: { general: ['Não foi possível atualizar o imóvel. Tente novamente.'] } }

  if (existing.investor_id) {
    await recalculateMatchesForInvestor(supabase, userId, existing.investor_id, true)
    revalidatePath(`/investors/${existing.investor_id}`)
  }

  revalidatePath(`/imoveis/${listingId}`)
  return {}
}

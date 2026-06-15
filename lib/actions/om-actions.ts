'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { createSupabaseServiceClient } from '@/lib/supabase/service'
import { createResendClient } from '@/lib/resend'
import { OmEmailHtml } from '@/lib/email/om-template'
import type { Database } from '@/types/supabase'

type InvestorOmSendRow = Database['public']['Tables']['investor_om_sends']['Row']
type InvestorRow = Pick<Database['public']['Tables']['investors']['Row'], 'id' | 'name' | 'email'>
type ListingRow = Pick<Database['public']['Tables']['listings']['Row'], 'id' | 'title' | 'address_text' | 'location_text' | 'city' | 'state' | 'price_text'>

export type SendOmResult =
  | { status: 'sent'; count: number }
  | { status: 'error'; message: string }

/**
 * Send OM emails to one or more investors for a given listing.
 * Creates/updates investor_om_sends rows (upsert on user_id+listing_id+investor_id unique
 * combo is NOT in the schema — each call creates a new send row intentionally,
 * so re-sends produce a new tracking token and row).
 * Guards: userId required, investor must belong to userId, email must be non-null.
 */
export async function sendOmAction(
  listingId: string,
  investorIds: string[],
): Promise<SendOmResult> {
  const { userId } = await auth()
  if (!userId) return { status: 'error', message: 'Não autenticado.' }
  if (!investorIds.length) return { status: 'error', message: 'Nenhum investidor selecionado.' }

  const supabase = createSupabaseServiceClient()

  // Load listing
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: listing } = await (supabase.from('listings') as any)
    .select('id, title, address_text, location_text, city, state, price_text')
    .eq('id', listingId)
    .eq('user_id', userId)
    .single() as { data: ListingRow | null }

  if (!listing) return { status: 'error', message: 'Imóvel não encontrado.' }

  // Load investors — scoped to userId to prevent cross-tenant sends
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: investors } = await (supabase.from('investors') as any)
    .select('id, name, email')
    .in('id', investorIds)
    .eq('user_id', userId) as { data: InvestorRow[] | null }

  if (!investors?.length) return { status: 'error', message: 'Nenhum investidor válido encontrado.' }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? ''
  const resend = createResendClient()
  const sendFromEmail = process.env.RESEND_FROM_EMAIL ?? 'noreply@realtools.com.br'

  let sent = 0

  for (const investor of investors) {
    if (!investor.email) continue

    // Create send row — new row per send so re-sends get a fresh tracking token
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: sendRow } = await (supabase.from('investor_om_sends') as any)
      .insert({
        user_id: userId,
        listing_id: listingId,
        investor_id: investor.id,
        om_sent_at: new Date().toISOString(),
      })
      .select('tracking_token')
      .single() as { data: Pick<InvestorOmSendRow, 'tracking_token'> | null }

    if (!sendRow) continue

    const omUrl = `${siteUrl}/om/listing/${listingId}?ref=${sendRow.tracking_token}`
    const pixelUrl = `${siteUrl}/api/track/${sendRow.tracking_token}`
    const address = listing.address_text ?? listing.location_text ?? [listing.city, listing.state].filter(Boolean).join(', ') ?? ''

    if (resend) {
      await resend.emails.send({
        from: sendFromEmail,
        to: investor.email,
        subject: `Memorando de Oportunidade: ${listing.title}`,
        html: OmEmailHtml({
          investorName: investor.name ?? '',
          listingTitle: listing.title,
          listingAddress: address,
          listingPriceText: listing.price_text ?? null,
          omUrl,
          pixelUrl,
        }),
      })
    }

    sent++
  }

  revalidatePath(`/imoveis/${listingId}`)

  if (sent === 0) return { status: 'error', message: 'Nenhum email enviado. Verifique se os investidores possuem email cadastrado.' }
  return { status: 'sent', count: sent }
}

/**
 * Load all OM sends for an investor, scoped to userId.
 * Returns sends with listing title joined.
 */
export async function getOmSendsForInvestorAction(investorId: string) {
  const { userId } = await auth()
  if (!userId) return []

  const supabase = createSupabaseServiceClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase.from('investor_om_sends') as any)
    .select('id, tracking_token, om_sent_at, om_opened_at, created_at, listing_id, listings(title, price_text, city, state)')
    .eq('investor_id', investorId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false }) as {
      data: Array<{
        id: string
        tracking_token: string
        om_sent_at: string | null
        om_opened_at: string | null
        created_at: string | null
        listing_id: string
        listings: { title: string; price_text: string | null; city: string | null; state: string | null } | null
      }> | null
    }

  return data ?? []
}

/**
 * Load all OM sends for a listing, scoped to userId.
 * Returns sends with investor name/email joined.
 */
export async function getOmSendsForListingAction(listingId: string) {
  const { userId } = await auth()
  if (!userId) return []

  const supabase = createSupabaseServiceClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase.from('investor_om_sends') as any)
    .select('id, tracking_token, om_sent_at, om_opened_at, created_at, investor_id, investors(name, email)')
    .eq('listing_id', listingId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false }) as {
      data: Array<{
        id: string
        tracking_token: string
        om_sent_at: string | null
        om_opened_at: string | null
        created_at: string | null
        investor_id: string
        investors: { name: string | null; email: string | null } | null
      }> | null
    }

  return data ?? []
}

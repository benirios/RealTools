/* eslint-disable @typescript-eslint/no-require-imports */
const { createLocationInsight, upsertLocationInsightForListing } = require('./insights.js')
const { resolveLocationIntelligence } = require('./providers.js')

function buildDemoInputFromListing(listing, listingId) {
  const city = listing.city?.trim() || 'São Paulo'
  const state = listing.state?.trim() || 'SP'
  const neighborhood = listing.neighborhood?.trim() || 'Centro'
  const address = listing.address_text?.trim() || listing.location_text?.trim() || 'Avenida Paulista'

  return {
    listingId,
    address,
    neighborhood,
    city,
    state,
    country: listing.country?.trim() || 'BR',
    latitude: listing.lat ?? null,
    longitude: listing.lng ?? null,
  }
}

async function createDemoLocationInsightsForListing(supabase, userId, listing) {
  const standaloneInput = buildDemoInputFromListing(listing, null)
  const linkedInput = buildDemoInputFromListing(listing, listing.id)

  const standalone = await resolveLocationIntelligence(standaloneInput)
  const standaloneSave = await createLocationInsight(supabase, userId, standalone)
  if (standaloneSave.error || !standaloneSave.data) {
    return { ok: false, error: standaloneSave.error ?? 'Failed to create standalone demo insight.' }
  }

  const linked = await resolveLocationIntelligence(linkedInput)
  const linkedSave = await upsertLocationInsightForListing(supabase, userId, listing.id, linked)
  if (linkedSave.error || !linkedSave.data) {
    return { ok: false, error: linkedSave.error ?? 'Failed to create listing-linked demo insight.' }
  }

  return {
    ok: true,
    standalone: standaloneSave.data,
    linked: linkedSave.data,
  }
}

module.exports = {
  createDemoLocationInsightsForListing,
}

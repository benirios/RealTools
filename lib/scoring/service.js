/* eslint-disable @typescript-eslint/no-require-imports */
const { computeScore } = require('./engine.js')
const { upsertScore } = require('./data.js')

async function getListingLocationInsight(supabase, userId, listingId) {
  const { data } = await supabase.from('location_insights')
    .select('*').eq('listing_id', listingId).eq('user_id', userId)
    .order('updated_at', { ascending: false }).limit(1).maybeSingle()
  return data ?? null
}

async function loadListingForScoring(supabase, userId, listingId) {
  const { data } = await supabase.from('listings')
    .select('*').eq('id', listingId).eq('user_id', userId).maybeSingle()
  return data ?? null
}

async function scoreListingService(supabase, userId, listingId, strategySlug) {
  const listing = await loadListingForScoring(supabase, userId, listingId)
  if (!listing) {
    return { errors: { general: ['Imóvel não encontrado.'] } }
  }

  const insight = await getListingLocationInsight(supabase, userId, listingId)
  if (!insight) {
    return { errors: { general: ['Enriqueça a localização antes de calcular a pontuação.'] } }
  }

  const outcome = computeScore(listing, insight, strategySlug)

  if (outcome.status === 'NEEDS_ENRICHMENT') {
    return { errors: { general: ['Enriqueça a localização antes de calcular a pontuação.'] } }
  }
  if (outcome.status === 'ENRICHMENT_FAILED') {
    return { errors: { general: ['Não foi possível calcular a pontuação. Tente novamente.'] } }
  }

  const saveResult = await upsertScore(supabase, userId, listingId, outcome.result)
  if (saveResult.error) {
    return { errors: { general: ['Não foi possível salvar a pontuação.'] } }
  }

  return {
    message: 'Pontuação calculada com sucesso.',
    score: outcome.result,
    scoreResult: outcome.result,
  }
}

module.exports = { scoreListingService }

// CJS shim for node:test compatibility.
// This file replicates the logic of lib/scoring/data.ts without TypeScript types,
// 'server-only', or unstable_cache (not available in Node test runner context).

async function upsertScore(supabase, userId, listingId, result) {
  // Step 1: Read current score_version
  const { data: existing } = await supabase.from('opportunity_scores')
    .select('score_version')
    .eq('user_id', userId)
    .eq('listing_id', listingId)
    .eq('strategy_slug', result.strategySlug)
    .maybeSingle()

  const nextVersion = (existing?.score_version ?? 0) + 1

  const payload = {
    user_id: userId,
    listing_id: listingId,
    strategy_slug: result.strategySlug,
    total_score: result.totalScore,
    score_version: nextVersion,
    breakdown: result.breakdown,
    signals: result.signals,
    risks: result.risks,
    fit_label: result.fitLabel,
    computed_at: result.computedAt,
    demographics_score: (result.breakdown.find(c => c.category === 'demographics') ?? {}).score ?? null,
    location_score: (result.breakdown.find(c => c.category === 'location_quality') ?? {}).score ?? null,
    foot_traffic_score: (result.breakdown.find(c => c.category === 'nearby_businesses') ?? {}).score ?? null,
    competition_score: (result.breakdown.find(c => c.category === 'competition') ?? {}).score ?? null,
    risk_score: (result.breakdown.find(c => c.category === 'risk') ?? {}).score ?? null,
    investor_fit_score: (result.breakdown.find(c => c.category === 'investor_fit') ?? {}).score ?? null,
    engine_version: '1.0',
  }

  const { data, error } = await supabase.from('opportunity_scores')
    .upsert(payload, { onConflict: 'user_id,listing_id,strategy_slug' })
    .select('*')
    .single()

  if (error || !data) {
    return { data: null, error: error?.message ?? 'Não foi possível salvar a pontuação.' }
  }
  return { data, error: null }
}

async function getScoreHistory(supabase, userId, listingId, strategySlug) {
  let query = supabase.from('opportunity_scores')
    .select('*')
    .eq('user_id', userId)
    .eq('listing_id', listingId)

  if (strategySlug) {
    query = query.eq('strategy_slug', strategySlug)
  }

  const { data } = await query.order('total_score', { ascending: false })
  return data ?? []
}

async function getScore(supabase, userId, listingId, strategySlug) {
  const { data } = await supabase.from('opportunity_scores')
    .select('*')
    .eq('user_id', userId)
    .eq('listing_id', listingId)
    .eq('strategy_slug', strategySlug)
    .maybeSingle()
  return data ?? null
}

module.exports = {
  upsertScore,
  getScoreHistory,
  getScore,
}

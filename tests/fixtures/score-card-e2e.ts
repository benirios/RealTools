import { randomUUID } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import type { BrowserContext, Page } from 'playwright/test'
import type { Database, Json } from '@/types/supabase'

export type ScoreCardListingFixture = {
  listingId: string
  path: string
}

export type ScoreCardFixtures = {
  email: string
  password: string
  withInsightNoScore: ScoreCardListingFixture
  withInsightSavedScore: ScoreCardListingFixture
  withoutInsight: ScoreCardListingFixture
}

type SupabaseAdmin = ReturnType<typeof createClient<Database>>
type SessionCookie = {
  name: string
  value: string
  options: CookieOptions
}
type PlaywrightSameSite = 'Strict' | 'Lax' | 'None'

const E2E_PASSWORD = 'Score-card-e2e-Password-2026!'

function createAdminClient(): SupabaseAdmin {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for score card E2E.')
  }

  return createClient<Database>(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

function makeListing(userId: string, id: string, suffix: string): Database['public']['Tables']['listings']['Insert'] {
  return {
    id,
    user_id: userId,
    source: 'olx',
    source_url: `https://example.com/e2e-score-card/${id}`,
    title: `Loja comercial ${suffix}`,
    description: 'Ponto comercial para teste automatizado.',
    price_text: 'R$ 450.000',
    price_amount: 450000,
    country: 'BR',
    state: 'PE',
    city: 'Recife',
    neighborhood: 'Boa Viagem',
    address_text: 'Av. Boa Viagem, Recife',
    lat: -8.117,
    lng: -34.895,
    images: [],
    is_commercial: true,
    commercial_type: 'ponto_comercial',
    confidence: 94,
    reasoning: 'Classificado como comercial para cenário E2E.',
    tags: ['e2e', 'score-card'],
    raw_payload: {},
  }
}

function makeInsight(userId: string, listingId: string): Database['public']['Tables']['location_insights']['Insert'] {
  return {
    user_id: userId,
    listing_id: listingId,
    address: 'Av. Boa Viagem, Recife',
    neighborhood: 'Boa Viagem',
    city: 'Recife',
    state: 'PE',
    country: 'BR',
    latitude: -8.117,
    longitude: -34.895,
    avg_income: 5200,
    population_density: 6800,
    consumer_profile: 'Fluxo residencial e turístico com serviços próximos.',
    nearby_businesses: [
      { name: 'Shopping Recife', category: 'mall', distanceMeters: 450, source: 'e2e' },
      { name: 'Escola Técnica', category: 'school', distanceMeters: 280, source: 'e2e' },
      { name: 'Hospital', category: 'hospital', distanceMeters: 700, source: 'e2e' },
    ] as Json,
    data_sources: [{ provider: 'e2e', note: 'Fixture determinística' }] as Json,
    confidence_score: 88,
    raw_geocode: {} as Json,
    raw_demographics: {} as Json,
    raw_places: {} as Json,
  }
}

function makeScore(userId: string, listingId: string): Database['public']['Tables']['opportunity_scores']['Insert'] {
  const breakdown = [
    { category: 'demographics', label: 'Demografia', score: 72, weight: 0.2, weighted: 14.4 },
    { category: 'location_quality', label: 'Qualidade da localização', score: 78, weight: 0.2, weighted: 15.6 },
    { category: 'nearby_businesses', label: 'Fluxo potencial', score: 82, weight: 0.3, weighted: 24.6 },
    { category: 'competition', label: 'Concorrência', score: 61, weight: 0.15, weighted: 9.15 },
    { category: 'risk', label: 'Risco', score: 74, weight: 0.1, weighted: 7.4 },
  ]

  return {
    user_id: userId,
    listing_id: listingId,
    strategy_slug: 'cafe',
    total_score: 71,
    score_version: 2,
    breakdown: breakdown as Json,
    signals: [
      { category: 'nearby_businesses', label: 'Fluxo próximo forte', impact: 'positive' },
      { category: 'demographics', label: 'Renda média favorável', impact: 'positive' },
    ] as Json,
    risks: [
      { category: 'competition', label: 'Concorrência moderada', severity: 'medium' },
    ] as Json,
    fit_label: 'forte',
    computed_at: new Date().toISOString(),
    demographics_score: 72,
    location_score: 78,
    foot_traffic_score: 82,
    competition_score: 61,
    risk_score: 74,
    investor_fit_score: 70,
    engine_version: '1.0',
  }
}

export async function seedScoreCardFixtures(): Promise<ScoreCardFixtures> {
  const admin = createAdminClient()
  const email = `score-card-${randomUUID()}@example.com`
  const password = E2E_PASSWORD
  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (created.error || !created.data.user) {
    throw new Error(created.error?.message ?? 'Unable to create E2E user.')
  }

  const userId = created.data.user.id
  const withInsightNoScoreId = randomUUID()
  const withInsightSavedScoreId = randomUUID()
  const withoutInsightId = randomUUID()

  const listings = [
    makeListing(userId, withInsightNoScoreId, 'sem score salvo'),
    makeListing(userId, withInsightSavedScoreId, 'com score salvo'),
    makeListing(userId, withoutInsightId, 'sem enriquecimento'),
  ]

  const listingInsert = await admin.from('listings').insert(listings)
  if (listingInsert.error) throw new Error(listingInsert.error.message)

  const insightInsert = await admin.from('location_insights').insert([
    makeInsight(userId, withInsightNoScoreId),
    makeInsight(userId, withInsightSavedScoreId),
  ])
  if (insightInsert.error) throw new Error(insightInsert.error.message)

  const scoreInsert = await admin.from('opportunity_scores').insert([
    makeScore(userId, withInsightSavedScoreId),
  ])
  if (scoreInsert.error) throw new Error(scoreInsert.error.message)

  return {
    email,
    password,
    withInsightNoScore: {
      listingId: withInsightNoScoreId,
      path: `/imoveis/${withInsightNoScoreId}`,
    },
    withInsightSavedScore: {
      listingId: withInsightSavedScoreId,
      path: `/imoveis/${withInsightSavedScoreId}`,
    },
    withoutInsight: {
      listingId: withoutInsightId,
      path: `/imoveis/${withoutInsightId}`,
    },
  }
}

export async function ensureAuthenticatedScoreCardState(page: Page, fixtures: ScoreCardFixtures) {
  const cookiesToSet: SessionCookie[] = []
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return []
        },
        setAll(cookies: SessionCookie[]) {
          cookiesToSet.push(...cookies)
        },
      },
    }
  )

  const { error } = await supabase.auth.signInWithPassword({
    email: fixtures.email,
    password: fixtures.password,
  })

  if (error) throw new Error(error.message)

  await applySessionCookies(page.context(), cookiesToSet)
}

async function applySessionCookies(context: BrowserContext, cookies: SessionCookie[]) {
  await context.addCookies(
    cookies.map(({ name, value, options }) => ({
      name,
      value,
      domain: '127.0.0.1',
      path: options.path ?? '/',
      httpOnly: options.httpOnly ?? false,
      secure: options.secure ?? false,
      sameSite: toPlaywrightSameSite(options.sameSite),
      expires: typeof options.maxAge === 'number'
        ? Math.floor(Date.now() / 1000) + options.maxAge
        : -1,
    }))
  )
}

function toPlaywrightSameSite(value: CookieOptions['sameSite']): PlaywrightSameSite {
  if (value === 'strict') return 'Strict'
  if (value === 'none') return 'None'
  return 'Lax'
}

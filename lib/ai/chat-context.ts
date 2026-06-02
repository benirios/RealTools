import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'

function fmt(v: string | number | null | undefined): string {
  return v != null ? String(v) : '—'
}

function fmtList(v: string[] | null | undefined): string {
  return v?.length ? v.join(', ') : '—'
}

function truncate(v: string | null | undefined, max = 600): string {
  if (!v) return '—'
  return v.length > max ? v.slice(0, max) + '…' : v
}

type ListingCatalogRow = {
  id: string
  title: string
  price_text: string | null
  city: string | null
  neighborhood: string | null
  state: string | null
  property_type: string | null
  commercial_type: string | null
  is_commercial: boolean | null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchClientsCatalog(supabase: SupabaseClient<any>, userId: string): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase.from('investors') as any)
    .select('name, strategy, risk_level, budget_min, budget_max, property_types, preferred_neighborhoods')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(60) as { data: Array<{
      name: string
      strategy: string
      risk_level: string
      budget_min: number | null
      budget_max: number | null
      property_types: string[] | null
      preferred_neighborhoods: string[] | null
    }> | null }

  if (!data || data.length === 0) return '## Clientes cadastrados\nNenhum cliente cadastrado.'

  const lines = ['## Clientes cadastrados']
  for (const c of data) {
    const budget = [
      c.budget_min ? `R$${(c.budget_min / 1000).toFixed(0)}k` : null,
      c.budget_max ? `R$${(c.budget_max / 1000).toFixed(0)}k` : null,
    ].filter(Boolean).join('–') || '—'
    const types = c.property_types?.join(', ') || '—'
    const regions = c.preferred_neighborhoods?.slice(0, 3).join(', ') || '—'
    lines.push(`- ${c.name} | ${c.strategy} | risco: ${c.risk_level} | orçamento: ${budget} | tipos: ${types} | regiões: ${regions}`)
  }
  return lines.join('\n')
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchListingsCatalog(supabase: SupabaseClient<any>, userId: string): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase.from('listings') as any)
    .select('id, title, price_text, city, neighborhood, state, property_type, commercial_type, is_commercial')
    .eq('user_id', userId)
    .order('first_seen_at', { ascending: false })
    .limit(80) as { data: ListingCatalogRow[] | null }

  if (!data || data.length === 0) return '## Imóveis disponíveis\nNenhum imóvel cadastrado.'

  const lines = ['## Imóveis disponíveis no sistema']
  for (const l of data) {
    const loc = [l.neighborhood, l.city, l.state].filter(Boolean).join(', ') || '—'
    const type = l.property_type ?? l.commercial_type ?? '—'
    const price = l.price_text ?? '—'
    lines.push(`- ${l.title} | ${price} | ${loc} | ${type}`)
  }
  return lines.join('\n')
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function buildImovelContext(supabase: SupabaseClient<any>, userId: string, listingId: string): Promise<string> {
  const [listingRes, locationRes, summaryRes, scoresRes, catalog, clientsCatalog] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from('listings') as any)
      .select('title, price_text, address_text, city, neighborhood, state, property_type, commercial_type, description, reasoning, confidence, is_commercial')
      .eq('id', listingId)
      .eq('user_id', userId)
      .single(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from('location_insights') as any)
      .select('consumer_profile, population_density, avg_income, confidence_score, nearby_businesses')
      .eq('listing_id', listingId)
      .eq('user_id', userId)
      .maybeSingle(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from('listing_ai_summaries') as any)
      .select('summary')
      .eq('listing_id', listingId)
      .eq('user_id', userId)
      .eq('status', 'completed')
      .maybeSingle(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from('opportunity_scores') as any)
      .select('total_score, fit_label, strategy_slug, signals, risks')
      .eq('listing_id', listingId)
      .eq('user_id', userId)
      .order('computed_at', { ascending: false })
      .limit(3),
    fetchListingsCatalog(supabase, userId),
    fetchClientsCatalog(supabase, userId),
  ])

  const l = listingRes.data
  if (!l) return 'Dados do imóvel não encontrados.'

  const summary = summaryRes.data?.summary as Record<string, unknown> | null
  const location = locationRes.data
  const scores: Array<{ total_score: number; fit_label: string | null; strategy_slug: string }> = scoresRes.data ?? []

  const lines: string[] = [
    'Você é um assistente especializado em imóveis comerciais.',
    'Responda com base nos dados abaixo. Se não tiver a informação, diga isso claramente.',
    'IMPORTANTE: Resposta curta — máximo 5 linhas. Sem introdução, sem repetir a pergunta. Direto ao ponto.',
    '',
    '## Imóvel',
    `Título: ${fmt(l.title)}`,
    `Preço: ${fmt(l.price_text)}`,
    `Endereço: ${fmt(l.address_text)}`,
    `Localização: ${[l.neighborhood, l.city, l.state].filter(Boolean).join(', ') || '—'}`,
    `Tipo: ${fmt(l.property_type ?? l.commercial_type)}`,
    `Comercial: ${l.is_commercial != null ? (l.is_commercial ? 'Sim' : 'Não') : '—'} (confiança: ${fmt(l.confidence)}%)`,
  ]

  if (l.description) {
    lines.push('', '## Descrição', truncate(l.description))
  }
  if (l.reasoning) {
    lines.push('', '## Análise de classificação', truncate(l.reasoning, 400))
  }

  if (summary) {
    lines.push('', '## Resumo IA')
    if (summary.headline) lines.push(`Headline: ${summary.headline}`)
    if (Array.isArray(summary.strengths)) lines.push(`Pontos fortes: ${(summary.strengths as string[]).join('; ')}`)
    if (Array.isArray(summary.risks)) lines.push(`Riscos: ${(summary.risks as string[]).join('; ')}`)
    if (summary.investor_angle) lines.push(`Ângulo para investidor: ${summary.investor_angle}`)
    if (summary.recommended_action) lines.push(`Ação recomendada: ${summary.recommended_action}`)
  }

  if (location) {
    lines.push('', '## Inteligência de localização')
    if (location.consumer_profile) lines.push(`Perfil do consumidor: ${truncate(location.consumer_profile, 300)}`)
    if (location.population_density) lines.push(`Densidade populacional: ${location.population_density}`)
    if (location.avg_income) lines.push(`Renda média: R$ ${location.avg_income}`)
    if (location.confidence_score) lines.push(`Confiança: ${location.confidence_score}%`)
  }

  if (scores.length > 0) {
    lines.push('', '## Scores de oportunidade')
    for (const s of scores) {
      lines.push(`${s.strategy_slug}: ${s.total_score}/100 (${s.fit_label ?? '—'})`)
    }
  }

  lines.push('', catalog)
  lines.push('', clientsCatalog)

  return lines.join('\n')
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function buildClienteContext(supabase: SupabaseClient<any>, userId: string, investorId: string): Promise<string> {
  const [investorRes, opportunitiesRes, catalog, clientsCatalog] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from('investors') as any)
      .select('name, email, phone, strategy, risk_level, budget_min, budget_max, desired_yield, preferred_neighborhoods, property_types, tags, notes')
      .eq('id', investorId)
      .eq('user_id', userId)
      .single(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from('client_opportunities') as any)
      .select('status, match_score, listings(title, city, price_text)')
      .eq('client_id', investorId)
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(10),
    fetchListingsCatalog(supabase, userId),
    fetchClientsCatalog(supabase, userId),
  ])

  const inv = investorRes.data
  if (!inv) return 'Dados do cliente não encontrados.'

  const opps: Array<{ status: string; match_score: number | null; listings: { title: string; city: string | null; price_text: string | null } | null }> = opportunitiesRes.data ?? []

  const budget = [
    inv.budget_min ? `R$ ${inv.budget_min.toLocaleString('pt-BR')}` : null,
    inv.budget_max ? `R$ ${inv.budget_max.toLocaleString('pt-BR')}` : null,
  ].filter(Boolean).join(' — ') || '—'

  const lines: string[] = [
    'Você é um assistente especializado em imóveis comerciais.',
    'Responda com base nos dados abaixo. Se não tiver a informação, diga isso claramente.',
    'IMPORTANTE: Resposta curta — máximo 5 linhas. Sem introdução, sem repetir a pergunta. Direto ao ponto.',
    '',
    '## Cliente',
    `Nome: ${fmt(inv.name)}`,
    `Email: ${fmt(inv.email)}`,
    `Telefone: ${fmt(inv.phone)}`,
    `Estratégia: ${fmt(inv.strategy)}`,
    `Perfil de risco: ${fmt(inv.risk_level)}`,
    `Orçamento: ${budget}`,
    `Yield desejado: ${inv.desired_yield != null ? `${inv.desired_yield}%` : '—'}`,
    `Tipos de imóvel: ${fmtList(inv.property_types)}`,
    `Bairros preferidos: ${fmtList(inv.preferred_neighborhoods)}`,
    `Tags: ${fmtList(inv.tags)}`,
  ]

  if (inv.notes) {
    lines.push('', '## Notas sobre o cliente', truncate(inv.notes, 500))
  }

  if (opps.length > 0) {
    lines.push('', '## Negócios em andamento (últimos 10)')
    const statusMap: Record<string, string> = {
      suggested: 'Sugerida', saved: 'Salva', sent: 'Enviada',
      interested: 'Interessado', rejected: 'Rejeitada',
      negotiating: 'Negociando', closed: 'Fechada',
    }
    for (const o of opps) {
      const listing = o.listings
      const title = listing?.title ?? '—'
      const city = listing?.city ?? ''
      const price = listing?.price_text ?? ''
      const status = statusMap[o.status] ?? o.status
      const score = o.match_score != null ? ` | Score: ${o.match_score}/100` : ''
      lines.push(`- ${title}${city ? ` (${city})` : ''}${price ? ` | ${price}` : ''} | ${status}${score}`)
    }
  }

  lines.push('', catalog)
  lines.push('', clientsCatalog)

  return lines.join('\n')
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function buildNegocioContext(supabase: SupabaseClient<any>, userId: string, listingId: string, clientId: string): Promise<string> {
  const [imovelCtx, clienteCtx, opportunityRes] = await Promise.all([
    buildImovelContext(supabase, userId, listingId),
    buildClienteContext(supabase, userId, clientId),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from('client_opportunities') as any)
      .select('status, match_score, notes')
      .eq('opportunity_id', listingId)
      .eq('client_id', clientId)
      .eq('user_id', userId)
      .maybeSingle(),
  ])

  const opp = opportunityRes.data

  const statusMap: Record<string, string> = {
    suggested: 'Sugerida', saved: 'Salva', sent: 'Enviada',
    interested: 'Interessado', rejected: 'Rejeitada',
    negotiating: 'Negociando', closed: 'Fechada',
  }

  const negocioLines: string[] = [
    'Você é um assistente especializado em imóveis comerciais.',
    'Analise este negócio específico: uma oportunidade de imóvel para um cliente.',
    'IMPORTANTE: Resposta curta — máximo 5 linhas. Sem introdução, sem repetir a pergunta. Direto ao ponto.',
    '',
    '## Negócio',
    `Status: ${opp ? (statusMap[opp.status] ?? opp.status) : '—'}`,
    `Score de match: ${opp?.match_score != null ? `${opp.match_score}/100` : '—'}`,
    `Notas: ${opp?.notes ? truncate(opp.notes, 400) : '—'}`,
    '',
  ]

  // Append imovel and cliente sections, stripping their individual headers
  const imovelBody = imovelCtx.split('\n').slice(4).join('\n')
  const clienteBody = clienteCtx.split('\n').slice(4).join('\n')

  return [...negocioLines, imovelBody, '', clienteBody].join('\n')
}

import type { Database } from '@/types/supabase'

type InvestorInsert = Database['public']['Tables']['investors']['Insert']
type InvestorUpdate = Database['public']['Tables']['investors']['Update']

import type { SupabaseLike } from '@/lib/supabase/types'

export type InvestorInput = {
  name: string
  email?: string
  phone?: string
  budgetMin?: number
  budgetMax?: number
  preferredNeighborhoods?: string[]
  propertyTypes?: string[]
  strategy?: string
  riskLevel?: string
  desiredYield?: number
  tags?: string[]
  notes?: string
}

function emptyToNull(value: string | undefined) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

export function toInvestorInsert(userId: string, input: InvestorInput): InvestorInsert {
  return {
    user_id:                 userId,
    name:                    input.name,
    email:                   emptyToNull(input.email),
    phone:                   emptyToNull(input.phone),
    budget_min:              input.budgetMin ?? null,
    budget_max:              input.budgetMax ?? null,
    preferred_neighborhoods: input.preferredNeighborhoods ?? [],
    property_types:          input.propertyTypes ?? [],
    strategy:                input.strategy ?? 'any',
    risk_level:              input.riskLevel ?? 'any',
    desired_yield:           input.desiredYield ?? null,
    tags:                    input.tags ?? [],
    notes:                   emptyToNull(input.notes),
  }
}

export function toInvestorUpdate(input: InvestorInput): InvestorUpdate {
  return {
    name:                    input.name,
    email:                   emptyToNull(input.email),
    phone:                   emptyToNull(input.phone),
    budget_min:              input.budgetMin ?? null,
    budget_max:              input.budgetMax ?? null,
    preferred_neighborhoods: input.preferredNeighborhoods ?? [],
    property_types:          input.propertyTypes ?? [],
    strategy:                input.strategy ?? 'any',
    risk_level:              input.riskLevel ?? 'any',
    desired_yield:           input.desiredYield ?? null,
    tags:                    input.tags ?? [],
    notes:                   emptyToNull(input.notes),
    updated_at:              new Date().toISOString(),
  }
}

export async function createInvestor(supabase: SupabaseLike, userId: string, input: InvestorInput) {
  return supabase.from('investors').insert(toInvestorInsert(userId, input)).select('*').single()
}

export async function updateInvestor(supabase: SupabaseLike, userId: string, investorId: string, input: InvestorInput) {
  return supabase
    .from('investors')
    .update(toInvestorUpdate(input))
    .eq('id', investorId)
    .eq('user_id', userId)
    .select('*')
    .single()
}

export async function deleteInvestor(supabase: SupabaseLike, userId: string, investorId: string) {
  return supabase.from('investors').delete().eq('id', investorId).eq('user_id', userId)
}

export const DEMO_INVESTORS: InvestorInput[] = [
  {
    name: 'Investidor conservador de renda de aluguel',
    email: 'renda.conservadora@example.com',
    budgetMin: 250000,
    budgetMax: 750000,
    preferredNeighborhoods: ['Boa Viagem', 'Pina', 'Casa Forte'],
    propertyTypes: ['loja', 'sala_comercial'],
    strategy: 'rental_income',
    riskLevel: 'low',
    desiredYield: 8,
    tags: ['stable', 'high_yield', 'retail_focus'],
    notes: 'Prefere ativos comerciais alugados ou fáceis de alugar.',
  },
  {
    name: 'Investidor agressivo de revenda',
    email: 'flip.agressivo@example.com',
    budgetMin: 150000,
    budgetMax: 550000,
    preferredNeighborhoods: ['Centro', 'Santo Amaro', 'Boa Vista'],
    propertyTypes: ['loja', 'predio_comercial', 'galpao'],
    strategy: 'flip',
    riskLevel: 'high',
    desiredYield: 18,
    tags: ['flip', 'distressed', 'high_risk'],
    notes: 'Aceita risco de reforma quando o preço é atrativo.',
  },
  {
    name: 'Investidor focado em varejo',
    phone: '+55 81 99999-0000',
    budgetMin: 300000,
    budgetMax: 1200000,
    preferredNeighborhoods: ['Boa Viagem', 'Piedade', 'Derby'],
    propertyTypes: ['loja', 'ponto_comercial'],
    strategy: 'retail',
    riskLevel: 'medium',
    desiredYield: 10,
    tags: ['retail_focus', 'street_front', 'food_service'],
    notes: 'Busca pontos de varejo visíveis e com fluxo de pedestres.',
  },
]

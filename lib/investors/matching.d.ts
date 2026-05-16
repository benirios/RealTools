export type MatchConfidence = 'low' | 'medium' | 'high'

export type MatchBreakdown = {
  budget_fit: number
  location_fit: number
  property_type_fit: number
  strategy_fit: number
  risk_fit: number
  tag_fit: number
  opportunity_quality: number
}

export type InvestorDealMatch = {
  investor_id: string
  point_id: string
  match_score: number
  match_status: 'strong' | 'medium' | 'weak'
  confidence: MatchConfidence
  breakdown: MatchBreakdown
  explanation: string
  strengths: string[]
  concerns: string[]
  recommended_action: string
  reasons: string[]
  missing_data: string[]
}

export function calculateInvestorMatchScore(
  point: Record<string, unknown>,
  investor: Record<string, unknown>
): InvestorDealMatch

export function calculateInvestorDealMatch(
  investor: Record<string, unknown>,
  deal: Record<string, unknown>
): InvestorDealMatch

export function generateScoreExplanation(scoreBreakdown: MatchBreakdown): string

export function rankInvestorDeals<TDeal extends Record<string, unknown>>(
  investor: Record<string, unknown>,
  deals: TDeal[]
): Array<{ deal: TDeal } & InvestorDealMatch>

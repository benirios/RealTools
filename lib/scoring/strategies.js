const STRATEGY_SLUGS = ['cafe', 'logistics', 'pharmacy', 'retail', 'services', 'any']

const STRATEGIES = {
  cafe: {
    slug: 'cafe',
    label: 'Café / Alimentação',
    weights: {
      demographics: 0.20,
      locationQuality: 0.20,
      nearbyBusinesses: 0.30,
      competition: 0.15,
      risk: 0.10,
      investorFit: 0.05,
    },
    riskTolerance: 'medium',
    nearbyAffinities: ['school', 'office', 'mall', 'transit', 'university', 'park'],
    nearbyConflicts: ['cafe', 'restaurant', 'bakery', 'coffee', 'lanchonete'],
  },
  logistics: {
    slug: 'logistics',
    label: 'Logística / Depósito',
    weights: {
      demographics: 0.10,
      locationQuality: 0.40,
      nearbyBusinesses: 0.05,
      competition: 0.10,
      risk: 0.20,
      investorFit: 0.15,
    },
    riskTolerance: 'low',
    nearbyAffinities: ['highway', 'industrial', 'warehouse', 'port', 'railroad', 'distribution'],
    nearbyConflicts: [],
  },
  pharmacy: {
    slug: 'pharmacy',
    label: 'Farmácia / Drogaria',
    weights: {
      demographics: 0.25,
      locationQuality: 0.20,
      nearbyBusinesses: 0.15,
      competition: 0.25,
      risk: 0.10,
      investorFit: 0.05,
    },
    riskTolerance: 'low',
    nearbyAffinities: ['hospital', 'clinic', 'school', 'residential', 'health', 'ubs'],
    nearbyConflicts: ['pharmacy', 'drugstore', 'farmacia', 'drogaria'],
  },
  retail: {
    slug: 'retail',
    label: 'Varejo / Loja',
    weights: {
      demographics: 0.20,
      locationQuality: 0.20,
      nearbyBusinesses: 0.25,
      competition: 0.20,
      risk: 0.10,
      investorFit: 0.05,
    },
    riskTolerance: 'medium',
    nearbyAffinities: ['mall', 'transit', 'parking', 'office', 'bank', 'supermarket'],
    nearbyConflicts: ['retail', 'clothing', 'loja', 'store'],
  },
  services: {
    slug: 'services',
    label: 'Serviços / Escritório',
    weights: {
      demographics: 0.30,
      locationQuality: 0.25,
      nearbyBusinesses: 0.10,
      competition: 0.10,
      risk: 0.15,
      investorFit: 0.10,
    },
    riskTolerance: 'low',
    nearbyAffinities: ['office', 'residential', 'hospital', 'bank', 'courthouse'],
    nearbyConflicts: [],
  },
  any: {
    slug: 'any',
    label: 'Uso Geral',
    weights: {
      demographics: 0.167,
      locationQuality: 0.167,
      nearbyBusinesses: 0.167,
      competition: 0.167,
      risk: 0.167,
      investorFit: 0.165,
    },
    riskTolerance: 'medium',
    nearbyAffinities: [],
    nearbyConflicts: [],
  },
}

function getStrategy(slug) {
  return STRATEGIES[slug] ?? STRATEGIES['any']
}

module.exports = {
  STRATEGIES,
  STRATEGY_SLUGS,
  getStrategy,
}

function normalize(value: string | null | undefined) {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

export function parseEuroPrice(value: string | null | undefined): number | undefined {
  if (!value) return undefined

  // Grab the first price-looking token: optional €, then digits with European
  // grouping/decimal separators (e.g. "1.250.000", "1 250 000", "1.250,50").
  const match = value.match(/€?\s*([\d.\s]+(?:,\d{1,2})?)\s*€?/)
  if (!match) return undefined

  const token = match[1].trim()

  // TODO(human): turn the European-format `token` into a Number.
  // In pt-PT, "." and " " are thousands separators and "," is the decimal mark —
  // so "1.250.000" is 1250000 and "1.250,50" is 1250.50 (the opposite of en-US).
  // Examples this must handle: "1.250.000", "1 250 000", "1.250,50", "900".
  // Return the parsed number, or undefined if it isn't a finite value.
  return undefined
}

export function parseAreaSqm(value: string | null | undefined): number | undefined {
  if (!value) return undefined
  // "120 m²", "120m2", "120 metros", "1.250 m2"
  const match = normalize(value).match(/(\d[\d.\s]*(?:,\d+)?)\s*(?:m2|m²|metros)/)
  if (!match) return undefined

  const parsed = Number(match[1].replace(/[.\s]/g, '').replace(',', '.'))
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

// Portuguese residential typology (T0–T6); studios normalise to T0.
// Commercial listings usually have no typology, so this returns undefined for them.
export function inferTypology(text: string | null | undefined): string | undefined {
  const normalized = normalize(text)
  if (/\bstudio\b|\bestudio\b|\bt0\b/.test(normalized)) return 'T0'

  const match = normalized.match(/\bt\s?([0-6])\b/)
  return match ? `T${match[1]}` : undefined
}

export function inferPropertyType(text: string | null | undefined): string | undefined {
  const normalized = normalize(text)
  const rules: Array<[string, string[]]> = [
    ['loja', ['loja', 'lojas', 'retail', 'comercio', 'comércio']],
    ['escritorio', ['escritorio', 'escritório', 'gabinete', 'office', 'coworking']],
    ['armazem', ['armazem', 'armazém', 'nave', 'logistica', 'logística', 'deposito', 'depósito']],
    ['espaco_comercial', ['espaco comercial', 'espaço comercial', 'ponto comercial', 'estabelecimento', 'trespasse']],
    ['restauracao', ['restaurante', 'restauracao', 'restauração', 'cafe', 'café', 'snack-bar']],
    ['predio_comercial', ['predio comercial', 'prédio comercial', 'edificio comercial', 'edifício comercial']],
    ['terreno', ['terreno', 'lote', 'parcela']],
    ['moradia', ['moradia', 'vivenda']],
    ['apartamento', ['apartamento']],
  ]

  return rules.find(([, terms]) => terms.some((term) => normalized.includes(normalize(term))))?.[0]
}

export function inferListingTags(text: string | null | undefined): string[] {
  const normalized = normalize(text)
  const tags = new Set<string>()

  const tagRules: Array<[string, string[]]> = [
    ['retail_focus', ['loja', 'comercio', 'comércio', 'retail', 'centro comercial']],
    ['food_service', ['restaurante', 'cafe', 'café', 'snack', 'talho', 'padaria', 'cozinha']],
    ['street_front', ['frente de rua', 'res do chao', 'rés do chão', 'gaveto', 'montra']],
    ['high_yield', ['arrendado', 'renda', 'rentabilidade', 'yield', 'investimento']],
    ['stable', ['arrendado', 'contrato de arrendamento', 'inquilino']],
    ['flip', ['para remodelar', 'para recuperar', 'obras', 'devoluto', 'oportunidade']],
    ['high_risk', ['penhora', 'ruina', 'ruína', 'insolvencia', 'insolvência', 'leilao', 'leilão']],
  ]

  for (const [tag, terms] of tagRules) {
    if (terms.some((term) => normalized.includes(normalize(term)))) {
      tags.add(tag)
    }
  }

  return Array.from(tags)
}

export function enrichListingFields(input: {
  title?: string | null
  description?: string | null
  priceText?: string | null
  price_text?: string | null
  locationText?: string | null
  location_text?: string | null
  addressText?: string | null
  address_text?: string | null
}) {
  const combinedText = [
    input.title,
    input.description,
    input.locationText ?? input.location_text,
    input.addressText ?? input.address_text,
  ].filter(Boolean).join(' ')

  return {
    priceAmount: parseEuroPrice(input.priceText ?? input.price_text),
    areaSqm: parseAreaSqm(combinedText),
    typology: inferTypology(combinedText),
    propertyType: inferPropertyType(combinedText),
    tags: inferListingTags(combinedText),
  }
}

function normalize(value: string | null | undefined) {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

export function parseBrazilianPrice(value: string | null | undefined): number | undefined {
  if (!value) return undefined
  const match = value.match(/R\$\s?([\d.]+(?:,\d{1,2})?)/i)
  if (!match) return undefined

  const parsed = Number(match[1].replace(/\./g, '').replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : undefined
}

export function inferPropertyType(text: string | null | undefined): string | undefined {
  const normalized = normalize(text)
  const rules: Array<[string, string[]]> = [
    ['sala_comercial', ['sala comercial', 'sala escritorio', 'consultorio']],
    ['ponto_comercial', ['ponto comercial', 'ponto de comercio']],
    ['loja', ['loja', 'box', 'quiosque', 'retail']],
    ['galpao', ['galpao', 'galpão', 'deposito', 'armazem']],
    ['predio_comercial', ['predio comercial', 'prédio comercial', 'edificio comercial']],
    ['terreno_comercial', ['terreno', 'lote', 'area comercial', 'área comercial']],
    ['escritorio', ['escritorio', 'escritório', 'coworking']],
  ]

  return rules.find(([, terms]) => terms.some((term) => normalized.includes(normalize(term))))?.[0]
}

export function inferListingTags(text: string | null | undefined): string[] {
  const normalized = normalize(text)
  const tags = new Set<string>()

  const tagRules: Array<[string, string[]]> = [
    ['retail_focus', ['loja', 'ponto comercial', 'retail', 'shopping']],
    ['food_service', ['restaurante', 'lanchonete', 'bar ', 'cozinha', 'food']],
    ['street_front', ['frente rua', 'frente de rua', 'terreo', 'térreo']],
    ['high_yield', ['renda', 'aluguel', 'locado', 'rentabilidade']],
    ['stable', ['locado', 'contrato', 'renda garantida']],
    ['flip', ['reforma', 'reformar', 'oportunidade', 'abaixo do mercado']],
    ['high_risk', ['leilao', 'leilão', 'judicial', 'inacabado']],
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
    priceAmount: parseBrazilianPrice(input.priceText ?? input.price_text),
    propertyType: inferPropertyType(combinedText),
    tags: inferListingTags(combinedText),
  }
}

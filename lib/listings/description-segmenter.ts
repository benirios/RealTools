export type SegmentedDescription = {
  paragraphs: string[]
  details: string[]
  references: string[]
}

const BOILERPLATE_START_MARKERS = [
  'Copiar link',
  'Mapa',
]

const BOILERPLATE_END_MARKERS = [
  'Consórcio fácil',
  'Anúncios relacionados',
  'Publicidade',
  'Denunciar anúncio',
  'Publicado por',
]

const INVALID_PAGE_MARKERS = [
  'accounts_access_host_acesso',
  'Entre na sua conta e negocie com segurança',
  'Please enable cookies',
  'Cloudflare Ray ID',
]

const DETAIL_PATTERNS = [
  /\b\d+(?:[.,]\d+)?\s*m²\b/gi,
  /\b\d+\s+vagas?\b/gi,
  /\b\d+\s+banheiros?\b/gi,
  /\b\d+\s+pavimentos?\b/gi,
  /\b\d+[ºo]?\s+andar\b/gi,
  /\bporta\s+(?:esteira|de vidro|automática)\b/gi,
  /\bar\s+condicionado(?:\s+\d+\s+mil\s+btus)?\b/gi,
  /\bfreezer\b/gi,
  /\bprateleiras?\b/gi,
]

function compactText(value: string) {
  return value.replace(/\s+/g, ' ').trim()
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((value) => compactText(value)).filter(Boolean)))
}

function sentenceSplit(value: string) {
  return compactText(value)
    .split(/(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÂÊÔÃÕÇ])/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function removeFirstMatch(value: string, pattern: RegExp) {
  return value.replace(pattern, ' ').replace(/\s+/g, ' ').trim()
}

function removeOlxChrome(description: string, title: string) {
  let text = compactText(description)

  if (INVALID_PAGE_MARKERS.some((marker) => text.includes(marker))) return ''

  const normalizedTitle = compactText(title)
  if (normalizedTitle) {
    const titleMatch = text.match(new RegExp(escapeRegex(normalizedTitle), 'i'))
    if (titleMatch?.index !== undefined) {
      text = text.slice(titleMatch.index + titleMatch[0].length)
    }
  } else {
    const markerIndex = BOILERPLATE_START_MARKERS
      .map((marker) => text.lastIndexOf(marker))
      .filter((index) => index >= 0)
      .sort((a, b) => b - a)[0]

    if (markerIndex !== undefined) {
      text = text.slice(markerIndex)
    }
  }

  for (const marker of BOILERPLATE_END_MARKERS) {
    const index = text.indexOf(marker)
    if (index >= 0) text = text.slice(0, index)
  }

  if (normalizedTitle) {
    text = text.replace(new RegExp(`^${escapeRegex(normalizedTitle)}\\s*`, 'i'), '')
  }

  return compactText(text)
}

function extractReferences(value: string) {
  const references = [
    ...value.matchAll(/\bCódigo do anúncio:\s*[\w.-]+/gi),
    ...value.matchAll(/\bChave do anúncio:\s*[\w.-]+/gi),
  ].map((match) => match[0])

  let text = value
  for (const reference of references) {
    text = removeFirstMatch(text, new RegExp(escapeRegex(reference), 'i'))
  }

  return { text, references: unique(references) }
}

function stripContactSentences(value: string) {
  const contactPattern = /(whats?app|telefone|contato|ligar|falar|ver número|\(?\d{2}\)?[\s.-]*9?[\s.-]*\d{4}[\s.-]*\d{4})/i
  return sentenceSplit(value)
    .map((sentence) => {
      const match = sentence.match(contactPattern)
      if (!match || match.index === undefined) return sentence
      // Contact info is normally a closing CTA — keep whatever precedes it in
      // the same "sentence" instead of dropping the entire (possibly bullet-
      // list-shaped, punctuation-sparse) block it's attached to.
      return sentence.slice(0, match.index).trim()
    })
    .filter(Boolean)
    .join(' ')
}

function extractDetails(value: string) {
  const details = DETAIL_PATTERNS.flatMap((pattern) =>
    Array.from(value.matchAll(pattern), (match) => match[0])
  )

  return unique(details)
}

function paragraphize(value: string) {
  const sentences = sentenceSplit(value)
  if (sentences.length <= 1) return value ? [value] : []

  const paragraphs: string[] = []
  for (let index = 0; index < sentences.length; index += 2) {
    paragraphs.push(sentences.slice(index, index + 2).join(' '))
  }
  return paragraphs
}

export function segmentDescription(description: string, title: string): SegmentedDescription | null {
  const clean = removeOlxChrome(description, title)
  if (!clean) return null

  const withoutReferences = extractReferences(clean)
  const withoutContacts = stripContactSentences(withoutReferences.text)
  const details = extractDetails(withoutContacts)
  const paragraphs = paragraphize(withoutContacts)

  if (
    paragraphs.length === 0 &&
    details.length === 0 &&
    withoutReferences.references.length === 0
  ) {
    return null
  }

  return {
    paragraphs,
    details,
    references: withoutReferences.references,
  }
}

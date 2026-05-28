type ListingDescriptionProps = {
  title: string
  description: string
}

type SegmentedDescription = {
  paragraphs: string[]
  details: string[]
  contacts: string[]
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

function extractContacts(value: string) {
  const sentences = sentenceSplit(value)
  const contacts: string[] = []
  const body: string[] = []
  const contactPattern = /(whats?app|telefone|contato|ligar|falar|ver número|\(?\d{2}\)?[\s.-]*9?[\s.-]*\d{4}[\s.-]*\d{4})/i

  for (const sentence of sentences) {
    if (contactPattern.test(sentence)) contacts.push(sentence)
    else body.push(sentence)
  }

  return {
    text: body.join(' '),
    contacts: unique(contacts),
  }
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

function segmentDescription(description: string, title: string): SegmentedDescription | null {
  const clean = removeOlxChrome(description, title)
  if (!clean) return null

  const withoutReferences = extractReferences(clean)
  const withoutContacts = extractContacts(withoutReferences.text)
  const details = extractDetails(withoutContacts.text)
  const paragraphs = paragraphize(withoutContacts.text)

  if (
    paragraphs.length === 0 &&
    details.length === 0 &&
    withoutContacts.contacts.length === 0 &&
    withoutReferences.references.length === 0
  ) {
    return null
  }

  return {
    paragraphs,
    details,
    contacts: withoutContacts.contacts,
    references: withoutReferences.references,
  }
}

function SectionList({ items }: { items: string[] }) {
  return (
    <ul className="mt-2 grid gap-2 sm:grid-cols-2">
      {items.map((item) => (
        <li key={item} className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-foreground">
          {item}
        </li>
      ))}
    </ul>
  )
}

export function ListingDescription({ title, description }: ListingDescriptionProps) {
  const segmented = segmentDescription(description, title)

  if (!segmented) return null

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Descrição</p>
        <div className="space-y-3">
          {segmented.paragraphs.map((paragraph) => (
            <p key={paragraph} className="text-sm leading-relaxed text-foreground">
              {paragraph}
            </p>
          ))}
        </div>
      </div>

      {segmented.details.length > 0 && (
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Detalhes mencionados</p>
          <SectionList items={segmented.details} />
        </div>
      )}

      {segmented.contacts.length > 0 && (
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Contato mencionado</p>
          <SectionList items={segmented.contacts} />
        </div>
      )}

      {segmented.references.length > 0 && (
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Referências do anúncio</p>
          <SectionList items={segmented.references} />
        </div>
      )}
    </div>
  )
}

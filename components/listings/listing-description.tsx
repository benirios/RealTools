import { segmentDescription } from '@/lib/listings/description-segmenter'

type ListingDescriptionProps = {
  title: string
  description: string
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

      {segmented.references.length > 0 && (
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Referências do anúncio</p>
          <SectionList items={segmented.references} />
        </div>
      )}
    </div>
  )
}

import { z } from 'zod'

function normalizeText(value: unknown, maxLength: number) {
  if (typeof value !== 'string') return value

  const normalized = value.trim()
  return normalized.length > maxLength
    ? normalized.slice(0, maxLength).trim()
    : normalized
}

function textArraySchema(minItems: number, maxItems: number, maxLength: number) {
  return z.preprocess(
    (value) => {
      if (!Array.isArray(value)) return value

      return value
        .map((item) => normalizeText(item, maxLength))
        .filter((item): item is string => typeof item === 'string' && item.length > 0)
        .slice(0, maxItems)
    },
    z.array(z.string().min(1).max(maxLength)).min(minItems).max(maxItems)
  )
}

export const OrganizedDescriptionSchema = z.object({
  paragraphs: textArraySchema(1, 4, 600),
  highlights: textArraySchema(0, 8, 80),
})

export type OrganizedDescription = z.infer<typeof OrganizedDescriptionSchema>

export type DescriptionOrganizerInput = {
  title: string
  rawDescription: string
}

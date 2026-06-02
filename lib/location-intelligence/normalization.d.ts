export declare function normalizeLocationText(value: string | null | undefined): string
export declare function compactLocationText(...parts: Array<string | null | undefined | Array<string | null | undefined>>): string
export declare function buildLocationQuery(input?: {
  address?: string | null
  neighborhood?: string | null
  city?: string | null
  state?: string | null
  country?: string | null | false
  postalCode?: string | null
}): string
export declare function clampConfidence(value: unknown): number

import type { ListingImportTarget } from '@/lib/schemas/listing'

// Portuguese commercial real-estate seed targets. `state` is the distrito, `city` the concelho.
export const DEFAULT_LISTING_IMPORT_TARGETS = [
  { source: 'idealista', country: 'PT', state: 'Lisboa', city: 'Lisboa', searchTerm: 'loja', isActive: true },
  { source: 'idealista', country: 'PT', state: 'Porto', city: 'Porto', searchTerm: 'escritório', isActive: true },
  { source: 'idealista', country: 'PT', state: 'Braga', city: 'Braga', searchTerm: 'espaço comercial', isActive: true },
  { source: 'imovirtual', country: 'PT', state: 'Lisboa', city: 'Lisboa', searchTerm: 'armazém', isActive: true },
  { source: 'imovirtual', country: 'PT', state: 'Faro', city: 'Faro', searchTerm: 'loja comercial', isActive: true },
  { source: 'imovirtual', country: 'PT', state: 'Coimbra', city: 'Coimbra', searchTerm: 'escritório', isActive: true },
] as const satisfies readonly ListingImportTarget[]

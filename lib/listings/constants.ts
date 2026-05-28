import type { ListingImportTarget } from '@/lib/schemas/listing'

export const DEFAULT_LISTING_IMPORT_TARGETS = [
  { source: 'olx', country: 'BR', state: 'PE', city: 'Recife', searchTerm: 'ponto comercial', isActive: true },
  { source: 'olx', country: 'BR', state: 'SP', city: 'Sao Paulo', searchTerm: 'ponto comercial', isActive: true },
  { source: 'olx', country: 'BR', state: 'RJ', city: 'Rio de Janeiro', searchTerm: 'loja comercial', isActive: true },
  { source: 'olx', country: 'BR', state: 'MG', city: 'Belo Horizonte', searchTerm: 'sala comercial', isActive: true },
  { source: 'olx', country: 'BR', state: 'BA', city: 'Salvador', searchTerm: 'galpao', isActive: true },
  { source: 'olx', country: 'BR', state: 'DF', city: 'Brasilia', searchTerm: 'imovel comercial', isActive: true },
] as const satisfies readonly ListingImportTarget[]

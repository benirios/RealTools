import type { ListingImportTarget, ListingSource } from '@/lib/schemas/listing'

export const LISTING_SOURCES = ['olx'] as const satisfies readonly ListingSource[]

export const COMMERCIAL_TYPES = [
  'loja',
  'galpao',
  'escritorio',
  'sala_comercial',
  'predio_comercial',
  'terreno_comercial',
  'box',
  'quiosque',
  'unknown',
] as const

export const BRAZIL_STATES = [
  'AC',
  'AL',
  'AP',
  'AM',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MT',
  'MS',
  'MG',
  'PA',
  'PB',
  'PR',
  'PE',
  'PI',
  'RJ',
  'RN',
  'RS',
  'RO',
  'RR',
  'SC',
  'SP',
  'SE',
  'TO',
] as const

export const DEFAULT_LISTING_IMPORT_TARGETS = [
  { source: 'olx', country: 'BR', state: 'PE', city: 'Recife', searchTerm: 'ponto comercial', isActive: true },
  { source: 'olx', country: 'BR', state: 'SP', city: 'Sao Paulo', searchTerm: 'ponto comercial', isActive: true },
  { source: 'olx', country: 'BR', state: 'RJ', city: 'Rio de Janeiro', searchTerm: 'loja comercial', isActive: true },
  { source: 'olx', country: 'BR', state: 'MG', city: 'Belo Horizonte', searchTerm: 'sala comercial', isActive: true },
  { source: 'olx', country: 'BR', state: 'BA', city: 'Salvador', searchTerm: 'galpao', isActive: true },
  { source: 'olx', country: 'BR', state: 'DF', city: 'Brasilia', searchTerm: 'imovel comercial', isActive: true },
] as const satisfies readonly ListingImportTarget[]

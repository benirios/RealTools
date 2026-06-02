import { z } from 'zod'

// Scrapeable portal sources. Manual listings use the standalone 'manual' source
// (see app/api/imoveis/route.ts) and deliberately do not go through this enum.
export const ListingSourceSchema = z.enum(['idealista', 'imovirtual'])

export const ListingDraftSchema = z.object({
  source:         ListingSourceSchema,
  sourceUrl:      z.string().url('A URL do imóvel deve ser válida'),
  title:          z.string().min(2, 'O título do imóvel é obrigatório'),
  description:    z.string().optional(),
  priceText:      z.string().optional(),
  priceAmount:    z.coerce.number().nonnegative().optional(),
  locationText:   z.string().optional(),
  addressText:    z.string().optional(),
  country:        z.string().default('PT'),
  state:          z.string().optional(),
  city:           z.string().optional(),
  neighborhood:   z.string().optional(),
  postalCode:     z.string().optional(),
  areaSqm:        z.coerce.number().positive().optional(),
  typology:       z.string().optional(),
  tags:           z.array(z.string()).default([]),
  propertyType:   z.string().optional(),
  lat:            z.coerce.number().optional(),
  lng:            z.coerce.number().optional(),
  images:         z.array(z.string().url()).default([]),
  isCommercial:   z.boolean().optional(),
  commercialType: z.string().optional(),
  confidence:     z.number().int().min(0).max(100).optional(),
  reasoning:      z.string().optional(),
  rawPayload:     z.record(z.unknown()).default({}),
})

export const ListingImportTargetSchema = z.object({
  source:     ListingSourceSchema,
  country:    z.string().default('PT'),
  state:      z.string().min(2, 'State is required'),
  city:       z.string().min(2, 'City is required'),
  searchTerm: z.string().min(2, 'O termo de busca é obrigatório'),
  isActive:   z.boolean().default(true),
})

export type ListingSource = z.infer<typeof ListingSourceSchema>
export type ListingDraft = z.infer<typeof ListingDraftSchema>
export type ListingImportTarget = z.infer<typeof ListingImportTargetSchema>

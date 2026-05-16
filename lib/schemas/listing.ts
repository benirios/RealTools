import { z } from 'zod'

export const ListingSourceSchema = z.enum(['olx'])

export const ListingDraftSchema = z.object({
  source:         ListingSourceSchema,
  sourceUrl:      z.string().url('Listing URL must be valid'),
  title:          z.string().min(2, 'Listing title is required'),
  description:    z.string().optional(),
  priceText:      z.string().optional(),
  priceAmount:    z.coerce.number().nonnegative().optional(),
  locationText:   z.string().optional(),
  addressText:    z.string().optional(),
  country:        z.string().default('BR'),
  state:          z.string().optional(),
  city:           z.string().optional(),
  neighborhood:   z.string().optional(),
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
  country:    z.string().default('BR'),
  state:      z.string().min(2, 'State is required'),
  city:       z.string().min(2, 'City is required'),
  searchTerm: z.string().min(2, 'Search term is required'),
  isActive:   z.boolean().default(true),
})

export type ListingSource = z.infer<typeof ListingSourceSchema>
export type ListingDraft = z.infer<typeof ListingDraftSchema>
export type ListingImportTarget = z.infer<typeof ListingImportTargetSchema>

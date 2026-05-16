/* eslint-disable @typescript-eslint/no-require-imports */
const { z } = require('zod')

const NearbyBusinessSchema = z.object({
  name: z.string().min(1, 'Business name is required'),
  category: z.string().min(1, 'Business category is required'),
  distanceMeters: z.coerce.number().nonnegative().nullable().optional(),
  address: z.string().nullable().optional(),
  source: z.string().min(1, 'Business source is required'),
})

const LocationDataSourceSchema = z.object({
  segment: z.enum(['geocode', 'demographics', 'places', 'profile']).optional(),
  provider: z.string().min(1, 'Data source provider is required'),
  note: z.string().min(1, 'Data source note is required'),
  fallback: z.boolean().default(false),
  confidence: z.coerce.number().int().min(0).max(100).optional(),
})

const LocationInsightInputSchema = z.object({
  listingId: z.string().uuid().nullable().optional(),
  address: z.string().min(2).nullable().optional(),
  neighborhood: z.string().min(1).nullable().optional(),
  city: z.string().min(1).nullable().optional(),
  state: z.string().min(1).nullable().optional(),
  country: z.string().default('BR'),
  latitude: z.coerce.number().min(-90).max(90).nullable().optional(),
  longitude: z.coerce.number().min(-180).max(180).nullable().optional(),
})

const LocationInsightPersistedSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  listingId: z.string().uuid().nullable().optional(),
  address: z.string().nullable().optional(),
  neighborhood: z.string().nullable().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  country: z.string().default('BR'),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  avgIncome: z.number().nonnegative().nullable().optional(),
  populationDensity: z.number().nonnegative().nullable().optional(),
  consumerProfile: z.string().nullable().optional(),
  nearbyBusinesses: z.array(NearbyBusinessSchema).default([]),
  dataSources: z.array(LocationDataSourceSchema).default([]),
  confidenceScore: z.number().int().min(0).max(100).nullable().optional(),
  rawGeocode: z.unknown().default({}),
  rawDemographics: z.unknown().default({}),
  rawPlaces: z.unknown().default({}),
  createdAt: z.string(),
  updatedAt: z.string(),
})

const LocationInsightActionStateSchema = z.object({
  message: z.string().optional(),
  errors: z.object({
    general: z.array(z.string()).optional(),
  }).optional(),
})

module.exports = {
  LocationDataSourceSchema,
  LocationInsightActionStateSchema,
  LocationInsightInputSchema,
  LocationInsightPersistedSchema,
  NearbyBusinessSchema,
}

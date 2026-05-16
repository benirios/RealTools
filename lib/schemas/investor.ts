import { z } from 'zod'

export const InvestorStrategySchema = z.enum([
  'rental_income',
  'flip',
  'own_business',
  'land_banking',
  'retail',
  'warehouse_logistics',
  'food_beverage',
  'pharmacy',
  'gym_fitness',
  'any',
])

export const InvestorRiskLevelSchema = z.enum(['low', 'medium', 'high', 'any'])

const OptionalNumberSchema = z.preprocess((value) => {
  if (value === '' || value === null || value === undefined) return undefined
  return Number(value)
}, z.number().nonnegative().optional())

export const InvestorSchema = z.object({
  name:                   z.string().min(2, 'Investor name is required'),
  email:                  z.string().email('Valid email is required').optional().or(z.literal('')),
  phone:                  z.string().optional(),
  budgetMin:              OptionalNumberSchema,
  budgetMax:              OptionalNumberSchema,
  preferredNeighborhoods: z.array(z.string()).default([]),
  propertyTypes:          z.array(z.string()).default([]),
  strategy:               InvestorStrategySchema.default('any'),
  riskLevel:              InvestorRiskLevelSchema.default('any'),
  desiredYield:           OptionalNumberSchema,
  tags:                   z.array(z.string()).default([]),
  notes:                  z.string().optional(),
}).refine((data) => {
  if (data.budgetMin === undefined || data.budgetMax === undefined) return true
  return data.budgetMin <= data.budgetMax
}, {
  message: 'Minimum budget must be less than maximum budget',
  path: ['budgetMin'],
})

export type InvestorFormValues = z.infer<typeof InvestorSchema>
export type InvestorStrategy = z.infer<typeof InvestorStrategySchema>
export type InvestorRiskLevel = z.infer<typeof InvestorRiskLevelSchema>

export type InvestorState = {
  errors?: {
    name?: string[]
    email?: string[]
    phone?: string[]
    budgetMin?: string[]
    budgetMax?: string[]
    preferredNeighborhoods?: string[]
    propertyTypes?: string[]
    strategy?: string[]
    riskLevel?: string[]
    desiredYield?: string[]
    tags?: string[]
    notes?: string[]
    general?: string[]
  }
}

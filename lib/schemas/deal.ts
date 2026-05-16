import { z } from 'zod'

export const DealSchema = z.object({
  title:       z.string().min(2, 'Deal title is required'),
  address:     z.string().min(5, 'Address is required'),
  price:       z.string().min(1, 'Asking price is required'),
  status:      z.enum(['active', 'negotiating', 'closed']).default('active'),
  description: z.string().optional(),
})

export type DealFormValues = z.infer<typeof DealSchema>

export type DealState = {
  errors?: {
    title?:       string[]
    address?:     string[]
    price?:       string[]
    status?:      string[]
    description?: string[]
    general?:     string[]
  }
}

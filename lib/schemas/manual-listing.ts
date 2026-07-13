import { z } from 'zod'

const RequiredPriceSchema = z.preprocess((value) => {
  if (value === '' || value === null || value === undefined) return undefined
  return Number(value)
}, z.number({
  required_error: 'O preço é obrigatório',
  invalid_type_error: 'Informe um preço válido',
}).nonnegative('O preço deve ser positivo'))

export const ManualListingSchema = z.object({
  title:          z.string().min(2, 'O título do imóvel é obrigatório'),
  priceAmount:    RequiredPriceSchema,
  priceText:      z.string().optional(),
  propertyType:   z.string().optional(),
  commercialType: z.string().optional(),
  isCommercial:   z.boolean().default(true),
  addressText:    z.string().min(3, 'O endereço é obrigatório'),
  neighborhood:   z.string().optional(),
  city:           z.string().optional(),
  state:          z.string().optional(),
  description:    z.string().optional(),
  images:         z.array(z.string().url('Cada imagem deve ser uma URL válida')).default([]),
})

export type ManualListingFormValues = z.infer<typeof ManualListingSchema>

export type ManualListingState = {
  errors?: {
    title?: string[]
    priceAmount?: string[]
    addressText?: string[]
    images?: string[]
    general?: string[]
  }
}

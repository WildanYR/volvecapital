import { z } from 'zod'

export const OrderByDirectionSchema = z.enum(['asc', 'desc'])
export type OrderByDirection = z.infer<typeof OrderByDirectionSchema>

export const OrderBySchema = z.object({
  order_by: z.string().min(1).optional(),
  order_direction: OrderByDirectionSchema.optional(),
})

export type OrderByParams = z.infer<typeof OrderBySchema>

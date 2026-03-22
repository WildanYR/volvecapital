import { z } from 'zod'

export const PaginationSchema = z.object({
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
})

export type PaginationParams = z.infer<typeof PaginationSchema>

import { z } from 'zod'

export const ArticleStepSchema = z.object({
  title: z.string().min(1, 'Judul poin harus diisi'),
  description: z.string().min(1, 'Deskripsi harus diisi'),
  image_url: z.string().optional(),
})

export const ArticleFormSchema = z.object({
  title: z.string().min(1, 'Judul artikel harus diisi'),
  subtitle: z.string().optional(),
  thumbnail_url: z.string().optional(),
  category: z.string().optional().default('Umum'),
  is_published: z.boolean().optional().default(false),
  content_steps: z.array(ArticleStepSchema).optional().default([]),
})

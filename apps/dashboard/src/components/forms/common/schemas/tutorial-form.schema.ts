import { z } from 'zod';

export const TutorialStepSchema = z.object({
  label: z.string().min(1, 'Label harus diisi'),
  title: z.string().min(1, 'Judul langkah harus diisi'),
  description: z.string().min(1, 'Deskripsi harus diisi'),
  image_url: z.string().url('URL gambar tidak valid').or(z.string().length(0)),
});

export const TutorialFormSchema = z.object({
  title: z.string().min(1, 'Judul harus diisi'),
  subtitle: z.string().optional(),
  thumbnail_url: z.string().url('URL thumbnail tidak valid').or(z.string().length(0)),
  is_published: z.boolean().default(false),
  steps: z.array(TutorialStepSchema).default([]),
});

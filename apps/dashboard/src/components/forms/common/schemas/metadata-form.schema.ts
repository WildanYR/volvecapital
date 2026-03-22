import { z } from 'zod'

export const MetadataFormSchema = z.object({
  key: z.string().nonempty(),
  value: z.string().nonempty(),
})

export type MetadataFormObject = z.infer<typeof MetadataFormSchema>

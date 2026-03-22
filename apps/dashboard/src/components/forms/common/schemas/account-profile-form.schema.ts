import { z } from 'zod'
import { MetadataFormSchema } from './metadata-form.schema'

export const AccountProfileFormSchema = z.object({
  name: z.string().nonempty(),
  max_user: z.string().nonempty(),
  allow_generate: z.boolean(),
  metadata: z.array(MetadataFormSchema),
})

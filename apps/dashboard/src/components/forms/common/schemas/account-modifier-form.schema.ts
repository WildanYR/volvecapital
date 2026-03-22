import { z } from 'zod'
import { MetadataFormSchema } from './metadata-form.schema'

export const AccountModifierFormSchema = z.object({
  modifier_id: z.string().nonempty(),
  metadata: z.array(MetadataFormSchema),
})

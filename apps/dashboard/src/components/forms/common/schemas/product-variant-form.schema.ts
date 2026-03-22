import { z } from 'zod'
import { TimeUnitEnum } from './time-unit.schema'

export const ProductVariantFormSchema = z.object({
  name: z.string().nonempty(),
  duration: z.string().nonempty(),
  duration_unit: TimeUnitEnum,
  interval: z.string().nonempty(),
  interval_unit: TimeUnitEnum,
  cooldown: z.string().nonempty(),
  cooldown_unit: TimeUnitEnum,
  copy_template: z.string(),
})

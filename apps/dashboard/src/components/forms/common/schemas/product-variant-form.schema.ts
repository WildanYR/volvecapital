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
  description: z.string().optional(),
  price: z.string().nonempty('Harga wajib diisi').refine(v => !Number.isNaN(Number(v)) && Number(v) >= 0, 'Harga harus berupa angka positif'),
  voucher_expiry_hours: z.string().optional().refine(v => !v || (!Number.isNaN(Number(v)) && Number(v) >= 0), 'Harus berupa angka positif'),
})

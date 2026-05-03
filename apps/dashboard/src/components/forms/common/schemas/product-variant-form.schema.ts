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
  description: z.string().default(''),
  price: z.string().nonempty('Harga wajib diisi').refine(v => !Number.isNaN(Number(v)) && Number(v) >= 0, 'Harga harus berupa angka positif'),
  voucher_expiry_hours: z.string().default('').refine(v => !v || (!Number.isNaN(Number(v)) && Number(v) >= 0), 'Harus berupa angka positif'),
  low_stock_threshold: z.string().default('5').refine(v => !v || (!Number.isNaN(Number(v)) && Number(v) >= 0), 'Harus berupa angka positif'),
  show_email: z.boolean().default(true),
  show_password: z.boolean().default(true),
  show_profile_name: z.boolean().default(true),
  show_expired_at: z.boolean().default(true),
  show_copy_template: z.boolean().default(true),
  show_buyer_portal: z.boolean().default(true),
  custom_fields: z.array(z.object({
    label: z.string().default(''),
    value: z.string().default(''),
  })).default([]),
  tutorial_id: z.string().optional().default('__none__'),
})

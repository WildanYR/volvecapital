import type { TimeUnit } from '@/dashboard/lib/time-converter.util'
import type { Product } from '@/dashboard/services/product.service'
import { Plus, Trash2 } from 'lucide-react'
import { z } from 'zod'
import { useAppForm } from '@/dashboard/hooks/form.hook'
import { convertTimeUnit } from '@/dashboard/lib/time-converter.util'
import { Button } from '../ui/button'
import { DurationFieldGroup } from './common/fields/duration-field-group'
import { ProductVariantFormSchema } from './common/schemas/product-variant-form.schema'

export const ProductFormSchema = z.object({
  name: z.string().nonempty(),
  variants: z.array(ProductVariantFormSchema).min(1),
})

export type ProductFormSubmitData = z.infer<typeof ProductFormSchema>

function getInitialData(data?: Product): ProductFormSubmitData {
  if (!data) {
    return {
      name: '',
      variants: [
        {
          name: '',
          cooldown: '',
          cooldown_unit: 'millisecond',
          duration: '',
          duration_unit: 'millisecond',
          interval: '',
          interval_unit: 'millisecond',
          copy_template: '',
          price: '0',
          voucher_expiry_hours: '',
          show_email: true,
          show_password: true,
          show_profile_name: true,
          show_expired_at: true,
          show_copy_template: true,
          show_buyer_portal: true,
          custom_fields: [],
        },
      ],
    }
  }

  const variants = data.variants.map((v) => {
    return {
      name: v.name,
      duration: v.duration.toString(),
      duration_unit: v.duration_unit as TimeUnit,
      interval: v.interval.toString(),
      interval_unit: v.interval_unit as TimeUnit,
      cooldown: v.cooldown.toString(),
      cooldown_unit: v.cooldown_unit as TimeUnit,
      copy_template: v.copy_template || '',
      price: v.price?.toString() ?? '0',
      voucher_expiry_hours: v.voucher_expiry_hours?.toString() ?? '',
      show_email: v.redeem_display_config?.show_email ?? true,
      show_password: v.redeem_display_config?.show_password ?? true,
      show_profile_name: v.redeem_display_config?.show_profile_name ?? true,
      show_expired_at: v.redeem_display_config?.show_expired_at ?? true,
      show_copy_template: v.redeem_display_config?.show_copy_template ?? true,
      show_buyer_portal: v.redeem_display_config?.show_buyer_portal ?? true,
      custom_fields: v.redeem_display_config?.custom_fields ?? [],
    }
  })

  return {
    name: data.name,
    variants,
  }
}

export function ProductForm({
  onSubmit,
  isPending,
  initialData,
  submitButtonText,
}: {
  onSubmit: (values: ProductFormSubmitData) => void
  isPending: boolean
  initialData?: Product
  submitButtonText?: string
}) {
  const form = useAppForm({
    validators: { onSubmit: ProductFormSchema },
    defaultValues: getInitialData(initialData),
    onSubmit: ({ value }) => {
      const variants = value.variants.map((v) => {
        const duration = convertTimeUnit(
          Number.parseInt(v.duration),
          v.duration_unit,
          'millisecond',
        )
        const interval = convertTimeUnit(
          Number.parseInt(v.interval),
          v.interval_unit,
          'millisecond',
        )
        const cooldown = convertTimeUnit(
          Number.parseInt(v.cooldown),
          v.cooldown_unit,
          'millisecond',
        )
        return {
          name: v.name,
          duration: duration.toString(),
          duration_unit: 'millisecond' as TimeUnit,
          interval: interval.toString(),
          interval_unit: 'millisecond' as TimeUnit,
          cooldown: cooldown.toString(),
          cooldown_unit: 'millisecond' as TimeUnit,
          copy_template: v.copy_template,
          price: v.price,
          voucher_expiry_hours: v.voucher_expiry_hours,
          redeem_display_config: {
            show_email: v.show_email,
            show_password: v.show_password,
            show_profile_name: v.show_profile_name,
            show_expired_at: v.show_expired_at,
            show_copy_template: v.show_copy_template,
            show_buyer_portal: v.show_buyer_portal,
            custom_fields: v.custom_fields,
          },
        }
      })
      onSubmit({ name: value.name, variants })
    },
  })

  return (
    <form.AppForm>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          e.stopPropagation()
          form.handleSubmit()
        }}
      >
        <div className="flex flex-col gap-6">
          <form.AppField
            name="name"
            children={field => (
              <field.TextField
                label="Nama Produk"
                placeholder="masukkan nama produk..."
              />
            )}
          />
          <form.AppField name="variants" mode="array">
            {field => (
              <div className="flex flex-col gap-4">
                {field.state.value.map((_, i) => (
                  <div
                    key={`variant-${i}`}
                    className="relative border border-neutral-800 space-y-6 p-4 rounded-md"
                  >
                    <p className="text-center font-medium">
                      Varian
                      {i + 1}
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        field.removeValue(i)
                      }}
                      className="text-red-500 hover:text-red-700 absolute top-2 right-2"
                    >
                      <span>
                        <Trash2 />
                      </span>
                    </Button>
                    <form.AppField
                      name={`variants[${i}].name`}
                      children={subfield => (
                        <subfield.TextField
                          label="Nama"
                          placeholder="masukkan nama varian produk..."
                        />
                      )}
                    />
                    <form.AppField
                      name={`variants[${i}].price`}
                      children={subfield => (
                        <subfield.TextField
                          label="Harga (Rp)"
                          type="number"
                          placeholder="contoh: 50000"
                        />
                      )}
                    />
                    <form.AppField
                      name={`variants[${i}].voucher_expiry_hours`}
                      children={subfield => (
                        <subfield.TextField
                          label="Masa Berlaku Voucher (Jam)"
                          type="number"
                          placeholder="contoh: 24"
                        />
                      )}
                    />
                    <DurationFieldGroup
                      form={form}
                      fields={{
                        duration: `variants[${i}].duration`,
                        unit: `variants[${i}].duration_unit`,
                      }}
                      label="Durasi"
                      name={`duration-${i}`}
                      placeholder="masukkan durasi..."
                    />
                    <DurationFieldGroup
                      form={form}
                      fields={{
                        duration: `variants[${i}].interval`,
                        unit: `variants[${i}].interval_unit`,
                      }}
                      label="Interval"
                      name={`interval-${i}`}
                      placeholder="masukkan interval..."
                    />
                    <DurationFieldGroup
                      form={form}
                      fields={{
                        duration: `variants[${i}].cooldown`,
                        unit: `variants[${i}].cooldown_unit`,
                      }}
                      label="Cooldown"
                      name={`cooldown-${i}`}
                      placeholder="masukkan cooldown..."
                    />
                    <form.AppField
                      name={`variants[${i}].copy_template`}
                      children={subfield => (
                        <subfield.TextareaField
                          label="Template Salin"
                          placeholder="masukkan template salin..."
                        />
                      )}
                    />
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    field.pushValue({
                      name: '',
                      duration: '',
                      duration_unit: 'millisecond',
                      interval: '',
                      interval_unit: 'millisecond',
                      cooldown: '',
                      cooldown_unit: 'millisecond',
                      copy_template: '',
                      price: '0',
                      voucher_expiry_hours: '',
                    })}
                  className="w-full cursor-pointer"
                >
                  <span>
                    <Plus />
                  </span>
                  {' '}
                  Tambah Varian
                </Button>
              </div>
            )}
          </form.AppField>
          <form.SubscribeButton
            isPending={isPending}
            label={submitButtonText}
          />
        </div>
      </form>
    </form.AppForm>
  )
}

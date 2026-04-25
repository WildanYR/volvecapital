import type { z } from 'zod'
import type { TimeUnit } from '@/dashboard/lib/time-converter.util'
import type { ProductVariant } from '@/dashboard/services/product.service'
import { ChevronsUpDown } from 'lucide-react'
import { useAppForm } from '@/dashboard/hooks/form.hook'
import { convertTimeUnit } from '@/dashboard/lib/time-converter.util'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../ui/collapsible'
import { DurationFieldGroup } from './common/fields/duration-field-group'
import { ProductVariantFormSchema } from './common/schemas/product-variant-form.schema'

export type ProductVariantFormSubmitData = z.infer<
  typeof ProductVariantFormSchema
>

export function ProductVariantForm({
  onSubmit,
  isPending,
  initialData,
  submitButtonText,
}: {
  onSubmit: (values: ProductVariantFormSubmitData) => void
  isPending: boolean
  initialData?: ProductVariant
  submitButtonText?: string
}) {
  const form = useAppForm({
    validators: { onSubmit: ProductVariantFormSchema },
    defaultValues: {
      name: initialData?.name ?? '',
      duration: initialData?.duration.toString() ?? '',
      duration_unit: initialData?.duration_unit ?? 'millisecond',
      interval: initialData?.interval.toString() ?? '',
      interval_unit: initialData?.interval_unit ?? 'millisecond',
      cooldown: initialData?.cooldown.toString() ?? '',
      cooldown_unit: initialData?.cooldown_unit ?? 'millisecond',
      copy_template: initialData?.copy_template ?? '',
      price: initialData?.price?.toString() ?? '0',
    },
    onSubmit: ({ value }) => {
      const duration = convertTimeUnit(
        Number.parseInt(value.duration),
        value.duration_unit as TimeUnit,
        'millisecond',
      )
      const interval = convertTimeUnit(
        Number.parseInt(value.interval),
        value.interval_unit as TimeUnit,
        'millisecond',
      )
      const cooldown = convertTimeUnit(
        Number.parseInt(value.cooldown),
        value.cooldown_unit as TimeUnit,
        'millisecond',
      )
      onSubmit({
        ...value,
        duration: duration.toString(),
        duration_unit: 'millisecond' as TimeUnit,
        interval: interval.toString(),
        interval_unit: 'millisecond' as TimeUnit,
        cooldown: cooldown.toString(),
        cooldown_unit: 'millisecond' as TimeUnit,
      })
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
                label="Nama"
                placeholder="masukkan nama varian produk..."
              />
            )}
          />
          <form.AppField
            name="price"
            children={field => (
              <field.TextField
                label="Harga (Rp)"
                type="number"
                placeholder="contoh: 50000"
              />
            )}
          />
          <DurationFieldGroup
            form={form}
            fields={{
              duration: 'duration',
              unit: 'duration_unit',
            }}
            label="Durasi"
            name="duration"
            placeholder="masukkan durasi..."
          />
          <DurationFieldGroup
            form={form}
            fields={{
              duration: 'interval',
              unit: 'interval_unit',
            }}
            label="Interval"
            name="interval"
            placeholder="masukkan interval..."
          />
          <DurationFieldGroup
            form={form}
            fields={{
              duration: 'cooldown',
              unit: 'cooldown_unit',
            }}
            label="Cooldown"
            name="cooldown"
            placeholder="masukkan cooldown..."
          />
          <form.AppField
            name="copy_template"
            children={field => (
              <div className="space-y-1">
                <field.TextareaField
                  label="Template Salin"
                  placeholder="masukkan template salin..."
                />
                <Collapsible>
                  <CollapsibleTrigger className="text-primary text-sm hover:underline inline-flex items-center gap-1 cursor-pointer">
                    Tampilkan Daftar Placeholder Template
                    {' '}
                    <ChevronsUpDown className="size-4" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="text-sm space-y-2">
                    <div className="space-y-1">
                      <p className="font-bold">$$email</p>
                      <p className="text-neutral-400">email akun</p>
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold">$$password</p>
                      <p className="text-neutral-400">password akun</p>
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold">$$profile</p>
                      <p className="text-neutral-400">profile akun</p>
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold">$$product</p>
                      <p className="text-neutral-400">produk yang disewa</p>
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold">$$expired</p>
                      <p className="text-neutral-400">waktu sewa berakhir</p>
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold">$$metadata.[key]</p>
                      <p className="text-neutral-400">
                        menampilkan value dari metadata di profil sesuai key
                        nya. misal $$metadata.pin
                      </p>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            )}
          />
          <form.SubscribeButton
            isPending={isPending}
            label={submitButtonText}
          />
        </div>
      </form>
    </form.AppForm>
  )
}

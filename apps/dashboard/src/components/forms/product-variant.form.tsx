import type { z } from 'zod'
import type { TimeUnit } from '@/dashboard/lib/time-converter.util'
import type { ProductVariant } from '@/dashboard/services/product.service'
import { ChevronsUpDown, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/dashboard/components/ui/button'
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
      description: initialData?.description ?? '',
      price: initialData?.price?.toString() ?? '0',
      voucher_expiry_hours: initialData?.voucher_expiry_hours?.toString() ?? '',
      show_email: initialData?.redeem_display_config?.show_email ?? true,
      show_password: initialData?.redeem_display_config?.show_password ?? true,
      show_profile_name: initialData?.redeem_display_config?.show_profile_name ?? true,
      show_expired_at: initialData?.redeem_display_config?.show_expired_at ?? true,
      show_copy_template: initialData?.redeem_display_config?.show_copy_template ?? true,
      show_buyer_portal: initialData?.redeem_display_config?.show_buyer_portal ?? true,
      custom_fields: initialData?.redeem_display_config?.custom_fields ?? [],
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
        voucher_expiry_hours: value.voucher_expiry_hours ? Number.parseInt(value.voucher_expiry_hours) : undefined,
        redeem_display_config: {
          show_email: value.show_email,
          show_password: value.show_password,
          show_profile_name: value.show_profile_name,
          show_expired_at: value.show_expired_at,
          show_copy_template: value.show_copy_template,
          show_buyer_portal: value.show_buyer_portal,
          custom_fields: value.custom_fields,
        },
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
          <form.AppField
            name="description"
            children={field => (
              <field.TextareaField
                label="Deskripsi (Opsional)"
                placeholder="Masukkan deskripsi varian (contoh: ✓ 1 Bulan Akses Netflix)..."
              />
            )}
          />
          <form.AppField
            name="voucher_expiry_hours"
            children={field => (
              <field.TextField
                label="Masa Berlaku Voucher (Jam)"
                type="number"
                placeholder="contoh: 24 (biarkan kosong untuk default)"
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

          <div className="border-t border-neutral-800 pt-6 space-y-6">
            <h3 className="font-bold text-lg">Konfigurasi Tampilan Halaman Redeem</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <form.AppField
                name="show_email"
                children={field => (
                  <field.BooleanCheckboxField label="Tampilkan Email" />
                )}
              />
              <form.AppField
                name="show_password"
                children={field => (
                  <field.BooleanCheckboxField label="Tampilkan Password" />
                )}
              />
              <form.AppField
                name="show_profile_name"
                children={field => (
                  <field.BooleanCheckboxField label="Tampilkan Nama Profil" />
                )}
              />
              <form.AppField
                name="show_expired_at"
                children={field => (
                  <field.BooleanCheckboxField label="Tampilkan Masa Aktif" />
                )}
              />
              <form.AppField
                name="show_copy_template"
                children={field => (
                  <field.BooleanCheckboxField label="Tampilkan Instruksi Salin" />
                )}
              />
              <form.AppField
                name="show_buyer_portal"
                children={field => (
                  <field.BooleanCheckboxField label="Tampilkan Portal Email OTP" />
                )}
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-sm">Field Kustom Tambahan</h4>
              </div>
              <form.AppField name="custom_fields" mode="array">
                {field => (
                  <div className="flex flex-col gap-4">
                    {field.state.value.map((_, i) => (
                      <div key={`custom-field-${i}`} className="relative border border-neutral-800 p-4 rounded-md space-y-4">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => field.removeValue(i)}
                          className="absolute top-2 right-2 text-red-500 hover:text-red-700 h-8 w-8"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                        <form.AppField
                          name={`custom_fields[${i}].label`}
                          children={subfield => (
                            <subfield.TextField label="Label" placeholder="Contoh: PIN" />
                          )}
                        />
                        <form.AppField
                          name={`custom_fields[${i}].value`}
                          children={subfield => (
                            <subfield.TextField label="Value / Template" placeholder="Contoh: 123456 atau $$email" />
                          )}
                        />
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => field.pushValue({ label: '', value: '' })}
                      className="w-full h-9 text-xs"
                    >
                      <Plus className="size-3 mr-2" />
                      Tambah Field Kustom
                    </Button>
                  </div>
                )}
              </form.AppField>
            </div>
          </div>
          <form.SubscribeButton
            isPending={isPending}
            label={submitButtonText}
          />
        </div>
      </form>
    </form.AppForm>
  )
}

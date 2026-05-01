import type { PlatformProduct } from '@/dashboard/services/platform-product.service'
import { z } from 'zod'
import { useAppForm } from '@/dashboard/hooks/form.hook'

export const PlatformProductFormSchema = z.object({
  name: z.string().nonempty(),
  platform: z.string().nonempty(),
  platform_product_id: z.string(),
  product_variant_id: z.string(),
  variant: z.string(),
})

export type PlatformProductFormSubmitData = z.infer<
  typeof PlatformProductFormSchema
>

export function PlatformProductForm({
  onSubmit,
  isPending,
  initialData,
  submitButtonText,
}: {
  onSubmit: (values: PlatformProductFormSubmitData) => void
  isPending: boolean
  initialData?: PlatformProduct
  submitButtonText?: string
}) {
  const form = useAppForm({
    validators: { onSubmit: PlatformProductFormSchema },
    defaultValues: {
      name: initialData?.name ?? '',
      platform: initialData?.platform ?? '',
      platform_product_id: initialData?.platform_product_id ?? '',
      product_variant_id: initialData?.product_variant_id ?? '',
      variant: initialData?.variant ?? '',
    },
    onSubmit: ({ value }) => {
      onSubmit(value)
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
                placeholder="masukkan nama produk sesuai nama di platform..."
              />
            )}
          />
          <form.AppField
            name="platform_product_id"
            children={field => (
              <field.TextField
                label="ID Produk (opsional)"
                placeholder="masukkan id produk sesuai id di platform..."
              />
            )}
          />
          <form.AppField
            name="platform"
            children={field => (
              <field.SelectField
                label="Platform"
                placeholder="Pilih Platform..."
                selectItems={[{ title: 'Shopee', value: 'Shopee' }]}
              />
            )}
          />
          <form.AppField
            name="variant"
            children={field => (
              <field.TextField
                label="Varian Platform (opsional)"
                placeholder="masukkan varian produk sesuai nama di platform..."
              />
            )}
          />
          <form.AppField
            name="product_variant_id"
            children={field => (
              <field.ProductVariantSelectField
                label="Varian Produk"
                initialData={initialData?.product_variant}
              />
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

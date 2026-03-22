import type { Product } from '@/dashboard/services/product.service'
import { z } from 'zod'
import { useAppForm } from '@/dashboard/hooks/form.hook'

export const ProductEditFormSchema = z.object({
  name: z.string().nonempty(),
})

export type ProductEditFormSubmitData = z.infer<typeof ProductEditFormSchema>

export function ProductEditForm({
  onSubmit,
  isPending,
  initialData,
  submitButtonText,
}: {
  onSubmit: (values: ProductEditFormSubmitData) => void
  isPending: boolean
  initialData: Product
  submitButtonText?: string
}) {
  const form = useAppForm({
    validators: { onSubmit: ProductEditFormSchema },
    defaultValues: {
      name: initialData.name,
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
                placeholder="masukkan nama produk..."
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

import { Plus, Trash2 } from 'lucide-react'
import { z } from 'zod'
import { useAppForm } from '@/dashboard/hooks/form.hook'
import { cn } from '@/dashboard/lib/utils'
import { Button } from '../ui/button'

const TransactionItemFormSchema = z.object({
  product_variant_id: z.string().nonempty(),
})

export const TransactionFormSchema = z.object({
  customer: z.string().nonempty(),
  platform: z.string().nonempty(),
  total_price: z.string().nonempty(),
  items: z.array(TransactionItemFormSchema).min(1),
})

export type TransactionFormSubmitData = z.infer<typeof TransactionFormSchema>

export function TransactionCreateForm({
  onSubmit,
  isPending,
  submitButtonText,
}: {
  onSubmit: (values: TransactionFormSubmitData) => void
  isPending: boolean
  submitButtonText?: string
}) {
  const form = useAppForm({
    validators: { onSubmit: TransactionFormSchema },
    defaultValues: {
      customer: '',
      platform: '',
      total_price: '',
      items: [
        {
          product_variant_id: '',
        },
      ],
    } as TransactionFormSubmitData,
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
            name="customer"
            children={field => (
              <field.TextField
                label="Nama user"
                placeholder="Masukkan nama user..."
              />
            )}
          />
          <form.AppField
            name="platform"
            children={field => (
              <field.SelectField
                label="Platform"
                placeholder="Pilih Platform..."
                selectItems={[
                  { title: 'Shopee', value: 'Shopee' },
                  { title: 'Whatsapp', value: 'Whatsapp' },
                ]}
              />
            )}
          />
          <form.AppField
            name="total_price"
            children={field => (
              <field.TextWithOptions
                id="total-price"
                label="Total Harga"
                type="number"
                placeholder="Masukkan total harga transaksi..."
              />
            )}
          />
          <form.AppField name="items" mode="array">
            {field => (
              <div className="flex flex-col gap-4">
                <p className="text-2xl font-bold">Item</p>
                {field.state.value.map((_, i) => (
                  <div
                    key={`profile-${i}`}
                    className="relative border border-neutral-800 space-y-6 p-4 rounded-md"
                  >
                    <p className="text-center font-medium">
                      Item
                      {i + 1}
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        field.removeValue(i)
                      }}
                      className={cn(
                        'text-red-500 hover:text-red-700 absolute top-2 right-2',
                        i === 0 ? 'hidden' : 'block',
                      )}
                    >
                      <span>
                        <Trash2 />
                      </span>
                    </Button>
                    <form.AppField
                      name={`items[${i}].product_variant_id`}
                      children={subfield => (
                        <subfield.ProductVariantSelectField label="Varian Produk" />
                      )}
                    />
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    field.pushValue({
                      product_variant_id: '',
                    })}
                  className="w-full cursor-pointer"
                >
                  <span>
                    <Plus />
                  </span>
                  {' '}
                  Tambah Item
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

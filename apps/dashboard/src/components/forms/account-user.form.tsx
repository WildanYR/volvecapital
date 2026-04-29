import type { ProductVariant } from '@/dashboard/services/product.service'
import { useState } from 'react'
import { z } from 'zod'
import { useAppForm } from '@/dashboard/hooks/form.hook'
import { Checkbox } from '../ui/checkbox'
import { Collapsible, CollapsibleContent } from '../ui/collapsible'
import { Label } from '../ui/label'

const AccountUserTransactionFormSchema = z.object({
  platform: z.string().nonempty(),
  total_price: z.string().nonempty(),
})

export const AccountUserFormSchema = z.object({
  name: z.string().nonempty(),
  product_variant_id: z.string().nonempty(),
  account_profile_id: z.string().optional(),
  transaction: AccountUserTransactionFormSchema.optional(),
  expired_at: z.date().optional(),
})

export type AccountUserFormSubmitData = z.infer<typeof AccountUserFormSchema>

export interface AccountUserFormInitialData {
  product_variant_id: string
  product_variant: ProductVariant
  account_profile_id: string
}

export function AccountUserForm({
  onSubmit,
  isPending,
  initialData,
  submitButtonText,
  productSlug,
}: {
  onSubmit: (values: AccountUserFormSubmitData) => void
  isPending: boolean
  initialData?: AccountUserFormInitialData
  submitButtonText?: string
  productSlug?: string
}) {
  const form = useAppForm({
    validators: { onSubmit: AccountUserFormSchema },
    defaultValues: {
      name: '',
      product_variant_id: initialData?.product_variant_id || '',
      account_profile_id: initialData?.account_profile_id || undefined,
      transaction: {
        platform: '',
        total_price: '',
      },
      expired_at: undefined,
    } as AccountUserFormSubmitData,
    onSubmit: ({ value }) => {
      onSubmit({ ...value })
    },
  })

  const [withTransaction, setWithTransaction] = useState<boolean>(true)
  const [overwriteExpiredAt, setOverwriteExpiredAt] = useState<boolean>(false)

  const handleWithTransactionChange = (value: boolean) => {
    if (value) {
      form.setFieldValue('transaction', { platform: '', total_price: '' })
    }
    else {
      form.setFieldValue('transaction', undefined)
    }
    setWithTransaction(value)
  }

  const handleOverwriteExpiredAtChange = (value: boolean) => {
    if (!value && !!form.getFieldValue('expired_at')) {
      form.setFieldValue('expired_at', undefined)
    }
    setOverwriteExpiredAt(value)
  }

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
                label="Nama user"
                placeholder="Masukkan nama user..."
              />
            )}
          />
          <form.AppField
            name="product_variant_id"
            children={field => (
              <field.ProductVariantSelectField
                label="Varian Produk"
                initialData={initialData?.product_variant}
                disabled={!!initialData && !!initialData.product_variant_id}
                productSlug={productSlug}
              />
            )}
          />
          <Collapsible
            open={withTransaction}
            onOpenChange={handleWithTransactionChange}
            className="flex flex-col gap-4"
          >
            <div className="flex items-center gap-3">
              <Checkbox
                checked={withTransaction}
                onCheckedChange={(value) => {
                  handleWithTransactionChange(value as boolean)
                }}
              />
              <Label>Simpan Transaksi</Label>
            </div>
            <CollapsibleContent className="flex flex-col gap-3">
              {withTransaction && (
                <>
                  <form.AppField
                    name="transaction.platform"
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
                    name="transaction.total_price"
                    children={field => (
                      <field.TextWithOptions
                        id="total-price"
                        label="Total Harga"
                        type="number"
                        placeholder="Masukkan total harga transaksi"
                      />
                    )}
                  />
                </>
              )}
            </CollapsibleContent>
          </Collapsible>
          <Collapsible
            open={overwriteExpiredAt}
            onOpenChange={handleOverwriteExpiredAtChange}
            className="flex flex-col gap-4"
          >
            <div className="flex items-center gap-3">
              <Checkbox
                checked={overwriteExpiredAt}
                onCheckedChange={(value) => {
                  handleOverwriteExpiredAtChange(value as boolean)
                }}
              />
              <Label>Overwrite Tanggal Berakhir</Label>
            </div>
            <CollapsibleContent className="flex flex-col gap-3">
              <form.AppField
                name="expired_at"
                children={field => (
                  <field.DatePickerField
                    label="Pilih Tanggal Berakhir"
                  />
                )}
              />
            </CollapsibleContent>
          </Collapsible>
          <form.SubscribeButton
            isPending={isPending}
            label={submitButtonText}
          />
        </div>
      </form>
    </form.AppForm>
  )
}

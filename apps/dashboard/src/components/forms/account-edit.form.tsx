import type { Account } from '@/dashboard/services/account.service'
import { z } from 'zod'
import { AccountStatusSelect } from '@/dashboard/constants/account-status-select'
import { useAppForm } from '@/dashboard/hooks/form.hook'

export const AccountEditFormSchema = z.object({
  email_id: z.string().nonempty(),
  account_password: z.string().nonempty(),
  subscription_expiry: z.date().optional(),
  status: z.string(),
  billing: z.string(),
  label: z.string(),
  product_variant_id: z.string().nonempty(),
})

export type AccountEditFormSubmitData = z.infer<typeof AccountEditFormSchema>

export function AccountEditForm({
  onSubmit,
  isPending,
  initialData,
  submitButtonText,
}: {
  onSubmit: (values: AccountEditFormSubmitData) => void
  isPending: boolean
  initialData?: Account
  submitButtonText?: string
}) {
  const form = useAppForm({
    validators: { onSubmit: AccountEditFormSchema },
    defaultValues: {
      email_id: initialData?.email_id || '',
      account_password: initialData?.account_password || '',
      subscription_expiry: initialData?.subscription_expiry || undefined,
      status: initialData?.status || '',
      billing: initialData?.billing || '',
      label: initialData?.label || '',
      product_variant_id: initialData?.product_variant_id || '',
    } as AccountEditFormSubmitData,
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
            name="email_id"
            children={field => (
              <field.EmailSelectField
                label="Email"
                initialData={initialData?.email}
              />
            )}
          />
          <form.AppField
            name="account_password"
            children={field => (
              <field.TextField
                label="Password"
                placeholder="Masukkan password akun..."
              />
            )}
          />
          <form.AppField
            name="subscription_expiry"
            children={field => (
              <field.DatePickerField label="Subscription Berakhir" />
            )}
          />
          <form.AppField
            name="status"
            children={field => (
              <field.SelecField
                label="Status"
                placeholder="Pilih Status..."
                selectItems={AccountStatusSelect}
              />
            )}
          />
          <form.AppField
            name="billing"
            children={field => (
              <field.TextField
                label="Billing (opsional)"
                placeholder="Masukkan metode pembayaran untuk akun..."
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
          <form.AppField
            name="label"
            children={field => (
              <field.TextField
                label="Label/ Catatan (opsional)"
                placeholder="Masukkan catatan untuk akun..."
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

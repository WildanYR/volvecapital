import { z } from 'zod'
import { AccountStatusSelect } from '@/dashboard/constants/account-status-select'
import { useAppForm } from '@/dashboard/hooks/form.hook'
import { Checkbox } from '@/dashboard/components/ui/checkbox'
import { Label } from '@/dashboard/components/ui/label'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { LabelServiceGenerator } from '@/dashboard/services/label.service'
import { API_URL } from '@/dashboard/constants/api-url.cont'
import { useAuth } from '@/dashboard/context-providers/auth.provider'

export const AccountBulkEditFormSchema = z.object({
  account_password: z.string().optional(),
  subscription_expiry: z.date().optional(),
  status: z.string().optional(),
  billing: z.string().optional(),
  label_id: z.string().optional(),
  product_variant_id: z.string().optional(),
})

export type AccountBulkEditFormSubmitData = z.infer<typeof AccountBulkEditFormSchema>

export function AccountBulkEditForm({
  onSubmit,
  isPending,
  submitButtonText,
  productSlug,
}: {
  onSubmit: (values: Partial<AccountBulkEditFormSubmitData>) => void
  isPending: boolean
  submitButtonText?: string
  productSlug?: string
}) {
  const [enabledFields, setEnabledFields] = useState<Record<string, boolean>>({})

  const auth = useAuth()
  const labelService = LabelServiceGenerator(API_URL, auth.tenant!.accessToken, auth.tenant!.id)

  const { data: labels } = useQuery({
    queryKey: ['labels', 'all'],
    queryFn: () => labelService.findAll(''),
  })

  const labelOptions = labels?.map(l => ({ value: l.id, title: l.name })) || []

  const toggleField = (field: string) => {
    setEnabledFields(prev => ({ ...prev, [field]: !prev[field] }))
  }

  const form = useAppForm({
    validators: { onSubmit: AccountBulkEditFormSchema },
    defaultValues: {
      account_password: '',
      subscription_expiry: undefined,
      status: '',
      billing: '',
      label_id: '',
      product_variant_id: '',
    } as AccountBulkEditFormSubmitData,
    onSubmit: ({ value }) => {
      // Filter only enabled fields
      const payload: Partial<AccountBulkEditFormSubmitData> = {}
      if (enabledFields['account_password']) payload.account_password = value.account_password
      if (enabledFields['subscription_expiry']) payload.subscription_expiry = value.subscription_expiry
      if (enabledFields['status']) payload.status = value.status
      if (enabledFields['billing']) payload.billing = value.billing
      if (enabledFields['label_id']) payload.label_id = value.label_id
      if (enabledFields['product_variant_id']) payload.product_variant_id = value.product_variant_id

      onSubmit(payload)
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
          <div className="flex flex-col gap-2 border p-4 rounded-md">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="toggle-password" 
                checked={!!enabledFields['account_password']} 
                onCheckedChange={() => toggleField('account_password')} 
              />
              <Label htmlFor="toggle-password" className="font-semibold cursor-pointer">Edit Password</Label>
            </div>
            {enabledFields['account_password'] && (
              <form.AppField
                name="account_password"
                children={field => (
                  <field.TextField label="Password Baru" placeholder="Masukkan password akun baru..." />
                )}
              />
            )}
          </div>

          <div className="flex flex-col gap-2 border p-4 rounded-md">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="toggle-subscription_expiry" 
                checked={!!enabledFields['subscription_expiry']} 
                onCheckedChange={() => toggleField('subscription_expiry')} 
              />
              <Label htmlFor="toggle-subscription_expiry" className="font-semibold cursor-pointer">Edit Subscription Berakhir</Label>
            </div>
            {enabledFields['subscription_expiry'] && (
              <form.AppField
                name="subscription_expiry"
                children={field => (
                  <field.DatePickerField label="Subscription Berakhir" />
                )}
              />
            )}
          </div>

          <div className="flex flex-col gap-2 border p-4 rounded-md">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="toggle-status" 
                checked={!!enabledFields['status']} 
                onCheckedChange={() => toggleField('status')} 
              />
              <Label htmlFor="toggle-status" className="font-semibold cursor-pointer">Edit Status</Label>
            </div>
            {enabledFields['status'] && (
              <form.AppField
                name="status"
                children={field => (
                  <field.SelectField
                    label="Status"
                    placeholder="Pilih Status..."
                    selectItems={AccountStatusSelect}
                  />
                )}
              />
            )}
          </div>

          <div className="flex flex-col gap-2 border p-4 rounded-md">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="toggle-billing" 
                checked={!!enabledFields['billing']} 
                onCheckedChange={() => toggleField('billing')} 
              />
              <Label htmlFor="toggle-billing" className="font-semibold cursor-pointer">Edit Billing</Label>
            </div>
            {enabledFields['billing'] && (
              <form.AppField
                name="billing"
                children={field => (
                  <field.TextField
                    label="Billing"
                    placeholder="Masukkan metode pembayaran..."
                  />
                )}
              />
            )}
          </div>

          <div className="flex flex-col gap-2 border p-4 rounded-md">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="toggle-product_variant_id" 
                checked={!!enabledFields['product_variant_id']} 
                onCheckedChange={() => toggleField('product_variant_id')} 
              />
              <Label htmlFor="toggle-product_variant_id" className="font-semibold cursor-pointer">Edit Varian Produk</Label>
            </div>
            {enabledFields['product_variant_id'] && (
              <form.AppField
                name="product_variant_id"
                children={field => (
                  <field.ProductVariantSelectField
                    label="Varian Produk"
                    productSlug={productSlug}
                  />
                )}
              />
            )}
          </div>



          <div className="flex flex-col gap-2 border p-4 rounded-md">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="toggle-label" 
                checked={!!enabledFields['label_id']} 
                onCheckedChange={() => toggleField('label_id')} 
              />
              <Label htmlFor="toggle-label" className="font-semibold cursor-pointer">Edit Label / Catatan</Label>
            </div>
            {enabledFields['label_id'] && (
              <form.AppField
                name="label_id"
                children={field => (
                  <field.SelectField
                    label="Label / Catatan"
                    placeholder="Pilih Label Tersedia..."
                    selectItems={labelOptions}
                  />
                )}
              />
            )}
          </div>

          <form.SubscribeButton
            isPending={isPending}
            label={submitButtonText || "Simpan Perubahan Massal"}
          />
        </div>
      </form>
    </form.AppForm>
  )
}

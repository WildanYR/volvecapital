import { Plus, Trash2 } from 'lucide-react'
import { z } from 'zod'
import { AccountStatusSelect } from '@/dashboard/constants/account-status-select'
import { useAppForm } from '@/dashboard/hooks/form.hook'
import { cn } from '@/dashboard/lib/utils'
import { Button } from '../ui/button'
import { MetadataFieldGroup } from './common/fields/metadata-field-group'
import { AccountModifierFormSchema } from './common/schemas/account-modifier-form.schema'
import { AccountProfileFormSchema } from './common/schemas/account-profile-form.schema'

export const AccountFormSchema = z.object({
  email_id: z.string().nonempty(),
  account_password: z.string().nonempty(),
  subscription_expiry: z.date().optional(),
  status: z.string(),
  billing: z.string(),
  label: z.string(),
  product_variant_id: z.string().nonempty(),
  profile: z.array(AccountProfileFormSchema).min(1),
  modifier: z.array(AccountModifierFormSchema),
})

export type AccountFormSubmitData = z.infer<typeof AccountFormSchema>

export function AccountCreateForm({
  onSubmit,
  isPending,
  submitButtonText,
}: {
  onSubmit: (values: AccountFormSubmitData) => void
  isPending: boolean
  submitButtonText?: string
}) {
  const form = useAppForm({
    validators: { onSubmit: AccountFormSchema },
    defaultValues: {
      email_id: '',
      account_password: '',
      subscription_expiry: undefined,
      status: '',
      billing: '',
      label: '',
      product_variant_id: '',
      profile: [
        {
          name: '',
          max_user: '',
          allow_generate: true,
          metadata: [],
        },
      ],
      modifier: [],
    } as AccountFormSubmitData,
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
            children={field => <field.EmailSelectField label="Email" />}
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
              <field.ProductVariantSelectField label="Varian Produk" />
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
          <form.AppField name="profile" mode="array">
            {field => (
              <div className="flex flex-col gap-4">
                <p className="text-2xl font-bold">Profil</p>
                {field.state.value.map((_, i) => (
                  <div
                    key={`profile-${i}`}
                    className="relative border border-neutral-800 space-y-6 p-4 rounded-md"
                  >
                    <p className="text-center font-medium">
                      Profil
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
                      name={`profile[${i}].name`}
                      children={subfield => (
                        <subfield.TextField
                          label="Nama Profil"
                          placeholder="Masukkan nama profil..."
                        />
                      )}
                    />
                    <form.AppField
                      name={`profile[${i}].max_user`}
                      children={subfield => (
                        <subfield.TextField
                          label="Maksimal User"
                          type="number"
                          placeholder="Masukkan jumlah maksimal user untuk profil ini..."
                        />
                      )}
                    />
                    <form.AppField
                      name={`profile[${i}].allow_generate`}
                      children={subfield => (
                        <subfield.BooleanCheckboxField label="Allow Generate" />
                      )}
                    />
                    <form.AppField name={`profile[${i}].metadata`} mode="array">
                      {subfield => (
                        <div className="flex flex-col gap-4">
                          <p>Metadata</p>
                          {subfield.state.value.map((__, j) => (
                            <MetadataFieldGroup
                              key={`profile-${i}-metadata-${j}`}
                              form={form}
                              fields={{
                                key: `profile[${i}].metadata[${j}].key`,
                                value: `profile[${i}].metadata[${j}].value`,
                              }}
                              label={`Metadata ${j + 1}`}
                              onDelete={() => {
                                subfield.removeValue(j)
                              }}
                              className="border border-neutral-800 p-4 rounded-md"
                            />
                          ))}
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                              subfield.pushValue({
                                key: '',
                                value: '',
                              })}
                            className="w-full cursor-pointer"
                          >
                            <span>
                              <Plus />
                            </span>
                            {' '}
                            Tambah Metadata
                          </Button>
                        </div>
                      )}
                    </form.AppField>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    field.pushValue({
                      name: '',
                      max_user: '',
                      allow_generate: true,
                      metadata: [],
                    })}
                  className="w-full cursor-pointer"
                >
                  <span>
                    <Plus />
                  </span>
                  {' '}
                  Tambah Profil
                </Button>
              </div>
            )}
          </form.AppField>
          <div className="flex flex-col gap-4">
            <p className="text-2xl font-bold">Modifier</p>
            <form.AppField
              name="modifier"
              children={field => <field.AccountModifierField />}
            />
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

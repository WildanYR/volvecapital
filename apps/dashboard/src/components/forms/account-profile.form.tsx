import type z from 'zod'
import type { MetadataFormObject } from './common/schemas/metadata-form.schema'
import type { AccountProfile } from '@/dashboard/services/account.service'
import { Plus } from 'lucide-react'
import { useAppForm } from '@/dashboard/hooks/form.hook'
import { Button } from '../ui/button'
import { MetadataFieldGroup } from './common/fields/metadata-field-group'
import { AccountProfileFormSchema } from './common/schemas/account-profile-form.schema'

export type AccountProfileFormSubmitData = z.infer<
  typeof AccountProfileFormSchema
>

export function AccountProfileForm({
  onSubmit,
  isPending,
  initialData,
  submitButtonText,
}: {
  onSubmit: (values: AccountProfileFormSubmitData) => void
  isPending: boolean
  initialData?: AccountProfile
  submitButtonText?: string
}) {
  const form = useAppForm({
    validators: { onSubmit: AccountProfileFormSchema },
    defaultValues: {
      name: initialData?.name ?? '',
      max_user: initialData?.max_user.toString() ?? '',
      allow_generate:
        typeof initialData?.allow_generate === 'boolean'
          ? initialData.allow_generate
          : true,
      metadata: initialData?.metadata
        ? initialData.metadata
        : ([] as Array<MetadataFormObject>),
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
                label="Nama Profil"
                placeholder="Masukkan nama profil..."
              />
            )}
          />
          <form.AppField
            name="max_user"
            children={field => (
              <field.TextField
                label="Maksimal User"
                type="number"
                placeholder="Masukkan jumlah maksimal user diprofil ini..."
              />
            )}
          />
          <form.AppField
            name="allow_generate"
            children={field => (
              <field.BooleanCheckboxField label="Allow Generate" />
            )}
          />
          <form.AppField name="metadata" mode="array">
            {field => (
              <div className="flex flex-col gap-4">
                <p>Metadata</p>
                {field.state.value.map((__, i) => (
                  <MetadataFieldGroup
                    key={`metadata-${i}`}
                    form={form}
                    fields={{
                      key: `metadata[${i}].key`,
                      value: `metadata[${i}].value`,
                    }}
                    label={`Metadata ${i + 1}`}
                    onDelete={() => {
                      field.removeValue(i)
                    }}
                    className="border border-neutral-800 p-4 rounded-md"
                  />
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    field.pushValue({
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
          <form.SubscribeButton
            isPending={isPending}
            label={submitButtonText}
          />
        </div>
      </form>
    </form.AppForm>
  )
}

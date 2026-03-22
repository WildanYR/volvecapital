import type { AccountProfileUser } from '@/dashboard/services/account.service'
import { z } from 'zod'
import { useAppForm } from '@/dashboard/hooks/form.hook'

export const AccountUserUpdateFormSchema = z.object({
  name: z.string().nonempty(),
  expired_at: z.date().optional(),
})

export type AccountUserUpdateFormSubmitData = z.infer<typeof AccountUserUpdateFormSchema>

export function AccountUserUpdateForm({
  onSubmit,
  isPending,
  initialData,
  submitButtonText,
}: {
  onSubmit: (values: AccountUserUpdateFormSubmitData) => void
  isPending: boolean
  initialData: AccountProfileUser
  submitButtonText?: string
}) {
  const form = useAppForm({
    validators: { onSubmit: AccountUserUpdateFormSchema },
    defaultValues: {
      name: initialData.name,
      expired_at: initialData.expired_at || undefined,
    } as AccountUserUpdateFormSubmitData,
    onSubmit: ({ value }) => {
      onSubmit({ ...value })
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
                label="Nama user"
                placeholder="Masukkan nama user..."
              />
            )}
          />
          <form.AppField
            name="expired_at"
            children={field => (
              <field.DatePickerField
                label="Pilih Tanggal Berakhir"
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

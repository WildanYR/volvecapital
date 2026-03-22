import type { Email } from '@/dashboard/services/email.service'
import { z } from 'zod'
import { useAppForm } from '@/dashboard/hooks/form.hook'

export const EmailFormSchema = z.object({
  email: z.string().email().nonempty(),
  password: z.string(),
})

export type EmailFormSubmitData = z.infer<typeof EmailFormSchema>

export function EmailForm({
  onSubmit,
  isPending,
  initialData,
  submitButtonText,
}: {
  onSubmit: (values: EmailFormSubmitData) => void
  isPending: boolean
  initialData?: Email
  submitButtonText?: string
}) {
  const form = useAppForm({
    validators: { onSubmit: EmailFormSchema },
    defaultValues: {
      email: initialData?.email ?? '',
      password: initialData?.password ?? '',
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
            name="email"
            children={field => (
              <field.TextField
                label="Email"
                placeholder="volvecapital@email.com"
              />
            )}
          />
          <form.AppField
            name="password"
            children={field => (
              <field.TextField
                label="Password (Opsional)"
                placeholder="********"
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

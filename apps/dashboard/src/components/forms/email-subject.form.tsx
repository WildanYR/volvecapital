import type { EmailSubject } from '@/dashboard/services/email-subject.service'
import { z } from 'zod'
import { useAppForm } from '@/dashboard/hooks/form.hook'

export const EmailSubjectFormSchema = z.object({
  subject: z.string().nonempty('Subject wajib diisi'),
  context: z.string().nonempty('Context wajib diisi'),
  extract_method: z.string().nonempty('Extract method wajib diisi'),
})

export type EmailSubjectFormSubmitData = z.infer<typeof EmailSubjectFormSchema>

export function EmailSubjectForm({
  onSubmit,
  isPending,
  initialData,
  submitButtonText,
}: {
  onSubmit: (values: EmailSubjectFormSubmitData) => void
  isPending: boolean
  initialData?: EmailSubject
  submitButtonText?: string
}) {
  const form = useAppForm({
    validators: { onSubmit: EmailSubjectFormSchema },
    defaultValues: {
      subject: initialData?.subject ?? '',
      context: initialData?.context ?? '',
      extract_method: initialData?.extract_method ?? '',
    },
    onSubmit: ({ value }) => {
      onSubmit(value)
    },
  })

  const contextOptions = [
    { title: 'NETFLIX_SIGNIN_OTP', value: 'NETFLIX_SIGNIN_OTP' },
    { title: 'NETFLIX_REQ_RESET_PASSWORD', value: 'NETFLIX_REQ_RESET_PASSWORD' },
    { title: 'NETFLIX_TRAVEL_OTP', value: 'NETFLIX_TRAVEL_OTP' },
    { title: 'NETFLIX_HOUSE_CHANGE', value: 'NETFLIX_HOUSE_CHANGE' },
    { title: 'NETFLIX_VERIFY_EMAIL', value: 'NETFLIX_VERIFY_EMAIL' },
    { title: 'NETFLIX_CANCELLATION', value: 'NETFLIX_CANCELLATION' },
    { title: 'NETFLIX_MFA', value: 'NETFLIX_MFA' },
  ]

  const extractMethodOptions = [
    { title: 'OTP_EXTRACT', value: 'OTP_EXTRACT' },
    { title: 'NETFLIX_URL_EXTRACT', value: 'NETFLIX_URL_EXTRACT' },
  ]

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
            name="subject"
            children={field => (
              <field.TextField
                label="Subject"
                placeholder="Masukkan email subject"
              />
            )}
          />
          <form.AppField
            name="context"
            children={field => (
              <field.SelecField
                label="Context"
                placeholder="Pilih Context"
                selectItems={contextOptions}
              />
            )}
          />
          <form.AppField
            name="extract_method"
            children={field => (
              <field.SelecField
                label="Extract Method"
                placeholder="Pilih Extract Method"
                selectItems={extractMethodOptions}
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

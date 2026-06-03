import type { EmailSubjectFormSubmitData } from '@/dashboard/components/forms/email-subject.form'
import type { CreateEmailSubjectPayload } from '@/dashboard/services/email-subject.service'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { toast } from 'sonner'
import { EmailSubjectForm } from '@/dashboard/components/forms/email-subject.form'
import { API_URL } from '@/dashboard/constants/api-url.cont'
import { useAuth } from '@/dashboard/context-providers/auth.provider'
import { EmailSubjectServiceGenerator } from '@/dashboard/services/email-subject.service'

export const Route = createFileRoute('/dashboard/email-subject/create')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = Route.useNavigate()
  const queryClient = useQueryClient()
  const auth = useAuth()
  const emailSubjectService = EmailSubjectServiceGenerator(
    API_URL,
    auth.tenant!.accessToken,
    auth.tenant!.id,
  )

  const mutation = useMutation({
    mutationFn: (payload: CreateEmailSubjectPayload) =>
      emailSubjectService.createEmailSubject(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-subject'] })
      navigate({ to: '/dashboard/email-subject' })
      toast.success('Email Subject baru berhasil dibuat.')
    },
    onError: (error) => {
      toast.error(`Terjadi kesalahan: ${error.message}`)
    },
  })

  const handleSubmit = (values: EmailSubjectFormSubmitData) => {
    mutation.mutate(values)
  }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight text-balance">
        Buat Email Subject
      </h1>
      <div className="max-w-2xl">
        <EmailSubjectForm
          onSubmit={handleSubmit}
          isPending={mutation.isPending}
          submitButtonText="Buat Email Subject"
        />
      </div>
    </div>
  )
}

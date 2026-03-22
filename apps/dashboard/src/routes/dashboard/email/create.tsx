import type { EmailFormSubmitData } from '@/dashboard/components/forms/email.form'
import type { CreateEmailPayload } from '@/dashboard/services/email.service'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { toast } from 'sonner'
import { EmailForm } from '@/dashboard/components/forms/email.form'
import { API_URL } from '@/dashboard/constants/api-url.cont'
import { useAuth } from '@/dashboard/context-providers/auth.provider'
import { EmailServiceGenerator } from '@/dashboard/services/email.service'

export const Route = createFileRoute('/dashboard/email/create')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = Route.useNavigate()
  const queryClient = useQueryClient()
  const auth = useAuth()
  const emailService = EmailServiceGenerator(
    API_URL,
    auth.tenant!.accessToken,
    auth.tenant!.id,
  )

  const mutation = useMutation({
    mutationFn: (payload: CreateEmailPayload) =>
      emailService.createNewEmail(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email'] })
      navigate({ to: '/dashboard/email' })
      toast.success('Email baru berhasil dibuat.')
    },
    onError: (error) => {
      toast.error(`Terjadi kesalahan: ${error.message}`)
    },
  })

  const handleSubmit = (values: EmailFormSubmitData) => {
    mutation.mutate(values)
  }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight text-balance">
        Buat Email
      </h1>
      <div className="max-w-2xl">
        <EmailForm
          onSubmit={handleSubmit}
          isPending={mutation.isPending}
          submitButtonText="Buat Email"
        />
      </div>
    </div>
  )
}

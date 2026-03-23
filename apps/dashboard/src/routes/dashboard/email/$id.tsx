import type { EmailFormSubmitData } from '@/dashboard/components/forms/email.form'
import type { UpdateEmailPayload } from '@/dashboard/services/email.service'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { toast } from 'sonner'
import { EmailForm } from '@/dashboard/components/forms/email.form'
import { Skeleton } from '@/dashboard/components/ui/skeleton'
import { API_URL } from '@/dashboard/constants/api-url.cont'
import { useAuth } from '@/dashboard/context-providers/auth.provider'
import { EmailServiceGenerator } from '@/dashboard/services/email.service'

export const Route = createFileRoute('/dashboard/email/$id')({
  component: RouteComponent,
})

function RouteComponent() {
  const { id } = Route.useParams()
  const queryClient = useQueryClient()

  const auth = useAuth()
  const emailService = EmailServiceGenerator(
    API_URL,
    auth.tenant!.accessToken,
    auth.tenant!.id,
  )

  const { data: email, isLoading: isFetchEmailLoading } = useQuery({
    queryKey: ['email', id],
    queryFn: ({ signal }) => emailService.getEmailById(id, signal),
  })

  const mutation = useMutation({
    mutationFn: (payload: UpdateEmailPayload) =>
      emailService.updateEmail(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email'] })
      toast.success('Email berhasil diperbaruhi.')
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
      {isFetchEmailLoading
        ? (
            <>
              <Skeleton className="h-4 w-6 rounded-full" />
              <Skeleton className="h-12 rounded-md" />
            </>
          )
        : (
            <div className="max-w-2xl">
              <EmailForm
                onSubmit={handleSubmit}
                isPending={mutation.isPending}
                initialData={email}
                submitButtonText="Ubah Email"
              />
            </div>
          )}
    </div>
  )
}

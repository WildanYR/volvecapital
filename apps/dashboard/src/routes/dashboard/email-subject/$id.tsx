import type { EmailSubjectFormSubmitData } from '@/dashboard/components/forms/email-subject.form'
import type { UpdateEmailSubjectPayload } from '@/dashboard/services/email-subject.service'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { toast } from 'sonner'
import { EmailSubjectForm } from '@/dashboard/components/forms/email-subject.form'
import { Skeleton } from '@/dashboard/components/ui/skeleton'
import { API_URL } from '@/dashboard/constants/api-url.cont'
import { useAuth } from '@/dashboard/context-providers/auth.provider'
import { EmailSubjectServiceGenerator } from '@/dashboard/services/email-subject.service'

export const Route = createFileRoute('/dashboard/email-subject/$id')({
  component: RouteComponent,
})

function RouteComponent() {
  const { id } = Route.useParams()
  const queryClient = useQueryClient()

  const auth = useAuth()
  const emailSubjectService = EmailSubjectServiceGenerator(
    API_URL,
    auth.tenant!.accessToken,
    auth.tenant!.id,
  )

  const { data: emailSubject, isLoading: isFetchEmailSubjectLoading } = useQuery({
    queryKey: ['email-subject', id],
    queryFn: ({ signal }) => emailSubjectService.getEmailSubjectById(id, signal),
  })

  const mutation = useMutation({
    mutationFn: (payload: UpdateEmailSubjectPayload) =>
      emailSubjectService.updateEmailSubject(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-subject'] })
      toast.success('Email Subject berhasil diperbarui.')
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
        Ubah Email Subject
      </h1>
      {isFetchEmailSubjectLoading
        ? (
            <>
              <Skeleton className="h-4 w-6 rounded-full" />
              <Skeleton className="h-12 rounded-md" />
            </>
          )
        : (
            <div className="max-w-2xl">
              <EmailSubjectForm
                onSubmit={handleSubmit}
                isPending={mutation.isPending}
                initialData={emailSubject}
                submitButtonText="Ubah Email Subject"
              />
            </div>
          )}
    </div>
  )
}

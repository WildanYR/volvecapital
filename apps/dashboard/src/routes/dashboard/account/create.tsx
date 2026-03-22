import type { AccountFormSubmitData } from '@/dashboard/components/forms/account-create.form'
import type { CreateAccountPayload } from '@/dashboard/services/account.service'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { toast } from 'sonner'
import { AccountCreateForm } from '@/dashboard/components/forms/account-create.form'
import { API_URL } from '@/dashboard/constants/api-url.cont'
import { useAuth } from '@/dashboard/context-providers/auth.provider'
import { convertMetadataObjectToString } from '@/dashboard/lib/metadata-converter'
import { AccountServiceGenerator } from '@/dashboard/services/account.service'

export const Route = createFileRoute('/dashboard/account/create')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = Route.useNavigate()
  const queryClient = useQueryClient()
  const auth = useAuth()
  const accountService = AccountServiceGenerator(
    API_URL,
    auth.tenant!.accessToken,
    auth.tenant!.id,
  )

  const mutation = useMutation({
    mutationFn: (payload: CreateAccountPayload) =>
      accountService.createNewAccount(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account'] })
      navigate({ to: '/dashboard/account' })
      toast.success('Produk baru berhasil dibuat.')
    },
    onError: (error) => {
      toast.error(`Terjadi kesalahan: ${error.message}`)
    },
  })
  const handleSubmit = (values: AccountFormSubmitData) => {
    const payload: CreateAccountPayload = {
      ...values,
      email_id: values.email_id,
      product_variant_id: values.product_variant_id,
      subscription_expiry: values.subscription_expiry || new Date(),
      profile: values.profile.map(p => ({
        ...p,
        max_user: Number.parseInt(p.max_user),
        metadata: p.metadata.length
          ? convertMetadataObjectToString(p.metadata)
          : undefined,
      })),
      modifier: values.modifier.length
        ? values.modifier.map(m => ({
            modifier_id: m.modifier_id,
            metadata: convertMetadataObjectToString(m.metadata),
          }))
        : undefined,
    }
    mutation.mutate(payload)
  }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight text-balance">
        Buat Akun
      </h1>
      <div className="max-w-2xl">
        <AccountCreateForm
          onSubmit={handleSubmit}
          isPending={mutation.isPending}
          submitButtonText="Buat Akun"
        />
      </div>
    </div>
  )
}

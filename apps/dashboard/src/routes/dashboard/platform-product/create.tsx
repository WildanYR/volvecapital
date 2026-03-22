import type { PlatformProductFormSubmitData } from '@/dashboard/components/forms/platform-product.form'
import type { CreatePlatformProductPayload } from '@/dashboard/services/platform-product.service'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { toast } from 'sonner'
import { PlatformProductForm } from '@/dashboard/components/forms/platform-product.form'
import { API_URL } from '@/dashboard/constants/api-url.cont'
import { useAuth } from '@/dashboard/context-providers/auth.provider'
import { PlatformProductServiceGenerator } from '@/dashboard/services/platform-product.service'

export const Route = createFileRoute('/dashboard/platform-product/create')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = Route.useNavigate()
  const queryClient = useQueryClient()
  const auth = useAuth()
  const platformProductService = PlatformProductServiceGenerator(
    API_URL,
    auth.tenant!.accessToken,
    auth.tenant!.id,
  )

  const mutation = useMutation({
    mutationFn: (payload: CreatePlatformProductPayload) =>
      platformProductService.createPlatformProduct(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-product'] })
      navigate({ to: '/dashboard/platform-product' })
      toast.success('Produk platform baru berhasil dibuat.')
    },
    onError: (error) => {
      toast.error(`Terjadi kesalahan: ${error.message}`)
    },
  })

  const handleSubmit = (values: PlatformProductFormSubmitData) => {
    mutation.mutate({
      ...values,
      product_variant_id: values.product_variant_id,
    })
  }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight text-balance">
        Buat Produk Platform
      </h1>
      <div className="max-w-2xl">
        <PlatformProductForm
          onSubmit={handleSubmit}
          isPending={mutation.isPending}
          submitButtonText="Buat Produk Platform"
        />
      </div>
    </div>
  )
}

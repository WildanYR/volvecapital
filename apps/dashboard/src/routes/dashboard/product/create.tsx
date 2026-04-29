import type { CreateProductPayload } from '@/dashboard/services/product.service'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { toast } from 'sonner'
import { ProductForm } from '@/dashboard/components/forms/product.form'
import { API_URL } from '@/dashboard/constants/api-url.cont'
import { useAuth } from '@/dashboard/context-providers/auth.provider'
import { ProductServiceGenerator } from '@/dashboard/services/product.service'

export const Route = createFileRoute('/dashboard/product/create')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = Route.useNavigate()
  const queryClient = useQueryClient()
  const auth = useAuth()
  const productService = ProductServiceGenerator(
    API_URL,
    auth.tenant!.accessToken,
    auth.tenant!.id,
  )

  const mutation = useMutation({
    mutationFn: (payload: CreateProductPayload) =>
      productService.createNewProduct(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product'] })
      navigate({ to: '/dashboard/product' })
      toast.success('Produk baru berhasil dibuat.')
    },
    onError: (error) => {
      toast.error(`Terjadi kesalahan: ${error.message}`)
    },
  })

  const handleSubmit = (payload: any) => {
    mutation.mutate(payload)
  }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight text-balance">
        Buat Produk
      </h1>
      <div className="max-w-2xl">
        <ProductForm
          onSubmit={handleSubmit}
          isPending={mutation.isPending}
          submitButtonText="Buat Produk"
        />
      </div>
    </div>
  )
}

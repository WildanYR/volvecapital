import type { PlatformProductFormSubmitData } from '@/dashboard/components/forms/platform-product.form'
import type { UpdatePlatformProductPayload } from '@/dashboard/services/platform-product.service'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { toast } from 'sonner'
import { PlatformProductForm } from '@/dashboard/components/forms/platform-product.form'
import { Skeleton } from '@/dashboard/components/ui/skeleton'
import { API_URL } from '@/dashboard/constants/api-url.cont'
import { useAuth } from '@/dashboard/context-providers/auth.provider'
import { PlatformProductServiceGenerator } from '@/dashboard/services/platform-product.service'
import { ShopServiceGenerator } from '@/dashboard/services/shop.service'

export const Route = createFileRoute('/dashboard/platform-product/$id')({
  component: RouteComponent,
})

function RouteComponent() {
  const { id } = Route.useParams()
  const queryClient = useQueryClient()

  const auth = useAuth()
  const platformProductService = PlatformProductServiceGenerator(
    API_URL,
    auth.tenant!.accessToken,
    auth.tenant!.id,
  )
  const shopService = ShopServiceGenerator(
    API_URL,
    auth.tenant!.accessToken,
    auth.tenant!.id,
  )

  const { data: shops } = useQuery({
    queryKey: ['shops'],
    queryFn: ({ signal }) => shopService.getAllShop({ signal, limit: 100 }),
  })

  const { data: platformProduct, isLoading: isFetchPlatformProductLoading }
    = useQuery({
      queryKey: ['platform-product', id],
      queryFn: ({ signal }) => platformProductService.getPlatformProductById(id, signal),
    })

  const mutation = useMutation({
    mutationFn: (payload: UpdatePlatformProductPayload) =>
      platformProductService.updatePlatformProduct(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-product'] })
      toast.success('produk platform berhasil diperbaruhi.')
    },
    onError: (error) => {
      toast.error(`Terjadi kesalahan: ${error.message}`)
    },
  })

  const handleSubmit = (values: PlatformProductFormSubmitData) => {
    mutation.mutate({
      ...values,
      shop_id: values.shop_id || undefined,
      product_variant_id: values.product_variant_id,
    })
  }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight text-balance">
        Buat Produk Platform
      </h1>
      {isFetchPlatformProductLoading
        ? (
            <>
              <Skeleton className="h-4 w-6 rounded-full" />
              <Skeleton className="h-12 rounded-md" />
            </>
          )
        : (
            <div className="max-w-2xl">
              <PlatformProductForm
                onSubmit={handleSubmit}
                isPending={mutation.isPending}
                initialData={platformProduct}
                submitButtonText="Ubah Produk Platform"
                shops={shops?.map((s) => ({ title: s.name, value: s.id })) ?? []}
              />
            </div>
          )}
    </div>
  )
}

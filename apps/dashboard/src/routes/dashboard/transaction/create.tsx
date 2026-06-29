import type { TransactionFormSubmitData } from '@/dashboard/components/forms/transaction-create.form'
import type { CreateTransactionPayload } from '@/dashboard/services/transaction.service'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { toast } from 'sonner'
import { TransactionCreateForm } from '@/dashboard/components/forms/transaction-create.form'
import { API_URL } from '@/dashboard/constants/api-url.cont'
import { useAuth } from '@/dashboard/context-providers/auth.provider'
import { TransactionServiceGenerator } from '@/dashboard/services/transaction.service'
import { ShopServiceGenerator } from '@/dashboard/services/shop.service'

export const Route = createFileRoute('/dashboard/transaction/create')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = Route.useNavigate()
  const queryClient = useQueryClient()
  const auth = useAuth()
  const transactionService = TransactionServiceGenerator(
    API_URL,
    auth.tenant!.accessToken,
    auth.tenant!.id,
  )
  const shopService = ShopServiceGenerator(
    API_URL,
    auth.tenant!.accessToken,
    auth.tenant!.id,
  )

  const { data: shopsData } = useQuery({
    queryKey: ['shops', auth.tenant!.id],
    queryFn: () => shopService.getAllShop(),
  })
  
  const mappedShops = shopsData?.map(s => ({ title: s.name, value: s.name })) || []

  const mutation = useMutation({
    mutationFn: (payload: CreateTransactionPayload) =>
      transactionService.createNewTransaction(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transaction'] })
      navigate({ to: '/dashboard/transaction' })
      toast.success('Transaksi baru berhasil dibuat.')
    },
    onError: (error) => {
      toast.error(`Terjadi kesalahan: ${error.message}`)
    },
  })

  const handleSubmit = (values: TransactionFormSubmitData) => {
    const payload: CreateTransactionPayload = {
      ...values,
      total_price: Number.parseInt(values.total_price),
      items: values.items.map(item => ({
        product_variant_id: item.product_variant_id,
      })),
    }
    mutation.mutate(payload)
  }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight text-balance">
        Buat Transaksi
      </h1>
      <div className="max-w-2xl">
        <TransactionCreateForm
          onSubmit={handleSubmit}
          isPending={mutation.isPending}
          submitButtonText="Buat Transaksi"
          shops={mappedShops}
        />
      </div>
    </div>
  )
}

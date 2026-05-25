import type { Account } from '@/dashboard/services/account.service'
import type { Expense } from '@/dashboard/services/expense.service'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Trash2 } from 'lucide-react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'
import { Pagination } from '@/dashboard/components/pagination'
import { Button } from '@/dashboard/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/dashboard/components/ui/dialog'
import { ScrollArea } from '@/dashboard/components/ui/scroll-area'
import { Separator } from '@/dashboard/components/ui/separator'
import { Skeleton } from '@/dashboard/components/ui/skeleton'
import { API_URL } from '@/dashboard/constants/api-url.cont'
import { useAuth } from '@/dashboard/context-providers/auth.provider'
import { useAppForm } from '@/dashboard/hooks/form.hook'
import { formatRupiah } from '@/dashboard/lib/currency.util'
import { formatDateIdStandard } from '@/dashboard/lib/time-converter.util'
import { ExpenseServiceGenerator } from '@/dashboard/services/expense.service'

const CreateExpenseSchema = z.object({
  amount: z.string().nonempty('Jumlah harus diisi'),
  note: z.string(),
})

type CreateExpenseData = z.infer<typeof CreateExpenseSchema>

export function PagesAccountIndexDialogExpense({
  open,
  selectedAccount,
  onOpenChange,
}: {
  open?: boolean
  selectedAccount?: Account
  onOpenChange: (value: boolean) => void
}) {
  const auth = useAuth()
  const expenseService = ExpenseServiceGenerator(
    API_URL,
    auth.tenant!.accessToken,
    auth.tenant!.id,
  )
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const formRef = useRef<any>(null)

  const { data: expenses, isLoading: isFetchingExpenses } = useQuery({
    queryKey: ['expense', selectedAccount?.id, page],
    queryFn: () => {
      const params: any = {
        subject_id: selectedAccount!.id,
        type: 'account',
        page,
        limit: 5,
      }
      return expenseService.getAllExpense(params)
    },
    enabled: !!open && !!selectedAccount,
  })

  const createExpenseMutation = useMutation({
    mutationFn: (data: CreateExpenseData) =>
      expenseService.createExpense({
        subject_id: selectedAccount!.id,
        type: 'account',
        amount: Number.parseInt(data.amount),
        note: data.note,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense', selectedAccount?.id] })
      toast.success('Pengeluaran berhasil ditambahkan')
      formRef.current?.reset()
    },
    onError: (error: any) => {
      toast.error(`Gagal menambahkan pengeluaran: ${error.message}`)
    },
  })

  const deleteExpenseMutation = useMutation({
    mutationFn: (id: string) => expenseService.deleteExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense', selectedAccount?.id] })
      toast.success('Pengeluaran berhasil dihapus')
    },
    onError: (error: any) => {
      toast.error(`Gagal menghapus pengeluaran: ${error.message}`)
    },
  })

  const form = useAppForm({
    validators: { onSubmit: CreateExpenseSchema },
    defaultValues: {
      amount: '',
      note: '',
    },
    onSubmit: ({ value }) => {
      createExpenseMutation.mutate(value)
    },
  })
  formRef.current = form

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="md:min-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            Pengeluaran Akun
          </DialogTitle>
          <DialogDescription>{selectedAccount?.email.email}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6 overflow-hidden">
          {/* Form Section */}
          <div className="p-1">
            <p className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wider">Tambah Pengeluaran</p>
            <form.AppForm>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  form.handleSubmit()
                }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end"
              >
                <form.AppField
                  name="amount"
                  children={field => (
                    <field.TextField
                      label="Jumlah (IDR)"
                      type="number"
                      placeholder="Contoh: 50000"
                    />
                  )}
                />
                <form.AppField
                  name="note"
                  children={field => (
                    <field.TextField
                      label="Catatan (Opsional)"
                      placeholder="Contoh: Perpanjang bulanan"
                    />
                  )}
                />
                <div className="md:col-span-2 flex justify-end">
                  <div className="w-full md:w-auto">
                    <form.SubscribeButton
                      isPending={createExpenseMutation.isPending}
                      label="Tambah"
                    />
                  </div>
                </div>
              </form>
            </form.AppForm>
          </div>

          <Separator />

          {/* History Section */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <p className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wider">Histori Pengeluaran</p>
            {isFetchingExpenses
              ? (
                  <div className="space-y-3">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                )
              : expenses?.items.length
                ? (
                    <>
                      <ScrollArea className="flex-1 pr-4">
                        <div className="space-y-3">
                          {expenses.items.map((expense: Expense) => (
                            <div
                              key={expense.id}
                              className="flex justify-between items-center p-3 bg-secondary/50 rounded-lg border border-border"
                            >
                              <div className="flex flex-col">
                                <p className="font-bold">
                                  {formatRupiah(Number.parseInt(expense.amount))}
                                </p>
                                <p className="text-muted-foreground">
                                  {expense.note || '-'}
                                </p>
                                <p className="text-xs text-muted-foreground/70">
                                  {formatDateIdStandard(expense.created_at)}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteExpenseMutation.mutate(expense.id)}
                                disabled={deleteExpenseMutation.isPending}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                      {expenses.paginationData.totalPage > 1 && (
                        <div className="pt-4 flex justify-center">
                          <Pagination
                            currentPage={expenses.paginationData.currentPage}
                            totalPages={expenses.paginationData.totalPage}
                            onPageChange={setPage}
                          />
                        </div>
                      )}
                    </>
                  )
                : (
                    <div className="flex-1 flex items-center justify-center py-10 text-muted-foreground italic text-sm">
                      Belum ada histori pengeluaran.
                    </div>
                  )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight, CircleDashed } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { PermissionGate } from '@/dashboard/components/permission-gate'
import { Badge } from '@/dashboard/components/ui/badge'
import { Button } from '@/dashboard/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/dashboard/components/ui/card'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/dashboard/components/ui/dialog'
import { Input } from '@/dashboard/components/ui/input'
import { Label } from '@/dashboard/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/dashboard/components/ui/select'
import { Skeleton } from '@/dashboard/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/dashboard/components/ui/table'
import { API_URL } from '@/dashboard/constants/api-url.cont'
import { useAuth } from '@/dashboard/context-providers/auth.provider'
import { formatRupiah } from '@/dashboard/lib/currency.util'
import { formatDateIdStandard } from '@/dashboard/lib/time-converter.util'
import { BankAccountServiceGenerator } from '@/dashboard/services/bank-account.service'
import { WithdrawalServiceGenerator } from '@/dashboard/services/withdrawal.service'

export const Route = createFileRoute('/dashboard/wallet/')({
  component: WalletPage,
})

function WalletPage() {
  const auth = useAuth()
  const queryClient = useQueryClient()
  const withdrawalService = WithdrawalServiceGenerator(
    API_URL,
    auth.tenant!.accessToken,
    auth.tenant!.id,
  )
  const bankAccountService = BankAccountServiceGenerator(
    API_URL,
    auth.tenant!.accessToken,
    auth.tenant!.id,
  )

  const [dialogOpen, setDialogOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [bankAccountId, setBankAccountId] = useState('')

  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false)
  const [transactionModalType, setTransactionModalType] = useState<'available' | 'pending'>('available')
  const [transactionPage, setTransactionPage] = useState(1)

  const { data: transactionData, isLoading: isTransactionLoading, isError, error } = useQuery({
    queryKey: ['wallet-transactions', transactionModalType, transactionPage],
    queryFn: () => withdrawalService.getWalletTransactions({
      type: transactionModalType,
      page: transactionPage,
      limit: 10,
    }),
    enabled: isTransactionModalOpen,
  })

  const { data: balanceData, isLoading: isBalanceLoading } = useQuery({
    queryKey: ['wallet-balance'],
    queryFn: () => withdrawalService.getWalletBalance(),
  })

  const { data: historyData, isLoading: isHistoryLoading } = useQuery({
    queryKey: ['withdrawal-history'],
    queryFn: () => withdrawalService.getWithdrawalHistory(),
  })

  const { data: bankAccounts } = useQuery({
    queryKey: ['bank-accounts'],
    queryFn: () => bankAccountService.getBankAccounts(),
  })

  const requestMutation = useMutation({
    mutationFn: () => withdrawalService.requestWithdrawal({
      amount: Number(amount),
      bank_account_id: bankAccountId,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet-balance'] })
      queryClient.invalidateQueries({ queryKey: ['withdrawal-history'] })
      toast.success('Request penarikan berhasil dibuat')
      setDialogOpen(false)
      setAmount('')
      setBankAccountId('')
    },
    onError: (error: any) => {
      toast.error(`Gagal: ${error.message}`)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || !bankAccountId) {
      toast.error('Semua field wajib diisi')
      return
    }
    requestMutation.mutate()
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'SUCCESS': return 'default'
      case 'PENDING': return 'secondary'
      case 'PROCESSING': return 'outline'
      case 'FAILED': return 'destructive'
      default: return 'outline'
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row gap-6 justify-between items-center">
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight">
          Wallet & Penarikan
        </h1>
        <PermissionGate permission="wallet.edit">
          <div className="flex gap-2">
            <Button onClick={() => setDialogOpen(true)}>Request Penarikan</Button>
            <Button asChild>
              <Link to="/dashboard/wallet/bank-account">Kelola Rekening</Link>
            </Button>
          </div>
        </PermissionGate>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Saldo Tersedia</CardTitle>
            <CardDescription>Bisa ditarik (T+2)</CardDescription>
          </CardHeader>
          <CardContent>
            {isBalanceLoading
              ? (
                  <Skeleton className="h-8 w-32" />
                )
              : (
                  <p
                    className="text-3xl font-bold cursor-pointer hover:underline text-primary"
                    onClick={() => {
                      setTransactionModalType('available')
                      setTransactionPage(1)
                      setIsTransactionModalOpen(true)
                    }}
                  >
                    {formatRupiah(balanceData?.available_balance || 0)}
                  </p>
                )}
          </CardContent>
        </Card>
        <Card className="border-yellow-500/40 bg-yellow-500/5">
          <CardHeader>
            <CardTitle className="text-yellow-500">Saldo Pending</CardTitle>
            <CardDescription>Akan cair dalam 2 hari (T+2)</CardDescription>
          </CardHeader>
          <CardContent>
            {isBalanceLoading
              ? (
                  <Skeleton className="h-8 w-32" />
                )
              : (
                  <p
                    className="text-3xl font-bold text-yellow-500 cursor-pointer hover:underline"
                    onClick={() => {
                      setTransactionModalType('pending')
                      setTransactionPage(1)
                      setIsTransactionModalOpen(true)
                    }}
                  >
                    {formatRupiah(balanceData?.pending_balance || 0)}
                  </p>
                )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Penarikan</CardTitle>
            <CardDescription>Termasuk yang sedang diproses</CardDescription>
          </CardHeader>
          <CardContent>
            {isBalanceLoading
              ? (
                  <Skeleton className="h-8 w-32" />
                )
              : (
                  <p className="text-3xl font-bold">{formatRupiah(balanceData?.total_withdrawal || 0)}</p>
                )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Pendapatan Bersih</CardTitle>
            <CardDescription>Setelah potongan (T+2)</CardDescription>
          </CardHeader>
          <CardContent>
            {isBalanceLoading
              ? (
                  <Skeleton className="h-8 w-32" />
                )
              : (
                  <p className="text-3xl font-bold">{formatRupiah(balanceData?.total_profit || 0)}</p>
                )}
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Riwayat Penarikan</h2>
        <Card>
          <Table>
            <TableHeader className="bg-secondary text-secondary-foreground">
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Jumlah</TableHead>
                <TableHead>Bank Tujuan</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isHistoryLoading
                ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    </TableRow>
                  )
                : historyData?.length === 0
                  ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 italic text-muted-foreground">
                          Belum ada riwayat penarikan
                        </TableCell>
                      </TableRow>
                    )
                  : (
                      historyData?.map((item: any) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-mono text-xs text-muted-foreground">{item.id}</TableCell>
                          <TableCell>{formatDateIdStandard(new Date(item.created_at))}</TableCell>
                          <TableCell>
                            <span className="font-semibold">{formatRupiah(item.amount)}</span>
                            <div className="text-xs text-muted-foreground">
                              Admin:
                              {formatRupiah(item.admin_fee)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-semibold uppercase">{item.bank_info.bank_name}</span>
                            {' '}
                            -
                            {item.bank_info.account_number}
                            <div className="text-xs text-muted-foreground">{item.bank_info.account_holder}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(item.status)}>{item.status}</Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
            </TableBody>
          </Table>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Penarikan Dana</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label>Jumlah Penarikan</Label>
              <Input
                type="number"
                placeholder="Minimal Rp 50.000"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                min={50000}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Rekening Tujuan</Label>
              {(!bankAccounts || bankAccounts.length === 0)
                ? (
                    <div className="text-sm text-red-500">
                      Anda belum memiliki rekening terdaftar. Silakan tambah rekening terlebih dahulu.
                    </div>
                  )
                : (
                    <Select value={bankAccountId} onValueChange={setBankAccountId} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Rekening" />
                      </SelectTrigger>
                      <SelectContent>
                        {bankAccounts.map((acc: any) => (
                          <SelectItem key={acc.id} value={acc.id}>
                            {acc.bank_name}
                            {' '}
                            -
                            {acc.account_number}
                            {' '}
                            (
                            {acc.account_holder}
                            )
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
            </div>
            <DialogFooter className="mt-4">
              <DialogClose asChild>
                <Button variant="outline" type="button">Batal</Button>
              </DialogClose>
              <Button type="submit" disabled={requestMutation.isPending || !bankAccounts || bankAccounts.length === 0}>
                {requestMutation.isPending ? 'Memproses...' : 'Kirim Request'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isTransactionModalOpen} onOpenChange={setIsTransactionModalOpen}>
        <DialogContent className="max-w-[95vw] lg:max-w-5xl xl:max-w-6xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              Detail Transaksi -
              {' '}
              {transactionModalType === 'available' ? 'Saldo Tersedia' : 'Saldo Pending'}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Daftar transaksi yang menyusun saldo wallet Anda.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto min-h-0 border rounded-md relative">
            <Table>
              <TableHeader className="bg-secondary text-secondary-foreground sticky top-0 z-10 shadow-sm">
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Preview Item</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead className="text-right">Harga</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isTransactionLoading
                  ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-[200px] text-center">
                          <div className="flex justify-center items-center h-full text-muted-foreground gap-2">
                            <CircleDashed className="size-5 animate-spin" />
                            <p>Memuat data...</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  : isError
                    ? (
                        <TableRow>
                          <TableCell colSpan={6} className="h-[200px] text-center text-destructive">
                            Gagal memuat data transaksi:
                            {' '}
                            {error?.message}
                          </TableCell>
                        </TableRow>
                      )
                    : transactionData?.data?.length === 0
                      ? (
                          <TableRow>
                            <TableCell colSpan={6} className="h-[200px] text-center text-muted-foreground">
                              Tidak ada data transaksi.
                            </TableCell>
                          </TableRow>
                        )
                      : (
                          transactionData?.data?.map((item: any) => (
                            <TableRow key={item.id}>
                              <TableCell className="font-mono text-xs">{item.id}</TableCell>
                              <TableCell>{formatDateIdStandard(new Date(item.created_at))}</TableCell>
                              <TableCell>{item.items?.[0]?.name || '-'}</TableCell>
                              <TableCell>{item.customer}</TableCell>
                              <TableCell>{item.platform}</TableCell>
                              <TableCell className="text-right font-semibold">
                                {formatRupiah(item.net_profit)}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
              </TableBody>
            </Table>
          </div>

          {transactionData?.meta && transactionData.meta.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <Button
                variant="outline"
                size="icon"
                disabled={transactionPage === 1}
                onClick={() => setTransactionPage(p => Math.max(1, p - 1))}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <div className="flex gap-1">
                {Array.from({ length: transactionData.meta.totalPages }).map((_, i) => {
                  const pageNumber = i + 1
                  const isNearCurrent = Math.abs(pageNumber - transactionPage) <= 2
                  const isEdge = pageNumber === 1 || pageNumber === transactionData.meta.totalPages

                  if (!isNearCurrent && !isEdge) {
                    if (pageNumber === 2 || pageNumber === transactionData.meta.totalPages - 1) {
                      return <span key={pageNumber} className="px-2 self-center">...</span>
                    }
                    return null
                  }

                  return (
                    <Button
                      key={pageNumber}
                      variant={pageNumber === transactionPage ? 'default' : 'outline'}
                      size="icon"
                      className="w-8 h-8"
                      onClick={() => setTransactionPage(pageNumber)}
                    >
                      {pageNumber}
                    </Button>
                  )
                })}
              </div>
              <Button
                variant="outline"
                size="icon"
                disabled={transactionPage === transactionData.meta.totalPages}
                onClick={() => setTransactionPage(p => Math.min(transactionData.meta.totalPages, p + 1))}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

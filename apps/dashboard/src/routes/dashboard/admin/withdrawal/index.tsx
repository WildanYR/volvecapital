import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { toast } from 'sonner'
import { Button } from '@/dashboard/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription } from '@/dashboard/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/dashboard/components/ui/table'
import { API_URL } from '@/dashboard/constants/api-url.cont'
import { useAuth } from '@/dashboard/context-providers/auth.provider'
import { formatRupiah } from '@/dashboard/lib/currency.util'
import { formatDateIdStandard } from '@/dashboard/lib/time-converter.util'
import { WithdrawalServiceGenerator } from '@/dashboard/services/withdrawal.service'
import { useGlobalAlertDialog } from '@/dashboard/context-providers/alert-dialog.provider'
import { Skeleton } from '@/dashboard/components/ui/skeleton'

export const Route = createFileRoute('/dashboard/admin/withdrawal/')({
  component: AdminWithdrawalPage,
})

function AdminWithdrawalPage() {
  const auth = useAuth()
  const queryClient = useQueryClient()
  const { showAlertDialog, hideAlertDialog } = useGlobalAlertDialog()
  
  const withdrawalService = WithdrawalServiceGenerator(
    API_URL,
    auth.tenant!.accessToken,
    auth.tenant!.id,
  )

  const { data: pendingRequests, isLoading } = useQuery({
    queryKey: ['admin-pending-withdrawals'],
    queryFn: () => withdrawalService.getAdminPendingRequests(),
    enabled: auth.tenant?.id === 'paytronik', // Only load for admin
  })

  const approveMutation = useMutation({
    mutationFn: ({ tenantId, requestId }: { tenantId: string, requestId: string }) => 
      withdrawalService.approveWithdrawal(tenantId, requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-withdrawals'] })
      toast.success('Request berhasil diapprove dan sedang diproses DOKU')
    },
    onError: (error) => {
      toast.error(`Gagal approve: ${error.message}`)
    },
    onSettled: () => {
      hideAlertDialog()
    },
  })

  const handleApprove = (tenantId: string, requestId: string, amount: number) => {
    showAlertDialog({
      title: 'Approve Penarikan?',
      description: `Anda akan mencairkan dana sebesar ${formatRupiah(amount)} untuk tenant ${tenantId}. Proses ini akan memanggil API DOKU Payout.`,
      confirmText: 'Ya, Cairkan',
      isConfirming: approveMutation.isPending,
      onConfirm: () => approveMutation.mutate({ tenantId, requestId }),
    })
  }

  if (auth.tenant?.id !== 'paytronik') {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <p className="text-xl font-semibold text-muted-foreground">Access Denied</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row gap-6 justify-between items-center">
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight">
          Admin: Approval Penarikan
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Request Pending</CardTitle>
          <CardDescription>Approve untuk meneruskan ke DOKU Payout</CardDescription>
        </CardHeader>
        <Table>
          <TableHeader className="bg-secondary text-secondary-foreground">
            <TableRow>
              <TableHead>Tenant ID</TableHead>
              <TableHead>Request ID</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead>Jumlah + Admin</TableHead>
              <TableHead>Bank Tujuan</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <Skeleton className="h-4 w-full" />
                </TableCell>
              </TableRow>
            ) : pendingRequests?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 italic text-muted-foreground">
                  Tidak ada request penarikan pending
                </TableCell>
              </TableRow>
            ) : (
              pendingRequests?.map((item) => (
                <TableRow key={`${item.tenant_id}-${item.id}`}>
                  <TableCell className="font-bold">{item.tenant_id}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{item.id}</TableCell>
                  <TableCell>{formatDateIdStandard(new Date(item.created_at))}</TableCell>
                  <TableCell>
                    <span className="font-semibold text-primary">{formatRupiah(item.amount)}</span>
                    <div className="text-xs text-muted-foreground">Fee: {formatRupiah(item.admin_fee)}</div>
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold uppercase">{item.bank_info.bank_name}</span> - {item.bank_info.account_number}
                    <div className="text-xs text-muted-foreground">{item.bank_info.account_holder}</div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      size="sm" 
                      onClick={() => handleApprove(item.tenant_id, item.id, item.amount)}
                      disabled={approveMutation.isPending}
                    >
                      Approve
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}

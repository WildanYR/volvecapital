import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { API_URL } from '@/dashboard/constants/api-url.cont'
import { useAuth } from '@/dashboard/context-providers/auth.provider'
import { AccountingServiceGenerator } from '@/dashboard/services/accounting.service'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/dashboard/components/ui/card'
import { Button } from '@/dashboard/components/ui/button'
import { Badge } from '@/dashboard/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/dashboard/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/dashboard/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/dashboard/components/ui/alert-dialog'
import { Input } from '@/dashboard/components/ui/input'
import { Label } from '@/dashboard/components/ui/label'
import { Lock, } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

export const Route = createFileRoute('/dashboard/accounting/periods/')({
  component: AccountingPeriods,
})

function AccountingPeriods() {
  const auth = useAuth()
  const queryClient = useQueryClient()
  const accountingService = AccountingServiceGenerator(API_URL, auth.tenant!.accessToken, auth.tenant!.id)
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  
  const currentYear = new Date().getFullYear()
  const currentMonthStr = String(new Date().getMonth() + 1).padStart(2, '0')
  const [periodName, setPeriodName] = useState(`Periode ${currentMonthStr}-${currentYear}`)
  const [startDate, setStartDate] = useState(`${currentYear}-${currentMonthStr}-01`)
  
  // Hitung hari terakhir bulan ini
  const lastDay = new Date(currentYear, new Date().getMonth() + 1, 0).getDate()
  const [endDate, setEndDate] = useState(`${currentYear}-${currentMonthStr}-${lastDay}`)

  const { data: periods, isLoading } = useQuery({
    queryKey: ['accounting', 'periods'],
    queryFn: ({ signal }) => accountingService.getPeriods({ signal }),
  })

  const closeMutation = useMutation({
    mutationFn: (data: any) => accountingService.closePeriod(data),
    onSuccess: () => {
      toast.success('Periode berhasil ditutup!')
      queryClient.invalidateQueries({ queryKey: ['accounting', 'periods'] })
      setIsDialogOpen(false)
    },
    onError: (error: any) => {
      toast.error(error.message || 'Gagal menutup periode')
    }
  })

  const handleClosePeriod = (e: React.FormEvent) => {
    e.preventDefault()
    setIsConfirmOpen(true)
  }

  const confirmClosePeriod = () => {
    closeMutation.mutate({ periodName, startDate, endDate })
    setIsConfirmOpen(false)
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tutup Buku (Accounting Periods)</h1>
          <p className="text-muted-foreground">Kelola periode akuntansi dan lakukan tutup buku bulanan/tahunan.</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Lock className="w-4 h-4 mr-2" />
              Proses Tutup Buku
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tutup Periode Akuntansi</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleClosePeriod}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Nama Periode</Label>
                  <Input value={periodName} onChange={e => setPeriodName(e.target.value)} required placeholder="Contoh: Januari 2024" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Dari Tanggal</Label>
                    <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Sampai Tanggal</Label>
                    <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required />
                  </div>
                </div>
                <div className="bg-orange-50 text-orange-800 p-3 rounded-md text-sm border border-orange-200 mt-4">
                  <strong>Peringatan:</strong> Menutup buku akan mengunci semua transaksi dalam rentang tanggal tersebut. Anda tidak akan bisa membuat atau membatalkan (VOID) jurnal di periode yang sudah ditutup. Laba rugi bersih akan otomatis dihitung.
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Batal</Button>
                <Button type="submit" disabled={closeMutation.isPending}>
                  {closeMutation.isPending ? 'Memproses...' : 'Kunci & Tutup Buku'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Periode</CardTitle>
          <CardDescription>Riwayat periode yang sudah ditutup</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground">Memuat data...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Periode</TableHead>
                  <TableHead>Rentang Tanggal</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tgl Tutup</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {periods?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      Belum ada periode akuntansi yang ditutup.
                    </TableCell>
                  </TableRow>
                )}
                {periods?.map((period: any) => (
                  <TableRow key={period.id}>
                    <TableCell className="font-medium">{period.period_name}</TableCell>
                    <TableCell>
                      {period.start_date ? format(new Date(period.start_date), 'dd MMM yyyy') : '-'} - {period.end_date ? format(new Date(period.end_date), 'dd MMM yyyy') : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={period.is_closed ? 'default' : 'secondary'}>
                        {period.is_closed ? 'Terkunci (Closed)' : 'Open'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {(period.createdAt || period.created_at) ? format(new Date(period.createdAt || period.created_at), 'dd MMM yyyy HH:mm') : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Tutup Buku</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin MENGUNCI periode <strong>"{periodName}"</strong>?<br/><br/>
              Transaksi pada tanggal tersebut tidak akan bisa diubah atau dibatalkan (VOID).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmClosePeriod} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Ya, Kunci Sekarang
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

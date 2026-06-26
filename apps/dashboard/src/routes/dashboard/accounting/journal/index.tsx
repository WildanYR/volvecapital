import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, Fragment } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { API_URL } from '@/dashboard/constants/api-url.cont'
import { useAuth } from '@/dashboard/context-providers/auth.provider'
import { AccountingServiceGenerator } from '@/dashboard/services/accounting.service'
import { toast } from 'sonner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/dashboard/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/dashboard/components/ui/card'
import { Button } from '@/dashboard/components/ui/button'
import { Badge } from '@/dashboard/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/dashboard/components/ui/alert-dialog"
import { Plus, XCircle } from 'lucide-react'
import { format } from 'date-fns'

export const Route = createFileRoute('/dashboard/accounting/journal/')({
  component: JournalList,
})

function JournalList() {
  const auth = useAuth()
  const queryClient = useQueryClient()
  const accountingService = AccountingServiceGenerator(API_URL, auth.tenant!.accessToken, auth.tenant!.id)

  const [voidDialogOpen, setVoidDialogOpen] = useState(false)
  const [journalToVoid, setJournalToVoid] = useState<string | null>(null)

  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'))

  const { data: journalEntries, isLoading } = useQuery({
    queryKey: ['accounting', 'journal', startDate, endDate],
    queryFn: ({ signal }) => accountingService.getJournalEntries({ startDate, endDate, signal }),
  })

  const voidMutation = useMutation({
    mutationFn: (id: string) => accountingService.voidJournal(id),
    onSuccess: () => {
      toast.success('Jurnal berhasil dibatalkan (VOID)')
      queryClient.invalidateQueries({ queryKey: ['accounting', 'journal'] })
      setVoidDialogOpen(false)
      setJournalToVoid(null)
    },
    onError: (error: any) => {
      toast.error(error.message || 'Gagal membatalkan jurnal')
      setVoidDialogOpen(false)
      setJournalToVoid(null)
    }
  })

  const handleVoid = (id: string) => {
    setJournalToVoid(id)
    setVoidDialogOpen(true)
  }

  const confirmVoid = () => {
    if (journalToVoid) {
      voidMutation.mutate(journalToVoid)
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Jurnal Umum</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <input 
              type="date" 
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)} 
            />
            <span>-</span>
            <input 
              type="date" 
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)} 
            />
          </div>
          <Button asChild>
            <Link to="/dashboard/accounting/journal/create">
              <Plus className="w-4 h-4 mr-2" />
              Tambah Jurnal Manual
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>No Referensi</TableHead>
                <TableHead>Deskripsi</TableHead>
                <TableHead>Sumber</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Debit</TableHead>
                <TableHead className="text-right">Kredit</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-4">Loading...</TableCell>
                </TableRow>
              ) : journalEntries?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-4">Belum ada data jurnal.</TableCell>
                </TableRow>
              ) : (
                journalEntries?.map((entry: any) => {
                  const lines = entry.journal_lines || entry.lines || [];
                  const totalDebit = lines.reduce((acc: number, line: any) => acc + Number(line.debit), 0);
                  const totalCredit = lines.reduce((acc: number, line: any) => acc + Number(line.credit), 0);

                  return (
                    <Fragment key={entry.id}>
                      <TableRow className="bg-muted/20">
                        <TableCell className="whitespace-nowrap font-medium align-top">
                          {entry.transaction_date ? format(new Date(entry.transaction_date), 'dd MMM yyyy') : '-'}
                        </TableCell>
                        <TableCell className="align-top font-medium">{entry.reference_number || '-'}</TableCell>
                        <TableCell className="min-w-[300px] font-bold align-top">
                          {entry.description}
                        </TableCell>
                        <TableCell className="align-top">
                          <Badge variant="outline" className="text-[10px]">{entry.source}</Badge>
                        </TableCell>
                        <TableCell className="align-top">
                          <Badge variant={entry.status === 'POSTED' ? 'default' : 'secondary'} className="text-[10px]">
                            {entry.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold align-top">
                          {totalDebit > 0 ? totalDebit.toLocaleString() : '-'}
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold align-top">
                          {totalCredit > 0 ? totalCredit.toLocaleString() : '-'}
                        </TableCell>
                        <TableCell className="text-right align-top">
                          {entry.status === 'POSTED' && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 px-2"
                              onClick={() => handleVoid(entry.id)}
                              disabled={voidMutation.isPending}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Void
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                      {lines.map((line: any, index: number) => (
                        <TableRow key={line.id} className={index === lines.length - 1 ? 'border-b' : 'border-0'}>
                          <TableCell colSpan={2} className="py-1"></TableCell>
                          <TableCell className="py-1 text-sm text-muted-foreground flex items-center">
                            {Number(line.credit) > 0 ? (
                              <span className="ml-8">{line.coa?.code} - {line.coa?.name}</span>
                            ) : (
                              <span>{line.coa?.code} - {line.coa?.name}</span>
                            )}
                            {line.memo && <span className="ml-1 text-xs italic">({line.memo})</span>}
                          </TableCell>
                          <TableCell colSpan={2} className="py-1"></TableCell>
                          <TableCell className="text-right font-mono text-sm py-1">
                            {Number(line.debit) > 0 ? Number(line.debit).toLocaleString() : ''}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm py-1">
                            {Number(line.credit) > 0 ? Number(line.credit).toLocaleString() : ''}
                          </TableCell>
                          <TableCell className="py-1"></TableCell>
                        </TableRow>
                      ))}
                    </Fragment>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={voidDialogOpen} onOpenChange={setVoidDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Batalkan Jurnal (VOID)?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin me-VOID jurnal ini? Tindakan ini tidak dapat dikembalikan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmVoid} className="bg-red-600 hover:bg-red-700">Ya, Void Jurnal</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

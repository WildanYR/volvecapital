import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { API_URL } from '@/dashboard/constants/api-url.cont'
import { useAuth } from '@/dashboard/context-providers/auth.provider'
import { AccountingServiceGenerator } from '@/dashboard/services/accounting.service'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/dashboard/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/dashboard/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/dashboard/components/ui/select'
import { format } from 'date-fns'

export const Route = createFileRoute('/dashboard/accounting/ledger/')({
  component: GeneralLedger,
})

function GeneralLedger() {
  const auth = useAuth()
  const accountingService = AccountingServiceGenerator(API_URL, auth.tenant!.accessToken, auth.tenant!.id)
  const [selectedCoaId, setSelectedCoaId] = useState<string>('')

  const { data: coaList } = useQuery({
    queryKey: ['accounting', 'coa'],
    queryFn: ({ signal }) => accountingService.getCoaList({ signal }),
  })

  const { data: ledgerLines, isLoading } = useQuery({
    queryKey: ['accounting', 'ledger', selectedCoaId],
    queryFn: ({ signal }) => accountingService.getLedger(selectedCoaId, { signal }),
    enabled: !!selectedCoaId
  })

  let runningBalance = 0
  const selectedCoa = coaList?.find((c: any) => c.id === selectedCoaId)

  return (
    <div className="p-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Buku Besar (General Ledger)</CardTitle>
          <div className="w-[300px]">
            <Select value={selectedCoaId} onValueChange={setSelectedCoaId}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih Akun" />
              </SelectTrigger>
              <SelectContent>
                {coaList?.map((coa: any) => (
                  <SelectItem key={coa.id} value={coa.id}>
                    {coa.code} - {coa.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {!selectedCoaId ? (
            <div className="text-center py-10 text-muted-foreground">
              Silakan pilih akun dari dropdown di atas untuk melihat buku besar.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Referensi</TableHead>
                  <TableHead>Keterangan</TableHead>
                  <TableHead className="text-right">Debit</TableHead>
                  <TableHead className="text-right">Kredit</TableHead>
                  <TableHead className="text-right">Saldo Berjalan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">Loading...</TableCell>
                  </TableRow>
                ) : ledgerLines?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">Belum ada mutasi untuk akun ini.</TableCell>
                  </TableRow>
                ) : (
                  ledgerLines?.map((line: any) => {
                    if (selectedCoa?.normal_balance === 'DEBIT') {
                      runningBalance += Number(line.debit) - Number(line.credit)
                    } else {
                      runningBalance += Number(line.credit) - Number(line.debit)
                    }

                    return (
                      <TableRow key={line.id}>
                        <TableCell>{line.journal_entry?.transaction_date ? format(new Date(line.journal_entry.transaction_date), 'dd MMM yyyy') : '-'}</TableCell>
                        <TableCell>{line.journal_entry?.reference_number || '-'}</TableCell>
                        <TableCell>
                          {line.journal_entry?.description}
                          {line.memo && <div className="text-xs text-muted-foreground mt-1">{line.memo}</div>}
                        </TableCell>
                        <TableCell className="text-right text-blue-600 font-medium">
                          {Number(line.debit) > 0 ? Number(line.debit).toLocaleString() : '-'}
                        </TableCell>
                        <TableCell className="text-right text-green-600 font-medium">
                          {Number(line.credit) > 0 ? Number(line.credit).toLocaleString() : '-'}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {runningBalance.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

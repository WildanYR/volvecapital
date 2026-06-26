import { createFileRoute } from '@tanstack/react-router'
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

export const Route = createFileRoute('/dashboard/accounting/trial-balance/')({
  component: TrialBalance,
})

function TrialBalance() {
  const auth = useAuth()
  const accountingService = AccountingServiceGenerator(API_URL, auth.tenant!.accessToken, auth.tenant!.id)

  const { data: trialBalance, isLoading } = useQuery({
    queryKey: ['accounting', 'trial-balance'],
    queryFn: ({ signal }) => accountingService.getTrialBalance({ signal }),
  })

  let grandTotalDebit = 0
  let grandTotalCredit = 0

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Neraca Saldo (Trial Balance)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kode Akun</TableHead>
                <TableHead>Nama Akun</TableHead>
                <TableHead className="text-right">Debit</TableHead>
                <TableHead className="text-right">Kredit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4">Loading...</TableCell>
                </TableRow>
              ) : trialBalance?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4">Belum ada data transaksi.</TableCell>
                </TableRow>
              ) : (
                trialBalance?.map((item: any) => {
                  const debitBal = item.normal_balance === 'DEBIT' && item.ending_balance > 0 ? item.ending_balance : (item.normal_balance === 'KREDIT' && item.ending_balance < 0 ? Math.abs(item.ending_balance) : 0)
                  const creditBal = item.normal_balance === 'KREDIT' && item.ending_balance > 0 ? item.ending_balance : (item.normal_balance === 'DEBIT' && item.ending_balance < 0 ? Math.abs(item.ending_balance) : 0)

                  grandTotalDebit += debitBal
                  grandTotalCredit += creditBal

                  if (debitBal === 0 && creditBal === 0) return null; // Skip empty balances

                  return (
                    <TableRow key={item.coa_id}>
                      <TableCell className="font-medium">{item.coa_code}</TableCell>
                      <TableCell>{item.coa_name}</TableCell>
                      <TableCell className="text-right text-blue-600 font-medium">
                        {debitBal > 0 ? debitBal.toLocaleString() : '-'}
                      </TableCell>
                      <TableCell className="text-right text-green-600 font-medium">
                        {creditBal > 0 ? creditBal.toLocaleString() : '-'}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
              {!isLoading && (
                <TableRow className="bg-muted font-bold">
                  <TableCell colSpan={2} className="text-right pr-4">TOTAL</TableCell>
                  <TableCell className={`text-right ${grandTotalDebit !== grandTotalCredit ? 'text-red-500' : 'text-blue-600'}`}>
                    {grandTotalDebit.toLocaleString()}
                  </TableCell>
                  <TableCell className={`text-right ${grandTotalDebit !== grandTotalCredit ? 'text-red-500' : 'text-green-600'}`}>
                    {grandTotalCredit.toLocaleString()}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {!isLoading && grandTotalDebit !== grandTotalCredit && (
            <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md text-sm text-center">
              Perhatian: Neraca Saldo tidak seimbang (Unbalanced). Terdapat selisih sebesar {Math.abs(grandTotalDebit - grandTotalCredit).toLocaleString()}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

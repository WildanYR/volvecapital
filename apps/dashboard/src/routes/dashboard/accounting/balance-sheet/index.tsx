import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { API_URL } from '@/dashboard/constants/api-url.cont'
import { useAuth } from '@/dashboard/context-providers/auth.provider'
import { AccountingServiceGenerator } from '@/dashboard/services/accounting.service'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/dashboard/components/ui/card'
import { Input } from '@/dashboard/components/ui/input'
import { Label } from '@/dashboard/components/ui/label'

export const Route = createFileRoute('/dashboard/accounting/balance-sheet/')({
  component: BalanceSheet,
})

function BalanceSheet() {
  const auth = useAuth()
  const accountingService = AccountingServiceGenerator(API_URL, auth.tenant!.accessToken, auth.tenant!.id)
  
  const defaultAsOfDate = new Date().toISOString().split('T')[0]
  const [asOfDate, setAsOfDate] = useState(defaultAsOfDate)

  const { data: balanceSheet, isLoading } = useQuery({
    queryKey: ['accounting', 'balance-sheet', asOfDate],
    queryFn: ({ signal }) => accountingService.getBalanceSheet({ asOfDate, signal }),
  })

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Neraca Keuangan</h1>
          <p className="text-muted-foreground">Laporan posisi keuangan (Aset = Kewajiban + Modal).</p>
        </div>
        <div className="flex items-center gap-4 bg-card text-card-foreground p-3 rounded-md shadow-sm border">
          <div className="space-y-1">
            <Label>Per Tanggal (As of)</Label>
            <Input type="date" value={asOfDate} onChange={e => setAsOfDate(e.target.value)} />
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="text-center border-b bg-muted/30">
          <CardTitle className="text-xl">Neraca Keuangan (Balance Sheet)</CardTitle>
          <CardDescription>
            Per Tanggal: {asOfDate}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Memuat data...</div>
          ) : (
            <div className="grid grid-cols-2 gap-12">
              {/* Sisi Kiri: Aset */}
              <div>
                <h3 className="text-lg font-bold border-b pb-2 mb-4 text-blue-800">Aset (Assets)</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total Aset</span>
                    <span className="font-mono">Rp {Number(balanceSheet?.assets || 0).toLocaleString()}</span>
                  </div>
                </div>
                
                <div className="mt-8 pt-4 border-t-2 border-black flex justify-between items-center">
                  <span className="font-bold text-lg">Total Aset</span>
                  <span className="font-bold text-lg font-mono text-blue-700">
                    Rp {Number(balanceSheet?.assets || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Sisi Kanan: Kewajiban & Modal */}
              <div>
                <h3 className="text-lg font-bold border-b pb-2 mb-4 text-orange-800">Kewajiban (Liabilities)</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total Kewajiban</span>
                    <span className="font-mono">Rp {Number(balanceSheet?.liabilities || 0).toLocaleString()}</span>
                  </div>
                </div>

                <h3 className="text-lg font-bold border-b pb-2 mb-4 mt-8 text-purple-800">Modal (Equity)</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total Modal / Ekuitas</span>
                    <span className="font-mono">Rp {Number(balanceSheet?.equity || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <span>Laba/Rugi Tahun Berjalan</span>
                    <span className="font-mono">Rp {Number(balanceSheet?.current_earnings || 0).toLocaleString()}</span>
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t-2 border-black flex justify-between items-center">
                  <span className="font-bold text-lg">Total Kewajiban + Modal</span>
                  <span className="font-bold text-lg font-mono text-orange-700">
                    Rp {Number(balanceSheet?.total_liabilities_equity || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {!isLoading && balanceSheet && (
            <div className={`mt-8 p-4 rounded-md text-center font-semibold ${balanceSheet.is_balanced ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {balanceSheet.is_balanced 
                ? '✅ Neraca Seimbang (Balanced)' 
                : '❌ Neraca Tidak Seimbang (Unbalanced) - Mohon periksa kembali penjurnalan'}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

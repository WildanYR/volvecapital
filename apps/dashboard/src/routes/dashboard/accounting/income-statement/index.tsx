import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { API_URL } from '@/dashboard/constants/api-url.cont'
import { useAuth } from '@/dashboard/context-providers/auth.provider'
import { AccountingServiceGenerator } from '@/dashboard/services/accounting.service'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/dashboard/components/ui/card'
import { Input } from '@/dashboard/components/ui/input'
import { Label } from '@/dashboard/components/ui/label'

export const Route = createFileRoute('/dashboard/accounting/income-statement/')({
  component: IncomeStatement,
})

function IncomeStatement() {
  const auth = useAuth()
  const accountingService = AccountingServiceGenerator(API_URL, auth.tenant!.accessToken, auth.tenant!.id)
  
  const currentYear = new Date().getFullYear()
  const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0')
  const defaultStartDate = `${currentYear}-${currentMonth}-01`
  const defaultEndDate = new Date().toISOString().split('T')[0]

  const [startDate, setStartDate] = useState(defaultStartDate)
  const [endDate, setEndDate] = useState(defaultEndDate)

  const { data: incomeStatement, isLoading } = useQuery({
    queryKey: ['accounting', 'income-statement', startDate, endDate],
    queryFn: ({ signal }) => accountingService.getIncomeStatement({ startDate, endDate, signal }),
  })

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Laporan Laba Rugi</h1>
          <p className="text-muted-foreground">Laporan ringkas mengenai performa keuntungan bisnis.</p>
        </div>
        <div className="flex items-center gap-4 bg-card text-card-foreground p-3 rounded-md shadow-sm border">
          <div className="space-y-1">
            <Label>Dari Tanggal</Label>
            <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Sampai Tanggal</Label>
            <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="text-center border-b bg-muted/30">
          <CardTitle className="text-xl">Laporan Laba Rugi (Income Statement)</CardTitle>
          <CardDescription>
            Periode: {startDate} s/d {endDate}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Memuat data...</div>
          ) : (
            <div className="divide-y">
              <div className="flex justify-between items-center p-4">
                <span className="font-semibold text-lg text-green-700">Total Pendapatan (Revenue)</span>
                <span className="font-semibold text-lg text-green-700 font-mono">
                  Rp {Number(incomeStatement?.revenue || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center p-4 bg-muted/10">
                <span className="font-medium">Harga Pokok Penjualan (HPP / COGS)</span>
                <span className="font-mono text-red-600">
                  - Rp {Number(incomeStatement?.cogs || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center p-4 bg-muted/30">
                <span className="font-bold">Laba Kotor (Gross Profit)</span>
                <span className="font-bold font-mono">
                  Rp {Number(incomeStatement?.gross_profit || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center p-4 bg-muted/10">
                <span className="font-medium">Total Beban Operasional (Expenses)</span>
                <span className="font-mono text-red-600">
                  - Rp {Number(incomeStatement?.expense || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center p-6 bg-slate-900 text-white rounded-b-lg">
                <span className="font-bold text-xl">Laba Bersih (Net Income)</span>
                <span className={`font-bold text-xl font-mono ${Number(incomeStatement?.net_income) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  Rp {Number(incomeStatement?.net_income || 0).toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

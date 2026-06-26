import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { API_URL } from '@/dashboard/constants/api-url.cont'
import { useAuth } from '@/dashboard/context-providers/auth.provider'
import { AccountingServiceGenerator } from '@/dashboard/services/accounting.service'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/dashboard/components/ui/card'
import { Input } from '@/dashboard/components/ui/input'
import { Label } from '@/dashboard/components/ui/label'

export const Route = createFileRoute('/dashboard/accounting/cash-flow/')({
  component: CashFlowStatement,
})

function CashFlowStatement() {
  const auth = useAuth()
  const accountingService = AccountingServiceGenerator(API_URL, auth.tenant!.accessToken, auth.tenant!.id)
  
  const currentYear = new Date().getFullYear()
  const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0')
  const defaultStartDate = `${currentYear}-${currentMonth}-01`
  const defaultEndDate = new Date().toISOString().split('T')[0]

  const [startDate, setStartDate] = useState(defaultStartDate)
  const [endDate, setEndDate] = useState(defaultEndDate)

  const { data: cashFlow, isLoading } = useQuery({
    queryKey: ['accounting', 'cash-flow', startDate, endDate],
    queryFn: ({ signal }) => accountingService.getCashFlowStatement({ startDate, endDate, signal }),
  })

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Laporan Arus Kas</h1>
          <p className="text-muted-foreground">Laporan ringkas mengenai pergerakan arus kas bisnis.</p>
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
        <CardHeader className="text-center border-b">
          <CardTitle className="text-xl font-medium tracking-tight">Laporan Arus Kas (Cash Flow Statement)</CardTitle>
          <CardDescription>
            Periode: {startDate} s/d {endDate}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Memuat data...</div>
          ) : (
            <div className="divide-y">
              {/* OPERATING */}
              <div className="flex flex-col">
                <div className="flex justify-between items-center p-6 bg-muted/10">
                  <span className="font-semibold text-lg">Arus Kas dari Aktivitas Operasi</span>
                  <span className="font-semibold text-lg font-mono">
                    Rp {Number(cashFlow?.operating || 0).toLocaleString()}
                  </span>
                </div>
                {cashFlow?.operating_details?.map((detail: any, i: number) => (
                  <div key={i} className="flex justify-between items-center px-10 py-3 text-sm text-muted-foreground border-t border-dashed">
                    <span>{detail.description}</span>
                    <span className="font-mono">Rp {Number(detail.amount).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              {/* INVESTING */}
              <div className="flex flex-col border-t">
                <div className="flex justify-between items-center p-6 bg-muted/10">
                  <span className="font-semibold text-lg">Arus Kas dari Aktivitas Investasi</span>
                  <span className="font-semibold text-lg font-mono">
                    Rp {Number(cashFlow?.investing || 0).toLocaleString()}
                  </span>
                </div>
                {cashFlow?.investing_details?.map((detail: any, i: number) => (
                  <div key={i} className="flex justify-between items-center px-10 py-3 text-sm text-muted-foreground border-t border-dashed">
                    <span>{detail.description}</span>
                    <span className="font-mono">Rp {Number(detail.amount).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              {/* FINANCING */}
              <div className="flex flex-col border-t">
                <div className="flex justify-between items-center p-6 bg-muted/10">
                  <span className="font-semibold text-lg">Arus Kas dari Aktivitas Pendanaan</span>
                  <span className="font-semibold text-lg font-mono">
                    Rp {Number(cashFlow?.financing || 0).toLocaleString()}
                  </span>
                </div>
                {cashFlow?.financing_details?.map((detail: any, i: number) => (
                  <div key={i} className="flex justify-between items-center px-10 py-3 text-sm text-muted-foreground border-t border-dashed">
                    <span>{detail.description}</span>
                    <span className="font-mono">Rp {Number(detail.amount).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              {/* TOTAL NET CASH FLOW */}
              <div className="flex justify-between items-center p-8 bg-card border-t-2">
                <span className="font-bold text-2xl">Kenaikan/(Penurunan) Kas Bersih</span>
                <span className={`font-bold text-2xl font-mono ${Number(cashFlow?.net_cash_flow) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  Rp {Number(cashFlow?.net_cash_flow || 0).toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

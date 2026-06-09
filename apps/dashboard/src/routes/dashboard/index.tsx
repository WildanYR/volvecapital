import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { PeakHourChart } from '@/dashboard/components/chart/peak-hour-chart'
import { PlatformList } from '@/dashboard/components/chart/platform-list'
import { ProductSales } from '@/dashboard/components/chart/product-sales'
import RevenueChart from '@/dashboard/components/chart/revenue-chart'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/dashboard/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/dashboard/components/ui/select'
import { Skeleton } from '@/dashboard/components/ui/skeleton'
import { API_URL } from '@/dashboard/constants/api-url.cont'
import { useAuth } from '@/dashboard/context-providers/auth.provider'
import { formatRupiah } from '@/dashboard/lib/currency.util'
import { formatDateIdStandard } from '@/dashboard/lib/time-converter.util'
import { statisticServiceGenerator } from '@/dashboard/services/statistic.service'

export const Route = createFileRoute('/dashboard/')({
  component: RouteComponent,
})

function RouteComponent() {
  const auth = useAuth()
  const statisticService = statisticServiceGenerator(
    API_URL,
    auth.tenant!.accessToken,
    auth.tenant!.id,
  )

  const [range, setRange] = useState<'week' | 'month' | '3months' | '1year'>('month')

  const { data: allStatistic, isLoading: isFetchStatisticLoading } = useQuery({
    queryKey: ['allStatistic', range],
    queryFn: ({ signal }) => statisticService.getAllStatistic({ range }, signal),
  })

  const getRangeLabel = (rangeStr: string) => {
    switch (rangeStr) {
      case 'week': return 'Minggu Ini'
      case '3months': return '3 Bulan Terakhir'
      case '1year': return '1 Tahun Terakhir'
      case 'month':
      default: return 'Bulan Ini'
    }
  }

  return (
    <>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col md:flex-row gap-6 justify-between items-center">
          <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight text-balance">
            Dashboard
          </h1>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Periode:</span>
            <Select value={range} onValueChange={(val: any) => setRange(val)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Pilih Periode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Minggu Ini</SelectItem>
                <SelectItem value="month">Bulan Ini</SelectItem>
                <SelectItem value="3months">3 Bulan</SelectItem>
                <SelectItem value="1year">1 Tahun</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {isFetchStatisticLoading
          ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Skeleton className="h-20 rounded-md" />
                <Skeleton className="h-20 rounded-md" />
                <Skeleton className="h-20 rounded-md" />
              </div>
            )
          : (
              <div className="flex flex-col gap-4">
                {allStatistic?.revenue
                  ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card>
                          <CardHeader>
                            <CardTitle>Penghasilan Bersih {getRangeLabel(range)}</CardTitle>
                            <CardDescription>
                              Update data:
                              {' '}
                              {formatDateIdStandard(
                                allStatistic.revenue.period.updated_at,
                              )}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="flex flex-col gap-2">
                              <p className="text-3xl font-bold">
                                {formatRupiah(allStatistic.revenue.period.net_income)}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Transaksi:
                                {' '}
                                {allStatistic.revenue.period.transaction_count}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader>
                            <CardTitle>Total Pengeluaran {getRangeLabel(range)}</CardTitle>
                            <CardDescription>
                              Update data:
                              {' '}
                              {formatDateIdStandard(
                                allStatistic.revenue.period.updated_at,
                              )}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="flex flex-col gap-2">
                              <p className="text-3xl font-bold">
                                {formatRupiah(allStatistic.revenue.period.expense)}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                        <Card className="md:col-span-2">
                          <CardHeader>
                            <CardTitle>Grafik Keuangan ({getRangeLabel(range)})</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <RevenueChart data={allStatistic.revenue} />
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader>
                            <CardTitle>Jam Sibuk (Peak Hour)</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <PeakHourChart data={allStatistic.peakHour} />
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader>
                            <CardTitle>Transaksi per Platform</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <PlatformList data={allStatistic.platform} />
                          </CardContent>
                        </Card>
                        <Card className="md:col-span-2">
                          <CardHeader>
                            <CardTitle>Produk Terlaris</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ProductSales data={allStatistic.product} />
                          </CardContent>
                        </Card>
                      </div>
                    )
                  : null}
              </div>
            )}
      </div>
    </>
  )
}

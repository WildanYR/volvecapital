import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import RevenueChart from '@/dashboard/components/chart/revenue-chart'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/dashboard/components/ui/card'
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

  const { data: allStatistic, isLoading: isFetchStatisticLoading } = useQuery({
    queryKey: ['allStatistic'],
    queryFn: () => statisticService.getAllStatistic(),
  })

  return (
    <>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col md:flex-row gap-6 justify-between items-center">
          <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight text-balance">
            Dashboard
          </h1>
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
                            <CardTitle>Penghasilan Bulan Ini</CardTitle>
                            <CardDescription>
                              Update data:
                              {' '}
                              {formatDateIdStandard(
                                allStatistic.revenue.month.updated_at,
                              )}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="flex flex-col gap-2">
                              <p className="text-3xl">
                                {formatRupiah(allStatistic.revenue.month.total_revenue)}
                              </p>
                              <p className="text-sm">
                                Transaksi:
                                {' '}
                                {allStatistic.revenue.month.transaction_count}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader>
                            <CardTitle>Penghasilan Hari Ini</CardTitle>
                            <CardDescription>
                              Update data:
                              {' '}
                              {formatDateIdStandard(
                                allStatistic.revenue.today.updated_at,
                              )}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="flex flex-col gap-2">
                              <p className="text-3xl">
                                {formatRupiah(allStatistic.revenue.today.total_revenue)}
                              </p>
                              <p className="text-sm">
                                Transaksi:
                                {' '}
                                {allStatistic.revenue.today.transaction_count}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                        <Card className="col-span-full">
                          <CardHeader>
                            <CardTitle>Grafik Revenue</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <RevenueChart data={allStatistic.revenue} />
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

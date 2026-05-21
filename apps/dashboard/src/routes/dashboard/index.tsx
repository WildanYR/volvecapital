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
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/dashboard/components/ui/card'
import { Skeleton } from '@/dashboard/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/dashboard/components/ui/dropdown-menu'
import { Calendar } from '@/dashboard/components/ui/calendar'
import { Button } from '@/dashboard/components/ui/button'
import { Input } from '@/dashboard/components/ui/input'
import { API_URL } from '@/dashboard/constants/api-url.cont'
import { useAuth } from '@/dashboard/context-providers/auth.provider'
import { formatRupiah } from '@/dashboard/lib/currency.util'
import { statisticServiceGenerator } from '@/dashboard/services/statistic.service'
import { formatDateIdStandard } from '@/dashboard/lib/time-converter.util'
import { ArrowDownIcon, ArrowUpIcon, MinusIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'

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

  const [filter, setFilter] = useState<string>('today')
  const [customDate, setCustomDate] = useState<string>('')
  const [customMonth, setCustomMonth] = useState<string>('')
  const [customYear, setCustomYear] = useState<string>(new Date().getFullYear().toString())

  const { data: allStatistic, isLoading: isFetchStatisticLoading } = useQuery({
    queryKey: ['allStatistic', filter, customDate, customMonth, customYear],
    queryFn: ({ signal }) => {
      const params: any = { filter }
      if (filter === 'custom_day' && customDate) {
        params.date = customDate
      }
      if (filter === 'custom_month' && customMonth) {
        const [y, m] = customMonth.split('-')
        params.year = y
        params.month = m
      }
      if (filter === 'custom_year' && customYear) {
        params.year = customYear
      }
      return statisticService.getAllStatistic(params, signal)
    },
  })

  const renderPercentage = (percentage?: number) => {
    if (percentage === undefined || percentage === null) return null
    if (percentage === 0) {
      return (
        <span className="flex items-center text-xs text-muted-foreground mt-1">
          <MinusIcon className="w-3 h-3 mr-1" /> 0% vs sblm
        </span>
      )
    }
    const isPositive = percentage > 0
    return (
      <span className={`flex items-center text-xs mt-1 font-medium ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
        {isPositive ? <ArrowUpIcon className="w-3 h-3 mr-1" /> : <ArrowDownIcon className="w-3 h-3 mr-1" />}
        {Math.abs(percentage).toFixed(1)}% vs sblm
      </span>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col md:flex-row gap-6 justify-between items-center">
          <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight text-balance">
            Dashboard
          </h1>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-[200px] justify-between">
                  {filter === 'realtime' && 'Real-time'}
                  {filter === 'today' && 'Hari Ini'}
                  {filter === 'yesterday' && 'Kemarin'}
                  {filter === 'last_7_days' && '7 hari sebelumnya'}
                  {filter === 'last_30_days' && '30 hari sebelumnya'}
                  {filter === 'custom_day' && customDate && formatDateIdStandard(new Date(customDate))}
                  {filter === 'custom_day' && !customDate && 'Per Hari'}
                  {filter === 'custom_month' && customMonth && customMonth}
                  {filter === 'custom_month' && !customMonth && 'Per Bulan'}
                  {filter === 'custom_year' && customYear && `Tahun ${customYear}`}
                  <ChevronDownIcon className="w-4 h-4 opacity-50 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[200px]" align="end">
                <DropdownMenuItem onClick={() => setFilter('realtime')}>Real-time</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter('today')}>Hari Ini</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter('yesterday')}>Kemarin</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter('last_7_days')}>7 hari sebelumnya</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter('last_30_days')}>30 hari sebelumnya</DropdownMenuItem>
                <DropdownMenuSeparator />
                
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Per Hari</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="p-0">
                    <Calendar
                      mode="single"
                      selected={customDate ? new Date(customDate) : undefined}
                      onSelect={(date) => {
                        if (date) {
                          const offset = date.getTimezoneOffset()
                          const localDate = new Date(date.getTime() - offset * 60 * 1000)
                          setCustomDate(localDate.toISOString().split('T')[0])
                          setFilter('custom_day')
                        }
                      }}
                      initialFocus
                    />
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Per Bulan</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="p-0">
                    <MonthPicker 
                      value={customMonth} 
                      onChange={(val) => {
                        setCustomMonth(val)
                        setFilter('custom_month')
                      }} 
                    />
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Berdasarkan Tahun</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="p-0">
                    <YearPicker
                      value={customYear}
                      onChange={(val) => {
                        setCustomYear(val)
                        setFilter('custom_year')
                      }}
                    />
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {isFetchStatisticLoading
          ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Skeleton className="h-28 rounded-md" />
                <Skeleton className="h-28 rounded-md" />
                <Skeleton className="h-28 rounded-md" />
                <Skeleton className="h-28 rounded-md" />
                <Skeleton className="h-64 md:col-span-2 rounded-md" />
                <Skeleton className="h-64 rounded-md" />
                <Skeleton className="h-64 rounded-md" />
              </div>
            )
          : (
              <div className="flex flex-col gap-4">
                {allStatistic?.summary
                  ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-2xl font-bold">{formatRupiah(allStatistic.summary.total_revenue)}</div>
                              <p className="text-xs text-muted-foreground">Dari {allStatistic.summary.transaction_count} transaksi</p>
                              <div className="flex gap-4">
                                {renderPercentage(allStatistic.summary.revenue_percentage)}
                              </div>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm font-medium text-muted-foreground">Gross Profit</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-2xl font-bold text-emerald-600">{formatRupiah(allStatistic.summary.gross_profit)}</div>
                              {renderPercentage(allStatistic.summary.profit_percentage)}
                            </CardContent>
                          </Card>
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm font-medium text-muted-foreground">Total Modal</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-2xl font-bold text-rose-600">{formatRupiah(allStatistic.summary.total_capital_price)}</div>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm font-medium text-muted-foreground">Periode</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-sm font-medium">
                                {formatDateIdStandard(new Date(allStatistic.meta.start))} - {formatDateIdStandard(new Date(allStatistic.meta.end))}
                              </div>
                            </CardContent>
                          </Card>

                          <Card className="col-span-full md:col-span-2">
                            <CardHeader>
                              <CardTitle>Grafik Revenue</CardTitle>
                              <CardDescription>Berdasarkan {allStatistic.meta.granularity}</CardDescription>
                            </CardHeader>
                            <CardContent>
                              <RevenueChart data={allStatistic.charts.revenue} />
                            </CardContent>
                          </Card>
                          <Card className="col-span-full md:col-span-2">
                            <CardHeader>
                              <CardTitle>Jam Sibuk (Peak Hour)</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <PeakHourChart data={allStatistic.charts.peakHour} />
                            </CardContent>
                          </Card>
                          <Card className="col-span-full md:col-span-2">
                            <CardHeader>
                              <CardTitle>Transaksi per Platform</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <PlatformList data={allStatistic.charts.platform} />
                            </CardContent>
                          </Card>
                          <Card className="col-span-full md:col-span-2">
                            <CardHeader>
                              <CardTitle>Produk Terlaris</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <ProductSales data={allStatistic.charts.products} />
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

function MonthPicker({ value, onChange }: { value: string; onChange: (val: string) => void }) {
  const defaultYear = value ? parseInt(value.split('-')[0]) : new Date().getFullYear()
  const [viewYear, setViewYear] = useState(defaultYear)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Des']
  
  return (
    <div className="w-[240px] p-3">
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => setViewYear(v => v - 1)}>
          <ChevronLeftIcon className="h-4 w-4" />
        </Button>
        <div className="font-semibold text-sm">{viewYear}</div>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => setViewYear(v => v + 1)}>
          <ChevronRightIcon className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {months.map((m, i) => {
          const monthStr = (i + 1).toString().padStart(2, '0')
          const isSelected = value === `${viewYear}-${monthStr}`
          return (
            <Button
              key={m}
              variant="ghost"
              className={`h-9 font-normal ${isSelected ? 'bg-transparent text-red-500 hover:text-red-600 hover:bg-transparent font-medium' : 'text-muted-foreground hover:text-foreground'}`}
              onClick={() => onChange(`${viewYear}-${monthStr}`)}
            >
              {m}
            </Button>
          )
        })}
      </div>
    </div>
  )
}

function YearPicker({ value, onChange }: { value: string; onChange: (val: string) => void }) {
  const currentYear = value ? parseInt(value) : new Date().getFullYear()
  const [viewDecade, setViewDecade] = useState(Math.floor(currentYear / 10) * 10)
  
  const years = Array.from({ length: 12 }, (_, i) => viewDecade - 1 + i)

  return (
    <div className="w-[240px] p-3">
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => setViewDecade(v => v - 10)}>
          <ChevronLeftIcon className="h-4 w-4" />
        </Button>
        <div className="font-semibold text-sm">{viewDecade} - {viewDecade + 9}</div>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => setViewDecade(v => v + 10)}>
          <ChevronRightIcon className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {years.map((y) => {
          const isSelected = value === y.toString()
          const isOutDecade = y < viewDecade || y > viewDecade + 9
          return (
            <Button
              key={y}
              variant="ghost"
              className={`h-9 font-normal ${isSelected ? 'bg-transparent text-red-500 hover:text-red-600 hover:bg-transparent font-medium' : isOutDecade ? 'text-muted-foreground/40' : 'text-muted-foreground hover:text-foreground'}`}
              onClick={() => onChange(y.toString())}
            >
              {y}
            </Button>
          )
        })}
      </div>
    </div>
  )
}

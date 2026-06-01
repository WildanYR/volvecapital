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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/dashboard/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/dashboard/components/ui/dropdown-menu'
import { Calendar } from '@/dashboard/components/ui/calendar'
import { Button } from '@/dashboard/components/ui/button'
import { API_URL } from '@/dashboard/constants/api-url.cont'
import { useAuth } from '@/dashboard/context-providers/auth.provider'
import { formatRupiah } from '@/dashboard/lib/currency.util'
import { statisticServiceGenerator } from '@/dashboard/services/statistic.service'
import { ProductServiceGenerator } from '@/dashboard/services/product.service'
import { formatDateIdStandard } from '@/dashboard/lib/time-converter.util'
import { ArrowDownIcon, ArrowUpIcon, MinusIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, CopyIcon, GlobeIcon, LayoutGridIcon, MessageCircleIcon, CalendarIcon } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/dashboard/components/ui/select'

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
  const productService = ProductServiceGenerator(
    API_URL,
    auth.tenant!.accessToken,
    auth.tenant!.id,
  )

  const [filter, setFilter] = useState<string>('today')
  const [customDate, setCustomDate] = useState<string>('')
  const [customMonth, setCustomMonth] = useState<string>('')
  const [customYear, setCustomYear] = useState<string>(new Date().getFullYear().toString())
  const [selectedVariantId, setSelectedVariantId] = useState<string>('all')
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all')
  const [activeSubMenu, setActiveSubMenu] = useState<'day' | 'month' | 'year' | null>(null)
  const [isCapitalDetailsOpen, setIsCapitalDetailsOpen] = useState(false)
  const [capitalPage, setCapitalPage] = useState(1)
  const [isRevenueDetailsOpen, setIsRevenueDetailsOpen] = useState(false)
  const [revenuePage, setRevenuePage] = useState(1)

  const { data: variants } = useQuery({
    queryKey: ['allProductVariants'],
    queryFn: ({ signal }) => productService.getAllProductVariant({ limit: 100, signal }),
  })

  const { data: allStatistic, isLoading: isFetchStatisticLoading } = useQuery({
    queryKey: ['allStatistic', filter, customDate, customMonth, customYear, selectedVariantId, selectedPlatform],
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
      if (selectedVariantId !== 'all') {
        params.product_variant_id = selectedVariantId
      }
      if (selectedPlatform !== 'all') {
        params.platform = selectedPlatform
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
          <div className="flex flex-col gap-2 w-full md:w-auto md:flex-row md:items-center">
            <div className="flex gap-2">
              <Select value={selectedVariantId} onValueChange={setSelectedVariantId}>
                <SelectTrigger className="flex-1 min-w-0 md:w-[180px]">
                  <SelectValue placeholder="Semua Varian" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Varian</SelectItem>
                  {variants?.items?.map((v: any) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.product?.name ? `${v.product.name} - ${v.name}` : v.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                <SelectTrigger className="flex-1 min-w-0 md:w-[150px]">
                  <SelectValue placeholder="Semua Platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Platform</SelectItem>
                  <SelectItem value="Whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="landing">Landing</SelectItem>
                  <SelectItem value="Shopee">Shopee</SelectItem>
                  <SelectItem value="dashboard">Dashboard</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full md:w-[200px] justify-between">
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
              <DropdownMenuContent className="w-[280px]" align="end">
                <DropdownMenuItem onClick={() => { setFilter('realtime'); setActiveSubMenu(null) }}>Real-time</DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setFilter('today'); setActiveSubMenu(null) }}>Hari Ini</DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setFilter('yesterday'); setActiveSubMenu(null) }}>Kemarin</DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setFilter('last_7_days'); setActiveSubMenu(null) }}>7 hari sebelumnya</DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setFilter('last_30_days'); setActiveSubMenu(null) }}>30 hari sebelumnya</DropdownMenuItem>
                <DropdownMenuSeparator />

                {/* Per Hari - inline accordion */}
                <DropdownMenuItem
                  onSelect={(e) => { e.preventDefault(); setActiveSubMenu(activeSubMenu === 'day' ? null : 'day') }}
                  className="justify-between"
                >
                  Per Hari
                  <ChevronDownIcon className={`w-4 h-4 opacity-50 transition-transform duration-200 ${activeSubMenu === 'day' ? 'rotate-180' : ''}`} />
                </DropdownMenuItem>
                {activeSubMenu === 'day' && (
                  <div className="px-1 pb-1">
                    <Calendar
                      mode="single"
                      selected={customDate ? new Date(customDate) : undefined}
                      onSelect={(date) => {
                        if (date) {
                          const offset = date.getTimezoneOffset()
                          const localDate = new Date(date.getTime() - offset * 60 * 1000)
                          setCustomDate(localDate.toISOString().split('T')[0])
                          setFilter('custom_day')
                          setActiveSubMenu(null)
                        }
                      }}
                      initialFocus
                    />
                  </div>
                )}

                {/* Per Bulan - inline accordion */}
                <DropdownMenuItem
                  onSelect={(e) => { e.preventDefault(); setActiveSubMenu(activeSubMenu === 'month' ? null : 'month') }}
                  className="justify-between"
                >
                  Per Bulan
                  <ChevronDownIcon className={`w-4 h-4 opacity-50 transition-transform duration-200 ${activeSubMenu === 'month' ? 'rotate-180' : ''}`} />
                </DropdownMenuItem>
                {activeSubMenu === 'month' && (
                  <div className="px-1 pb-1">
                    <MonthPicker
                      value={customMonth}
                      onChange={(val) => {
                        setCustomMonth(val)
                        setFilter('custom_month')
                        setActiveSubMenu(null)
                      }}
                    />
                  </div>
                )}

                {/* Berdasarkan Tahun - inline accordion */}
                <DropdownMenuItem
                  onSelect={(e) => { e.preventDefault(); setActiveSubMenu(activeSubMenu === 'year' ? null : 'year') }}
                  className="justify-between"
                >
                  Berdasarkan Tahun
                  <ChevronDownIcon className={`w-4 h-4 opacity-50 transition-transform duration-200 ${activeSubMenu === 'year' ? 'rotate-180' : ''}`} />
                </DropdownMenuItem>
                {activeSubMenu === 'year' && (
                  <div className="px-1 pb-1">
                    <YearPicker
                      value={customYear}
                      onChange={(val) => {
                        setCustomYear(val)
                        setFilter('custom_year')
                        setActiveSubMenu(null)
                      }}
                    />
                  </div>
                )}

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
                          <Card 
                            className="cursor-pointer hover:bg-muted/50 transition-colors" 
                            onClick={() => setIsRevenueDetailsOpen(true)}
                          >
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-2xl font-bold">{formatRupiah(allStatistic.summary.total_revenue)}</div>
                              <p className="text-xs text-muted-foreground mt-1 underline decoration-dashed underline-offset-4">Klik untuk lihat rincian</p>
                              <p className="text-xs text-muted-foreground mt-1">Dari {allStatistic.summary.transaction_count} transaksi</p>
                              <div className="flex gap-4 mt-1">
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
                          <Card 
                            className="cursor-pointer hover:bg-muted/50 transition-colors" 
                            onClick={() => setIsCapitalDetailsOpen(true)}
                          >
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm font-medium text-muted-foreground">Total Modal</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-2xl font-bold text-rose-600">{formatRupiah(allStatistic.summary.total_capital_price)}</div>
                              <p className="text-xs text-muted-foreground mt-1 underline decoration-dashed underline-offset-4">Klik untuk lihat rincian</p>
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
        {/* Dialog Detail Modal */}
        <Dialog open={isCapitalDetailsOpen} onOpenChange={(open) => { setIsCapitalDetailsOpen(open); if(!open) setCapitalPage(1); }}>
          <DialogContent className="sm:max-w-[900px] max-h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Rincian Modal</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto pr-2 mt-4 space-y-4">
              {allStatistic?.charts.capital_details && allStatistic.charts.capital_details.length > 0 ? (
                <>
                  <div className="rounded-md border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="px-3 py-2 text-left font-medium">Akun / Produk</th>
                          <th className="px-3 py-2 text-left font-medium">Tanggal Input</th>
                          <th className="px-3 py-2 text-right font-medium">Nominal</th>
                          <th className="px-3 py-2 text-right font-medium">Tipe</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allStatistic.charts.capital_details.slice((capitalPage - 1) * 10, capitalPage * 10).map((item: any, idx: number) => (
                          <tr key={idx} className="border-b last:border-0 hover:bg-muted/50">
                            <td className="px-3 py-1.5">
                              <div className="font-medium font-bold text-foreground">{item.email}</div>
                              <div className="text-xs text-muted-foreground mt-0.5">{item.variant_name}</div>
                            </td>
                            <td className="px-3 py-1.5 whitespace-nowrap">{formatDateIdStandard(new Date(item.date))}</td>
                            <td className="px-3 py-1.5 text-right font-medium text-rose-600 whitespace-nowrap">{formatRupiah(item.nominal)}</td>
                            <td className="px-3 py-1.5 text-right text-muted-foreground text-xs whitespace-nowrap">{item.type === 'Account Creation' ? 'Modal Awal' : 'Modal Tambahan'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {allStatistic.charts.capital_details.length > 10 && (() => {
                    const totalPages = Math.ceil(allStatistic.charts.capital_details.length / 10)
                    const pages: (number | '...')[] = []
                    if (totalPages <= 7) {
                      for (let i = 1; i <= totalPages; i++) pages.push(i)
                    } else {
                      pages.push(1)
                      if (capitalPage > 3) pages.push('...')
                      for (let i = Math.max(2, capitalPage - 1); i <= Math.min(totalPages - 1, capitalPage + 1); i++) pages.push(i)
                      if (capitalPage < totalPages - 2) pages.push('...')
                      pages.push(totalPages)
                    }
                    return (
                      <div className="flex items-center justify-center gap-1 mt-3">
                        <Button variant="outline" size="icon" className="h-8 w-8" disabled={capitalPage === 1} onClick={() => setCapitalPage(p => p - 1)}>
                          <ChevronLeftIcon className="h-4 w-4" />
                        </Button>
                        {pages.map((p, i) =>
                          p === '...' ? (
                            <span key={`dots-${i}`} className="px-2 text-muted-foreground text-sm">...</span>
                          ) : (
                            <Button key={p} variant={capitalPage === p ? 'default' : 'outline'} size="icon" className="h-8 w-8 text-sm" onClick={() => setCapitalPage(p as number)}>
                              {p}
                            </Button>
                          )
                        )}
                        <Button variant="outline" size="icon" className="h-8 w-8" disabled={capitalPage === totalPages} onClick={() => setCapitalPage(p => p + 1)}>
                          <ChevronRightIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    )
                  })()}
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Tidak ada data modal pada rentang waktu ini.
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog Revenue Details */}
        <Dialog open={isRevenueDetailsOpen} onOpenChange={(open) => { setIsRevenueDetailsOpen(open); if(!open) setRevenuePage(1); }}>
          <DialogContent className="sm:max-w-[1000px] max-h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Rincian Revenue</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto pr-2 mt-4 space-y-4">
              {allStatistic?.charts.revenue_details && allStatistic.charts.revenue_details.length > 0 ? (
                <>
                  <div className="rounded-md border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="px-3 py-2 text-left font-medium">Tanggal</th>
                          <th className="px-3 py-2 text-left font-medium">Preview Item</th>
                          <th className="px-3 py-2 text-left font-medium">Customer</th>
                          <th className="px-3 py-2 text-left font-medium">Platform</th>
                          <th className="px-3 py-2 text-left font-medium">Harga</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allStatistic.charts.revenue_details.slice((revenuePage - 1) * 10, revenuePage * 10).map((item: any, idx: number) => (
                          <tr key={idx} className="border-b last:border-0 hover:bg-muted/50">
                            <td className="px-3 py-1.5 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                                {formatDateIdStandard(new Date(item.date))}
                              </div>
                            </td>
                            <td className="px-3 py-1.5">
                              <div className="flex items-start gap-3">
                                <div>
                                  <div className="font-medium font-bold text-foreground">{item.email}</div>
                                  <div className="text-xs text-muted-foreground mt-0.5">{item.variant_name || '-'}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-1.5 whitespace-nowrap">{item.customer}</td>
                            <td className="px-3 py-1.5 whitespace-nowrap">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                {item.platform === 'dashboard' ? <LayoutGridIcon className="w-4 h-4" /> : item.platform === 'landing' ? <GlobeIcon className="w-4 h-4" /> : <MessageCircleIcon className="w-4 h-4" />}
                                <span>{item.platform}</span>
                              </div>
                            </td>
                            <td className="px-3 py-1.5 font-medium whitespace-nowrap">{formatRupiah(item.nominal)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {allStatistic.charts.revenue_details.length > 10 && (() => {
                    const totalPages = Math.ceil(allStatistic.charts.revenue_details.length / 10)
                    const pages: (number | '...')[] = []
                    if (totalPages <= 7) {
                      for (let i = 1; i <= totalPages; i++) pages.push(i)
                    } else {
                      pages.push(1)
                      if (revenuePage > 3) pages.push('...')
                      for (let i = Math.max(2, revenuePage - 1); i <= Math.min(totalPages - 1, revenuePage + 1); i++) pages.push(i)
                      if (revenuePage < totalPages - 2) pages.push('...')
                      pages.push(totalPages)
                    }
                    return (
                      <div className="flex items-center justify-center gap-1 mt-3">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          disabled={revenuePage === 1}
                          onClick={() => setRevenuePage(p => p - 1)}
                        >
                          <ChevronLeftIcon className="h-4 w-4" />
                        </Button>
                        {pages.map((p, i) =>
                          p === '...' ? (
                            <span key={`dots-${i}`} className="px-2 text-muted-foreground text-sm">...</span>
                          ) : (
                            <Button
                              key={p}
                              variant={revenuePage === p ? 'default' : 'outline'}
                              size="icon"
                              className="h-8 w-8 text-sm"
                              onClick={() => setRevenuePage(p as number)}
                            >
                              {p}
                            </Button>
                          )
                        )}
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          disabled={revenuePage === totalPages}
                          onClick={() => setRevenuePage(p => p + 1)}
                        >
                          <ChevronRightIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    )
                  })()}
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Tidak ada data transaksi pada rentang waktu ini.
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
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

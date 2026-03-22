import type { RevenueStatistic } from '@/dashboard/services/statistic.service'
import { useMemo } from 'react'
import { Bar, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from 'recharts'
import { formatRupiah } from '@/dashboard/lib/currency.util'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../ui/chart'

function RevenueChart({ data }: { data: RevenueStatistic }) {
  // 2. HITUNG MANUAL (Menggunakan useMemo agar performa terjaga)
  // Kita cari nilai transaksi tertinggi dari seluruh data yang ada
  const maxTransactionVal = useMemo(() => {
    const max = Math.max(
      ...data.daily.map((d: any) => Number(d.transaction_count || 0)),
    )
    return max
  }, [data])

  // 3. Tentukan batas atas (Ceiling)
  // Jika max 160, kita set batas atas jadi 240 (1.5x) agar ada ruang napas
  // Jika datanya 0 semua, kita kasih default 10 agar chart tidak error
  const yAxisMax
    = maxTransactionVal > 0 ? Math.round(maxTransactionVal * 1.5) : 10
  return (
    <ChartContainer
      config={{
        total_revenue: {
          label: 'Revenue',
          color: 'var(--chart-1)',
        },
        transaction_count: {
          label: 'Transaksi',
          color: 'var(--chart-3)',
        },
      }}
    >
      <ComposedChart accessibilityLayer data={data.daily}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="date" />
        <YAxis
          yAxisId="axis_revenue"
          orientation="left"
          // hide
        />
        <YAxis
          yAxisId="axis_trx"
          orientation="right"
          domain={[0, yAxisMax]}
          // hide
        />

        <ChartTooltip
          cursor={false}
          content={(
            <ChartTooltipContent
              formatter={(value, _name, item) => {
                if (item.dataKey === 'total_revenue') {
                  return formatRupiah(Number(value))
                }
                if (item.dataKey === 'transaction_count') {
                  return `${value} transaksi`
                }
                return value
              }}
            />
          )}
        />
        <Bar
          dataKey="total_revenue"
          yAxisId="axis_revenue"
          fill="var(--color-total_revenue)"
          radius={[4, 4, 0, 0]}
          barSize={40}
        />

        {/* Line: Transaction Count */}
        <Line
          type="monotone"
          dataKey="transaction_count"
          yAxisId="axis_trx"
          stroke="var(--color-transaction_count)"
          strokeWidth={2}
          dot={{ r: 4, fill: 'var(--color-white)' }}
          activeDot={{ r: 6 }}
        />
      </ComposedChart>
    </ChartContainer>
  )
}

export default RevenueChart

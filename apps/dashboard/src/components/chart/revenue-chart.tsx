import type { RevenueStatistic } from '@/dashboard/services/statistic.service'
import { useMemo } from 'react'
import { Bar, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from 'recharts'
import { formatRupiah } from '@/dashboard/lib/currency.util'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../ui/chart'

function RevenueChart({ data }: { data: RevenueStatistic }) {
  const maxTransactionVal = useMemo(() => {
    const max = Math.max(
      ...data.daily.map((d: any) => Number(d.transaction_count || 0)),
    )
    return max
  }, [data])

  const yAxisMax
    = maxTransactionVal > 0 ? Math.round(maxTransactionVal * 1.5) : 10
  return (
    <ChartContainer
      config={{
        net_income: {
          label: 'Penghasilan Bersih',
          color: 'var(--chart-1)',
        },
        expense: {
          label: 'Pengeluaran',
          color: 'var(--chart-2)',
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
        />
        <YAxis
          yAxisId="axis_trx"
          orientation="right"
          domain={[0, yAxisMax]}
        />

        <ChartTooltip
          cursor={false}
          content={(
            <ChartTooltipContent
              formatter={(value, _name, item) => {
                if (item.dataKey === 'net_income') {
                  return formatRupiah(Number(value))
                }
                if (item.dataKey === 'expense') {
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
          dataKey="net_income"
          yAxisId="axis_revenue"
          fill="var(--color-net_income)"
          radius={[4, 4, 0, 0]}
          barSize={20}
        />
        <Bar
          dataKey="expense"
          yAxisId="axis_revenue"
          fill="var(--color-expense)"
          radius={[4, 4, 0, 0]}
          barSize={20}
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

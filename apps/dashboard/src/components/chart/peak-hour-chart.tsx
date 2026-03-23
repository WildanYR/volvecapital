import type { AllStatistic } from '@/dashboard/services/statistic.service'
import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../ui/chart'

export function PeakHourChart({ data }: { data: AllStatistic['peakHour'] }) {
  const yAxisMax = useMemo(() => {
    if (!data || data.length === 0) return 10
    const maxVal = Math.max(...data.map((d) => Number(d.transaction_count || 0)))
    return maxVal > 0 ? Math.round(maxVal * 1.2) : 10
  }, [data])

  return (
    <ChartContainer
      config={{
        transaction_count: {
          label: 'Transaksi',
          color: 'var(--chart-2)',
        },
      }}
    >
      <BarChart accessibilityLayer data={data}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="hour"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tickFormatter={(value) => `${value}:00`}
        />
        <YAxis tickLine={false} axisLine={false} domain={[0, yAxisMax]} />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent labelFormatter={(label) => `${label}:00`} />}
        />
        <Bar
          dataKey="transaction_count"
          fill="var(--color-transaction_count)"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ChartContainer>
  )
}

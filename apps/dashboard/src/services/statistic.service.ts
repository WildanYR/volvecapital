import z from 'zod'
import { generateApiFetch, parseApiResponse } from '@/dashboard/lib/api-fetch.util'

export const AllStatisticFilterSchema = z.object({
  range: z.enum(['week', 'month', '3months', '1year']).optional(),
})

export type AllStatisticFilter = z.infer<typeof AllStatisticFilterSchema>

interface BaseRevenueStatistic {
  date?: string
  net_income: number
  expense: number
  transaction_count: number
  created_at: Date
  updated_at: Date
}

export interface RevenueStatistic {
  period: BaseRevenueStatistic
  daily: Array<BaseRevenueStatistic>
}

interface ProductSalesStatistic {
  product_variant_id: string
  items_sold: number
  product_variant: {
    id: string
    name: string
    product: { id: string, name: string }
  }
}

interface PlatformStatistic {
  platform: string
  transaction_count: number
}

interface PeakHourStatistic {
  hour: number
  transaction_count: number
}

export interface AllStatistic {
  revenue: RevenueStatistic
  product: Array<ProductSalesStatistic>
  platform: Array<PlatformStatistic>
  peakHour: Array<PeakHourStatistic>
}

export function statisticServiceGenerator(apiUrl: string, accessToken: string, tenantId: string) {
  const getAllStatistic = async (
    filter?: AllStatisticFilter,
    signal?: AbortSignal,
  ): Promise<AllStatistic> => {
    const response = await generateApiFetch(
      apiUrl,
      accessToken,
      tenantId,
      '/statistic',
      { ...filter, signal },
    )
    if (!response.ok) {
      const errorData = await parseApiResponse(response)
      const errorMessage = Array.isArray(errorData.message)
        ? errorData.message[0]
        : errorData.message
      throw new Error(errorMessage || 'Failed to fetch all statistic')
    }

    const data = (await response.json()) as AllStatistic
    return {
      ...data,
      revenue: {
        period: {
          ...data.revenue.period,
          net_income: Number.parseInt(data.revenue.period.net_income as any),
          expense: Number.parseInt(data.revenue.period.expense as any),
          created_at: new Date(data.revenue.period.created_at),
          updated_at: new Date(data.revenue.period.updated_at),
        },
        daily: data.revenue.daily.map(item => ({
          ...item,
          net_income: Number.parseInt(item.net_income as any),
          expense: Number.parseInt(item.expense as any),
          created_at: new Date(item.created_at),
          updated_at: new Date(item.updated_at),
        })),
      },
    }
  }

  return { getAllStatistic }
}

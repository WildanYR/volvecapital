import z from 'zod'
import { generateApiFetch } from '@/dashboard/lib/api-fetch.util'

export const AllStatisticFilterSchema = z.object({
  year: z.string().optional(),
  month: z.string().optional(),
})

export type AllStatisticFilter = z.infer<typeof AllStatisticFilterSchema>

interface BaseStatistic {
  date: string
  type: string
  created_at: Date
  updated_at: Date
}

interface BaseRevenueStatistic extends BaseStatistic {
  total_revenue: number
  transaction_count: number
}

export interface RevenueStatistic {
  today: BaseRevenueStatistic
  month: BaseRevenueStatistic
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
  ): Promise<AllStatistic> => {
    const response = await generateApiFetch(
      apiUrl,
      accessToken,
      tenantId,
      '/statistic',
      { filter },
    )
    if (!response.ok) {
      const errorData = await response.json()
      const errorMessage = Array.isArray(errorData.message)
        ? errorData.message[0]
        : errorData.message
      throw new Error(errorMessage || 'Failed to fetch all statistic')
    }

    const data = (await response.json()) as AllStatistic
    return {
      ...data,
      revenue: {
        today: {
          ...data.revenue.today,
          total_revenue: Number.parseInt(data.revenue.today.total_revenue as any),
          created_at: new Date(data.revenue.today.created_at),
          updated_at: new Date(data.revenue.today.updated_at),
        },
        month: {
          ...data.revenue.month,
          total_revenue: Number.parseInt(data.revenue.month.total_revenue as any),
          created_at: new Date(data.revenue.month.created_at),
          updated_at: new Date(data.revenue.month.updated_at),
        },
        daily: data.revenue.daily.map(item => ({
          ...item,
          total_revenue: Number.parseInt(item.total_revenue as any),
          created_at: new Date(item.created_at),
          updated_at: new Date(item.updated_at),
        })),
      },
    }
  }

  return { getAllStatistic }
}

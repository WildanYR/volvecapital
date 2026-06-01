import z from 'zod'
import { generateApiFetch, parseApiResponse } from '@/dashboard/lib/api-fetch.util'

export const AllStatisticFilterSchema = z.object({
  filter: z.enum([
    'realtime',
    'today',
    'yesterday',
    'last_7_days',
    'last_30_days',
    'custom_day',
    'custom_week',
    'custom_month',
    'custom_year',
  ]).optional(),
  date: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  year: z.string().optional(),
  month: z.string().optional(),
  product_variant_id: z.string().optional(),
  platform: z.string().optional(),
})

export type AllStatisticFilter = z.infer<typeof AllStatisticFilterSchema>

export interface StatisticSummary {
  total_revenue: number
  revenue_percentage?: number
  total_capital_price: number
  gross_profit: number
  profit_percentage?: number
  transaction_count: number
  transaction_percentage?: number
}

export interface RevenueChartData {
  bucket: string
  total_revenue: number
  transaction_count: number
}

export interface PeakHourChartData {
  hour: number
  transaction_count: number
}

export interface PlatformChartData {
  platform: string
  transaction_count: number
  total_revenue: number
}

export interface ProductChartData {
  product_variant_id: string
  product_name: string
  variant_name: string
  items_sold: number
}

export interface AllStatistic {
  summary: StatisticSummary
  charts: {
    revenue: Array<RevenueChartData>
    peakHour: Array<PeakHourChartData>
    platform: Array<PlatformChartData>
    products: Array<ProductChartData>
    revenue_details?: Array<any>
    capital_details?: Array<any>
  }
  meta: {
    filter: string
    granularity: string
    start: string
    end: string
  }
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
      { ...filter, signal } as any,
    )
    if (!response.ok) {
      const errorData = await parseApiResponse(response)
      const errorMessage = Array.isArray(errorData.message)
        ? errorData.message[0]
        : errorData.message
      throw new Error(errorMessage || 'Failed to fetch all statistic')
    }

    const data = (await response.json()) as AllStatistic
    return data
  }

  return { getAllStatistic }
}

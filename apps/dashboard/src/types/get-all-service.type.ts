import type { z } from 'zod'
import type { OrderByParams } from './order-by.type'
import { OrderBySchema } from './order-by.type'
import { PaginationSchema } from './pagination.type'

export const BaseQueryParamsSchema = PaginationSchema.merge(OrderBySchema)

export type BaseQueryParams = z.infer<typeof BaseQueryParamsSchema>

export interface IPaginationData {
  currentPage: number
  totalPage: number
  limit: number
  totalItems: number
}

export interface IPaginateOrderResponse<T> {
  items: Array<T>
  paginationData: IPaginationData
  orderData: OrderByParams
}

export type GetAllServiceFn<TData, TFilter> = (
  params: BaseQueryParams & { filter?: TFilter },
) => Promise<IPaginateOrderResponse<TData>>

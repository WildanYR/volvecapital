import type { } from '@/dashboard/types/get-all-service.type'
import { z } from 'zod'
import { generateApiFetch, parseApiResponse } from '@/dashboard/lib/api-fetch.util'
import { BaseQueryParamsSchema } from '@/dashboard/types/get-all-service.type'

export const ShopFilterSchema = z.object({
  name: z.string().optional(),
  platform: z.string().optional(),
})

export type ShopFilter = z.infer<typeof ShopFilterSchema>

export const GetShopParamsSchema = BaseQueryParamsSchema.merge(
  ShopFilterSchema,
)

export interface Shop {
  id: string
  name: string
  platform: string
}

export interface CreateShopPayload {
  name: string
  platform: string
}

export interface UpdateShopPayload {
  name?: string
  platform?: string
}

export function ShopServiceGenerator(apiUrl: string, accessToken: string, tenantId: string) {
  const getAllShop = async (params?: Record<string, any>): Promise<Shop[]> => {
    const response = await generateApiFetch(
      apiUrl,
      accessToken,
      tenantId,
      '/shop',
      params,
    )
    if (!response.ok) {
      const errorData = await parseApiResponse(response)
      const errorMessage = Array.isArray(errorData.message)
        ? errorData.message[0]
        : errorData.message
      throw new Error(errorMessage || 'Failed to fetch Shop')
    }

    return response.json()
  }

  const getShopById = async (shopId: string, signal?: AbortSignal) => {
    const response = await generateApiFetch(
      apiUrl,
      accessToken,
      tenantId,
      `/shop/${shopId}`,
      { signal },
    )
    if (!response.ok) {
      const errorData = await response.json()
      const errorMessage = Array.isArray(errorData.message)
        ? errorData.message[0]
        : errorData.message
      throw new Error(errorMessage || 'Failed to fetch shop')
    }

    return response.json()
  }

  const createShop = async (
    payload: CreateShopPayload,
  ) => {
    const response = await generateApiFetch(
      apiUrl,
      accessToken,
      tenantId,
      '/shop',
      undefined,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
    )

    if (!response.ok) {
      const errorData = await response.json()
      const errorMessage = Array.isArray(errorData.message)
        ? errorData.message[0]
        : errorData.message
      throw new Error(errorMessage || 'Failed to create shop')
    }

    return response.json()
  }

  const updateShop = async (
    shopId: string,
    payload: UpdateShopPayload,
  ) => {
    const response = await generateApiFetch(
      apiUrl,
      accessToken,
      tenantId,
      `/shop/${shopId}`,
      undefined,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
    )

    if (!response.ok) {
      const errorData = await response.json()
      const errorMessage = Array.isArray(errorData.message)
        ? errorData.message[0]
        : errorData.message
      throw new Error(errorMessage || 'Failed to update shop')
    }

    return response.json()
  }

  const deleteShop = async (shopId: string) => {
    const response = await generateApiFetch(
      apiUrl,
      accessToken,
      tenantId,
      `/shop/${shopId}`,
      undefined,
      {
        method: 'DELETE',
      },
    )

    if (!response.ok) {
      const errorData = await response.json()
      const errorMessage = Array.isArray(errorData.message)
        ? errorData.message[0]
        : errorData.message
      throw new Error(errorMessage || 'Failed to delete shop')
    }
  }

  return {
    getAllShop,
    getShopById,
    createShop,
    updateShop,
    deleteShop,
  }
}

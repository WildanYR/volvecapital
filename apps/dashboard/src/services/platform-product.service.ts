import type { ProductVariant } from './product.service'
import type { GetAllServiceFn } from '@/dashboard/types/get-all-service.type'
import { z } from 'zod'
import { generateApiFetch, parseApiResponse } from '@/dashboard/lib/api-fetch.util'
import { BaseQueryParamsSchema } from '@/dashboard/types/get-all-service.type'

export const PlatformProductFilterSchema = z.object({
  name: z.string().optional(),
  platform: z.string().optional(),
  platform_product_id: z.string().optional(),
  product_variant_id: z.string().optional(),
  variant: z.string().optional(),
})

export type PlatformProductFilter = z.infer<typeof PlatformProductFilterSchema>

export const GetPlatformProductParamsSchema = BaseQueryParamsSchema.merge(
  PlatformProductFilterSchema,
)

export interface PlatformProduct {
  id: string
  name: string
  platform: string
  platform_product_id?: string
  product_variant_id: string
  variant?: string
  product_variant: ProductVariant
}

export interface CreatePlatformProductPayload {
  name: string
  platform: string
  platform_product_id?: string
  product_variant_id: string
  variant?: string
}

export interface UpdatePlatformProductPayload {
  name?: string
  platform?: string
  platform_product_id?: string
  product_variant_id?: string
  variant?: string
}

export function PlatformProductServiceGenerator(apiUrl: string, accessToken: string, tenantId: string) {
  const getAllPlatformProduct: GetAllServiceFn<
    PlatformProduct,
    PlatformProductFilter
  > = async (params) => {
    const response = await generateApiFetch(
      apiUrl,
      accessToken,
      tenantId,
      '/platform-product',
      params,
    )
    if (!response.ok) {
      const errorData = await parseApiResponse(response)
      const errorMessage = Array.isArray(errorData.message)
        ? errorData.message[0]
        : errorData.message
      throw new Error(errorMessage || 'Failed to fetch Platform Product')
    }

    return response.json()
  }

  const getPlatformProductById = async (platformProductId: string, signal?: AbortSignal) => {
    const response = await generateApiFetch(
      apiUrl,
      accessToken,
      tenantId,
      `/platform-product/${platformProductId}`,
      { signal },
    )
    if (!response.ok) {
      const errorData = await response.json()
      const errorMessage = Array.isArray(errorData.message)
        ? errorData.message[0]
        : errorData.message
      throw new Error(errorMessage || 'Failed to fetch platform product')
    }

    return response.json()
  }

  const createPlatformProduct = async (
    payload: CreatePlatformProductPayload,
  ) => {
    const response = await generateApiFetch(
      apiUrl,
      accessToken,
      tenantId,
      '/platform-product',
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
      throw new Error(errorMessage || 'Failed to create platform product')
    }

    return response.json()
  }

  const updatePlatformProduct = async (
    platformProductId: string,
    payload: UpdatePlatformProductPayload,
  ) => {
    const response = await generateApiFetch(
      apiUrl,
      accessToken,
      tenantId,
      `/platform-product/${platformProductId}`,
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
      throw new Error(errorMessage || 'Failed to update platform product')
    }

    return response.json()
  }

  const deletePlatformProduct = async (platformProductId: string) => {
    const response = await generateApiFetch(
      apiUrl,
      accessToken,
      tenantId,
      `/platform-product/${platformProductId}`,
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
      throw new Error(errorMessage || 'Failed to delete email')
    }
  }

  return {
    getAllPlatformProduct,
    getPlatformProductById,
    createPlatformProduct,
    updatePlatformProduct,
    deletePlatformProduct,
  }
}

import type { GetAllServiceFn } from '@/dashboard/types/get-all-service.type'
import { z } from 'zod'
import { generateApiFetch, parseApiResponse } from '@/dashboard/lib/api-fetch.util'
import { largestWholeUnit } from '@/dashboard/lib/time-converter.util'
import { BaseQueryParamsSchema } from '@/dashboard/types/get-all-service.type'

export const ProductFilterSchema = z.object({
  name: z.string().optional(),
})

export const ProductVariantFilterSchema = z.object({
  name: z.string().optional(),
  product: z.string().optional(),
})

export type ProductFilter = z.infer<typeof ProductFilterSchema>
export type ProductVariantFilter = z.infer<typeof ProductVariantFilterSchema>

export const GetProductsParamsSchema
  = BaseQueryParamsSchema.merge(ProductFilterSchema)

export const GetProductVariantsParamsSchema = BaseQueryParamsSchema.merge(
  ProductVariantFilterSchema,
)
export type GetProductVariantsParams = z.infer<
  typeof GetProductVariantsParamsSchema
>

export interface ProductVariant {
  id: string
  name: string
  duration: number
  duration_unit: string
  interval: number
  interval_unit: string
  cooldown: number
  cooldown_unit: string
  copy_template?: string
  product_id: string
  product?: {
    id: string
    name: string
  }
}

export interface Product {
  id: string
  name: string
  variants: Array<ProductVariant>
}

export interface CreateProductVariantPayload {
  product_id?: string
  name: string
  duration: number
  interval: number
  cooldown: number
  copy_template?: string
}

export interface CreateProductPayload {
  name: string
  variants: Array<CreateProductVariantPayload>
}

export interface UpdateProductVariantPayload {
  name?: string
  duration?: number
  interval?: number
  cooldown?: number
  copy_template?: string
}

export interface UpdateProductPayload {
  name: string
}

export function ProductServiceGenerator(apiUrl: string, accessToken: string, tenantId: string) {
  const getAllProduct: GetAllServiceFn<Product, ProductFilter> = async (
    params,
  ) => {
    const response = await generateApiFetch(
      apiUrl,
      accessToken,
      tenantId,
      '/product',
      params,
    )
    if (!response.ok) {
      const errorData = await parseApiResponse(response)
      const errorMessage = Array.isArray(errorData.message)
        ? errorData.message[0]
        : errorData.message
      throw new Error(errorMessage || 'Failed to fetch product')
    }

    const data = await response.json()
    const products = data.items?.length
      ? (data.items as Array<Product>).map(p => ({
          id: p.id,
          name: p.name,
          variants: p.variants.map((v) => {
            const [duration, duration_unit] = largestWholeUnit(v.duration)
            const [interval, interval_unit] = largestWholeUnit(v.interval)
            const [cooldown, cooldown_unit] = largestWholeUnit(v.cooldown)

            return {
              ...v,
              duration,
              duration_unit,
              interval,
              interval_unit,
              cooldown,
              cooldown_unit,
            }
          }),
        }))
      : []
    return {
      ...data,
      items: products,
    }
  }

  const getAllProductVariant: GetAllServiceFn<
    ProductVariant,
    ProductVariantFilter
  > = async (params) => {
    const response = await generateApiFetch(
      apiUrl,
      accessToken,
      tenantId,
      '/product-variant',
      params,
    )
    if (!response.ok) {
      const errorData = await response.json()
      const errorMessage = Array.isArray(errorData.message)
        ? errorData.message[0]
        : errorData.message
      throw new Error(errorMessage || 'Failed to fetch product variant')
    }
    return response.json()
  }

  const getProductById = async (productId: string, signal?: AbortSignal): Promise<Product> => {
    const response = await generateApiFetch(
      apiUrl,
      accessToken,
      tenantId,
      `/product/${productId}`,
      { signal },
    )
    if (!response.ok) {
      const errorData = await response.json()
      const errorMessage = Array.isArray(errorData.message)
        ? errorData.message[0]
        : errorData.message
      throw new Error(errorMessage || 'Failed to fetch product')
    }

    const product: Product = await response.json()
    return {
      ...product,
      variants: product.variants.map((v) => {
        const [duration, duration_unit] = largestWholeUnit(v.duration)
        const [interval, interval_unit] = largestWholeUnit(v.interval)
        const [cooldown, cooldown_unit] = largestWholeUnit(v.cooldown)

        return {
          ...v,
          duration,
          duration_unit,
          interval,
          interval_unit,
          cooldown,
          cooldown_unit,
        }
      }),
    }
  }

  const createNewProduct = async (
    payload: CreateProductPayload,
  ): Promise<Product> => {
    const response = await generateApiFetch(
      apiUrl,
      accessToken,
      tenantId,
      '/product/with-variant',
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
      throw new Error(errorMessage || 'Failed to create product')
    }

    return response.json()
  }

  const createNewProductVariant = async (
    payload: CreateProductVariantPayload,
  ): Promise<ProductVariant> => {
    const response = await generateApiFetch(
      apiUrl,
      accessToken,
      tenantId,
      '/product-variant',
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
      throw new Error(errorMessage || 'Failed to create product variant')
    }

    return response.json()
  }

  const updateProduct = async (
    productId: string,
    payload: UpdateProductPayload,
  ): Promise<Product> => {
    const response = await generateApiFetch(
      apiUrl,
      accessToken,
      tenantId,
      `/product/${productId}`,
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
      throw new Error(errorMessage || 'Failed to update product')
    }

    return response.json()
  }

  const updateProductVariant = async (
    productVariantId: string,
    payload: UpdateProductVariantPayload,
  ): Promise<ProductVariant> => {
    const response = await generateApiFetch(
      apiUrl,
      accessToken,
      tenantId,
      `/product-variant/${productVariantId}`,
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
      throw new Error(errorMessage || 'Failed to update product variant')
    }

    return response.json()
  }

  const deleteProduct = async (productId: string): Promise<void> => {
    const response = await generateApiFetch(
      apiUrl,
      accessToken,
      tenantId,
      `/product/${productId}`,
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
      throw new Error(errorMessage || 'Failed to delete product')
    }
  }

  const deleteProductVariant = async (
    productVariantId: string,
  ): Promise<void> => {
    const response = await generateApiFetch(
      apiUrl,
      accessToken,
      tenantId,
      `/product-variant/${productVariantId}`,
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
      throw new Error(errorMessage || 'Failed to delete product variant')
    }
  }

  return {
    getAllProduct,
    getAllProductVariant,
    getProductById,
    createNewProduct,
    createNewProductVariant,
    updateProduct,
    updateProductVariant,
    deleteProduct,
    deleteProductVariant,
  }
}

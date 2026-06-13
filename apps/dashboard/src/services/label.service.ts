import { generateApiFetch, parseApiResponse } from '@/dashboard/lib/api-fetch.util'

export interface Label {
  id: string;
  name: string;
  color?: string;
  product_variant_id: string;
}

export function LabelServiceGenerator(
  apiUrl: string,
  accessToken: string,
  tenantId: string,
) {
  return {
    create: async (data: { name: string; color?: string; product_variant_id: string }): Promise<Label> => {
      const response = await generateApiFetch(
        apiUrl,
        accessToken,
        tenantId,
        '/labels',
        undefined,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        },
      )
      if (!response.ok) {
        const errorData = await parseApiResponse(response)
        throw new Error(errorData.message || 'Failed to create label')
      }
      const result = await parseApiResponse(response)
      return result
    },

    findAll: async (productVariantId: string): Promise<Label[]> => {
      const response = await generateApiFetch(
        apiUrl,
        accessToken,
        tenantId,
        `/labels?product_variant_id=${productVariantId}`,
      )
      if (!response.ok) {
        const errorData = await parseApiResponse(response)
        throw new Error(errorData.message || 'Failed to fetch labels')
      }
      const result = await parseApiResponse(response)
      return result
    },

    remove: async (id: string): Promise<void> => {
      const response = await generateApiFetch(
        apiUrl,
        accessToken,
        tenantId,
        `/labels/${id}`,
        undefined,
        {
          method: 'DELETE',
        },
      )
      if (!response.ok) {
        const errorData = await parseApiResponse(response)
        throw new Error(errorData.message || 'Failed to delete label')
      }
    },
  }
}

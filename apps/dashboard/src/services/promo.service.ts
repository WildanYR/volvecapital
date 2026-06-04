import { generateApiFetch, parseApiResponse } from '@/dashboard/lib/api-fetch.util'

export function PromoServiceGenerator(apiUrl: string, accessToken: string, tenantId: string) {
  const list = async (params: { page?: number, limit?: number, search?: string } = {}) => {
    const response = await generateApiFetch(apiUrl, accessToken, tenantId, '/promo', params)
    if (!response.ok) {
      const errorData = await parseApiResponse(response)
      throw new Error(errorData.message || 'Failed to fetch promo codes')
    }
    return response.json()
  }

  const getOne = async (id: string) => {
    const response = await generateApiFetch(apiUrl, accessToken, tenantId, `/promo/${id}`)
    if (!response.ok) {
      const errorData = await parseApiResponse(response)
      throw new Error(errorData.message || 'Failed to fetch promo code')
    }
    return response.json()
  }

  const create = async (data: any) => {
    const response = await generateApiFetch(apiUrl, accessToken, tenantId, '/promo', undefined, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      const errorData = await parseApiResponse(response)
      throw new Error(errorData.message || 'Failed to create promo code')
    }
    return response.json()
  }

  const update = async (id: string, data: any) => {
    const response = await generateApiFetch(apiUrl, accessToken, tenantId, `/promo/${id}`, undefined, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      const errorData = await parseApiResponse(response)
      throw new Error(errorData.message || 'Failed to update promo code')
    }
    return response.json()
  }

  const remove = async (id: string) => {
    const response = await generateApiFetch(apiUrl, accessToken, tenantId, `/promo/${id}`, undefined, {
      method: 'DELETE',
    })
    if (!response.ok) {
      const errorData = await parseApiResponse(response)
      throw new Error(errorData.message || 'Failed to remove promo code')
    }
    return response.json()
  }

  return { list, getOne, create, update, remove }
}

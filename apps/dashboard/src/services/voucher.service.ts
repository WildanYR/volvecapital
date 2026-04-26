import { generateApiFetch, parseApiResponse } from '@/dashboard/lib/api-fetch.util'

export function VoucherServiceGenerator(apiUrl: string, accessToken: string, tenantId: string) {
  const generate = async (data: {
    product_variant_id: string
    buyer_name: string
    buyer_email: string
    buyer_whatsapp: string
  }) => {
    const response = await generateApiFetch(apiUrl, accessToken, tenantId, '/voucher/generate', undefined, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await parseApiResponse(response)
      throw new Error(errorData.message || 'Failed to generate voucher')
    }

    return response.json()
  }

  const list = async (params: { page?: number; limit?: number; search?: string; status?: string } = {}) => {
    const response = await generateApiFetch(apiUrl, accessToken, tenantId, '/voucher', params)
    if (!response.ok) {
      const errorData = await parseApiResponse(response)
      throw new Error(errorData.message || 'Failed to fetch vouchers')
    }
    return response.json()
  }

  const getStatistics = async () => {
    const response = await generateApiFetch(apiUrl, accessToken, tenantId, '/voucher/statistics')
    if (!response.ok) {
      const errorData = await parseApiResponse(response)
      throw new Error(errorData.message || 'Failed to fetch voucher statistics')
    }
    return response.json()
  }

  return { generate, list, getStatistics }
}

import { generateApiFetch, parseApiResponse } from '@/dashboard/lib/api-fetch.util'

export interface TenantSettings {
  [key: string]: string
}

export function SettingServiceGenerator(apiUrl: string, accessToken: string, tenantId: string) {
  const getSettings = async (signal?: AbortSignal): Promise<TenantSettings> => {
    const response = await generateApiFetch(
      apiUrl,
      accessToken,
      tenantId,
      '/setting',
      { signal },
    )
    if (!response.ok) {
      const errorData = await parseApiResponse(response)
      const errorMessage = Array.isArray(errorData.message)
        ? errorData.message[0]
        : errorData.message
      throw new Error(errorMessage || 'Failed to fetch settings')
    }

    return response.json()
  }

  const updateSetting = async (key: string, value: string): Promise<void> => {
    const response = await generateApiFetch(
      apiUrl,
      accessToken,
      tenantId,
      '/setting',
      undefined,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value }),
      },
    )

    if (!response.ok) {
      const errorData = await parseApiResponse(response)
      const errorMessage = Array.isArray(errorData.message)
        ? errorData.message[0]
        : errorData.message
      throw new Error(errorMessage || 'Failed to update setting')
    }
  }

  const updateBulkSettings = async (settings: Record<string, string>): Promise<void> => {
    const response = await generateApiFetch(
      apiUrl,
      accessToken,
      tenantId,
      '/setting/bulk',
      undefined,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      },
    )

    if (!response.ok) {
      const errorData = await parseApiResponse(response)
      const errorMessage = Array.isArray(errorData.message)
        ? errorData.message[0]
        : errorData.message
      throw new Error(errorMessage || 'Failed to update bulk settings')
    }
  }

  return {
    getSettings,
    updateSetting,
    updateBulkSettings,
  }
}

import type { BaseQueryParams } from '@/dashboard/types/get-all-service.type'

export function generateApiUrl<T extends Record<string, any>>(
  apiUrl: string,
  endpointUrl: string,
  params?: BaseQueryParams & T,
): string {
  const url = new URL(`${apiUrl}${endpointUrl}`)
  const searchParams = new URLSearchParams()

  if (params) {
    for (const key of Object.keys(params)) {
      const value = params[key as keyof T]

      if (Array.isArray(value)) {
        ;(value as Array<string | number | boolean | null | undefined>).forEach(
          (item) => {
            if (item !== null && item !== undefined && String(item) !== '') {
              searchParams.append(key, String(item))
            }
          },
        )
      }
      else if (
        value !== null
        && value !== undefined
        && String(value) !== ''
      ) {
        searchParams.append(key, String(value))
      }
    }
  }

  url.search = searchParams.toString()

  return url.toString()
}

export async function generateApiFetch<T extends Record<string, any>>(
  apiUrl: string,
  accessToken: string,
  tenantId: string,
  endpoint: string,
  params?: BaseQueryParams & T & { signal?: AbortSignal },
  fetchInit?: RequestInit,
) {
  const { signal, ...restParams } = params || {}
  const url = generateApiUrl(apiUrl, endpoint, Object.keys(restParams).length > 0 ? restParams : undefined)

  const token = `VC ${accessToken}`
  const headers = fetchInit?.headers
    ? { ...fetchInit.headers, 'authorization': token, 'x-tenant-id': tenantId }
    : { 'authorization': token, 'x-tenant-id': tenantId }

  const response = await fetch(url, { ...fetchInit, headers, signal: signal || fetchInit?.signal })
  return response
}

export async function parseApiResponse(response: Response) {
  const contentType = response.headers.get('content-type')
  if (contentType && contentType.includes('application/json')) {
    try {
      return await response.json()
    }
    catch {
      return { message: response.statusText }
    }
  }
  return { message: await response.text() || response.statusText }
}

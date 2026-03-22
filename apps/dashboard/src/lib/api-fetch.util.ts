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
  params?: BaseQueryParams & T,
  fetchInit?: RequestInit,
) {
  const url = generateApiUrl(apiUrl, endpoint, params)

  const token = `VC ${accessToken}`
  const headers = fetchInit?.headers
    ? { ...fetchInit.headers, 'authorization': token, 'x-tenant-id': tenantId }
    : { 'authorization': token, 'x-tenant-id': tenantId }

  const response = await fetch(url, { ...fetchInit, headers })
  return response
}

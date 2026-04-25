import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface TenantSettings {
  [key: string]: string
}

export function useSettings(tenantId: string) {
  return useQuery({
    queryKey: ['settings', tenantId],
    queryFn: async () => {
      const { data } = await api.get<TenantSettings>('/public/settings')
      return data
    },
    enabled: !!tenantId,
  })
}

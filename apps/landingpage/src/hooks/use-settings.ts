import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface TenantSettings {
  [key: string]: string
}

export function useSettings(tenantId?: string | null) {
  return useQuery({
    queryKey: ['settings', tenantId || 'default'],
    queryFn: async () => {
      const { data } = await api.get<TenantSettings>('/public/settings')
      return data
    },
    enabled: true,
  })
}

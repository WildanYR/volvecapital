import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface ProductVariant {
  id: string
  name: string
  price: number
  duration: number
  duration_unit: string
  copy_template?: string
  description?: string
  strike_price?: number
}

export interface Product {
  id: string
  name: string
  slug: string
  variants: ProductVariant[]
}

export function useProducts(tenantId: string | null) {
  return useQuery({
    queryKey: ['products', tenantId],
    queryFn: async () => {
      if (!tenantId) return []
      const { data } = await api.get<Product[]>('/public/product')
      return data
    },
    enabled: !!tenantId,
  })
}

export interface StockStatus {
  product_variant_id: string
  product_name: string
  variant_name: string
  stock: number
  low_stock: boolean
}

export function publicStatsServiceGenerator(apiUrl: string, tenantId: string) {
  const getStockStatus = async (signal?: AbortSignal): Promise<StockStatus[]> => {
    const response = await fetch(`${apiUrl}/public/voucher/stock`, {
      headers: {
        'x-tenant-id': tenantId,
      },
      signal,
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch stock status')
    }

    return response.json()
  }

  return {
    getStockStatus,
  }
}

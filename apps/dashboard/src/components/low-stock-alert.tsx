'use client'

import { useQuery } from '@tanstack/react-query'
import { AlertCircle, PackageSearch } from 'lucide-react'
import { publicStatsServiceGenerator } from '@/dashboard/services/public-stats.service'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/dashboard/components/ui/alert'
import { Button } from '@/dashboard/components/ui/button'
import { Link } from '@tanstack/react-router'
import { useAuth } from '@/dashboard/context-providers/auth.provider'
import { API_URL } from '@/dashboard/constants/api-url.cont'

export function LowStockAlert() {
  const auth = useAuth()
  const publicStatsService = publicStatsServiceGenerator(API_URL, auth.tenant!.id)

  const { data: stockStats } = useQuery({
    queryKey: ['stockStats', auth.tenant!.id],
    queryFn: ({ signal }) => publicStatsService.getStockStatus(signal),
    refetchInterval: 60000, // Refresh every minute
  })

  const lowStockItems = stockStats?.filter(item => item.low_stock) ?? []

  if (lowStockItems.length === 0) return null

  return (
    <div className="space-y-4">
      {lowStockItems.map((item) => (
        <Alert key={item.product_variant_id} variant="destructive" className="bg-red-500/10 border-red-500/50">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="font-bold">Stok Hampir Habis!</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>
              Produk
              <span className="font-bold"> {item.product_name} - {item.variant_name} </span>
              tersisa
              <span className="font-bold text-lg"> {item.stock} </span>
              akun ready.
            </span>
            <Button size="sm" variant="outline" asChild className="border-red-500/50 hover:bg-red-500/20 text-red-500">
              <Link to="/dashboard/account/create">
                <PackageSearch className="mr-2 h-4 w-4" />
                Tambah Stok
              </Link>
            </Button>
          </AlertDescription>
        </Alert>
      ))}
    </div>
  )
}

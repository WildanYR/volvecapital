'use client'

import { useQuery } from '@tanstack/react-query'
import { Bell, AlertCircle, PackageSearch } from 'lucide-react'
import { publicStatsServiceGenerator } from '@/dashboard/services/public-stats.service'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/dashboard/components/ui/dropdown-menu'
import { Button } from '@/dashboard/components/ui/button'
import { Badge } from '@/dashboard/components/ui/badge'
import { Link } from '@tanstack/react-router'
import { useAuth } from '@/dashboard/context-providers/auth.provider'
import { API_URL } from '@/dashboard/constants/api-url.cont'

export function StockNotification() {
  const auth = useAuth()
  const publicStatsService = publicStatsServiceGenerator(API_URL, auth.tenant!.id)

  const { data: stockStats } = useQuery({
    queryKey: ['stockStats', auth.tenant!.id],
    queryFn: ({ signal }) => publicStatsService.getStockStatus(signal),
    refetchInterval: 60000, // Refresh every minute
  })

  const lowStockItems = stockStats?.filter(item => item.low_stock) ?? []
  const count = lowStockItems.length

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative cursor-pointer">
          <Bell className="h-5 w-5" />
          {count > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center rounded-full p-0 text-[10px] animate-pulse"
            >
              {count}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifikasi Stok</span>
          {count > 0 && (
            <Badge variant="outline" className="text-red-500 border-red-500/50">
              {count} Urgent
            </Badge>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup className="max-h-[300px] overflow-y-auto">
          {count === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Semua stok aman. Tidak ada notifikasi.
            </div>
          ) : (
            lowStockItems.map((item) => (
              <DropdownMenuItem key={item.product_variant_id} className="p-4 focus:bg-red-500/10">
                <div className="flex flex-col gap-2 w-full">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
                    <div className="flex flex-col">
                      <p className="text-sm font-semibold leading-none">
                        Stok Hampir Habis!
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 text-pretty">
                        {item.product_name} - {item.variant_name} tersisa <span className="text-red-500 font-bold">{item.stock}</span> akun.
                      </p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" asChild className="w-full mt-1 border-red-500/50 hover:bg-red-500/20 text-red-500 h-7 text-xs">
                    <Link to="/dashboard/account/create">
                      <PackageSearch className="mr-2 h-3.3 w-3.3" />
                      Tambah Stok
                    </Link>
                  </Button>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

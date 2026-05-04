import { useMutation, useQuery } from '@tanstack/react-query'
import { Bell, AlertCircle, PackageSearch, Wallet, CheckCircle2, Copy, Trash2 } from 'lucide-react'
import { publicStatsServiceGenerator } from '@/dashboard/services/public-stats.service'
import { AccountServiceGenerator } from '@/dashboard/services/account.service'
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
import { toast } from 'sonner'

export function StockNotification() {
  const auth = useAuth()
  const publicStatsService = publicStatsServiceGenerator(API_URL, auth.tenant!.id)
  const accountService = AccountServiceGenerator(
    API_URL, 
    auth.tenant?.accessToken || '', 
    auth.tenant?.id || ''
  )

  // 1. Query Stok Habis
  const { data: stockStats } = useQuery({
    queryKey: ['stockStats', auth.tenant!.id],
    queryFn: ({ signal }) => publicStatsService.getStockStatus(signal),
    refetchInterval: 60000, 
  })

  // 2. Query Pending Topup (Setiap 5 detik agar responsif)
  const { data: pendingTopups, refetch: refetchTopups } = useQuery({
    queryKey: ['pendingTopups', auth.tenant?.id],
    queryFn: () => accountService.getPendingTopups(),
    refetchInterval: 5000, 
    enabled: !!auth.tenant?.accessToken,
  })

  // 3. Mutation Konfirmasi Bayar
  const confirmTopupMutation = useMutation({
    mutationFn: (accountId: string) => accountService.confirmTopup(accountId),
    onSuccess: () => {
      toast.success('Konfirmasi pembayaran berhasil dikirim!')
      refetchTopups()
    },
    onError: (error: any) => {
      toast.error(`Gagal konfirmasi: ${error.message}`)
    },
  })

  // 4. Mutation Batalkan Reload
  const cancelTopupMutation = useMutation({
    mutationFn: (accountId: string) => accountService.cancelTopup(accountId),
    onSuccess: () => {
      toast.warning('Reload berhasil dibatalkan.')
      refetchTopups()
    },
    onError: (error: any) => {
      toast.error(`Gagal membatalkan: ${error.message}`)
    },
  })

  const handleCopy = (text: string) => {
    const numbersOnly = text.replace(/\D/g, '')
    if (numbersOnly) {
      navigator.clipboard.writeText(numbersOnly)
      toast.success(`Berhasil disalin: ${numbersOnly}`)
    } else {
      navigator.clipboard.writeText(text)
      toast.success(`Berhasil disalin: ${text}`)
    }
  }

  const lowStockItems = stockStats?.filter(item => item.low_stock) ?? []
  const topups = pendingTopups ?? []
  
  const count = lowStockItems.length + topups.length

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
      <DropdownMenuContent align="end" className="w-85 max-h-[500px] overflow-hidden flex flex-col">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifikasi Panel</span>
          {count > 0 && (
            <Badge variant="outline" className="text-red-500 border-red-500/50">
              {count} Urgent
            </Badge>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuGroup className="flex-1 overflow-y-auto">
          {count === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground italic">
              Tidak ada notifikasi mendesak saat ini.
            </div>
          ) : (
            <>
              {/* SEKSI 1: KONFIRMASI PEMBAYARAN (PENDING TOPUPS) */}
              {topups.map((topup) => (
                <div key={topup.accountId} className="p-4 border-b border-white/5 bg-red-500/5">
                  <div className="flex gap-3">
                    <div className="bg-red-600/20 p-2 rounded-lg h-fit">
                      <Wallet className="h-4 w-4 text-red-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <p className="text-xs font-bold text-red-500 uppercase tracking-wider">
                          Konfirmasi Pembayaran
                        </p>
                        <button 
                          onClick={() => cancelTopupMutation.mutate(topup.accountId)}
                          className="text-slate-500 hover:text-red-500 transition-colors p-1"
                          title="Batalkan Reload"
                          disabled={cancelTopupMutation.isPending}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <p className="text-sm font-semibold truncate mt-1">
                        {topup.email}
                      </p>
                      <div className="flex items-center justify-between mt-1 bg-slate-800/50 p-1.5 rounded border border-white/5">
                        <span className="text-[11px] font-mono text-slate-300">
                          {topup.billing || 'Default'}
                        </span>
                        <button 
                          onClick={() => handleCopy(topup.billing || '')}
                          className="hover:text-red-500 transition-colors"
                          title="Salin Angka"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      
                      <Button 
                        size="sm" 
                        className="w-full mt-3 bg-red-600 hover:bg-red-700 text-white font-bold h-8 text-xs"
                        onClick={() => confirmTopupMutation.mutate(topup.accountId)}
                        disabled={confirmTopupMutation.isPending || cancelTopupMutation.isPending}
                      >
                        {confirmTopupMutation.isPending ? (
                          "Memproses..."
                        ) : (
                          <>
                            <CheckCircle2 className="mr-2 h-3.5 w-3.5" />
                            Saya Sudah Bayar
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {/* SEKSI 2: STOK HABIS */}
              {lowStockItems.map((item) => (
                <DropdownMenuItem key={item.product_variant_id} className="p-4 focus:bg-red-500/10">
                  <div className="flex flex-col gap-2 w-full">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-slate-400 mt-0.5" />
                      <div className="flex flex-col">
                        <p className="text-sm font-semibold leading-none text-slate-200">
                          Stok Hampir Habis!
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-1 text-pretty">
                          {item.product_name} - {item.variant_name} tersisa <span className="text-red-500 font-bold">{item.stock}</span> akun.
                        </p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" asChild className="w-full mt-1 border-white/10 hover:bg-white/5 text-slate-300 h-7 text-xs">
                      <Link to="/dashboard/account/create">
                        <PackageSearch className="mr-2 h-3.5 w-3.5" />
                        Tambah Stok
                      </Link>
                    </Button>
                  </div>
                </DropdownMenuItem>
              ))}
            </>
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

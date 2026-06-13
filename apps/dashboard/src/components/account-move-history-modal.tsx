import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/dashboard/components/ui/dialog'
import { Button } from '@/dashboard/components/ui/button'
import { AccountServiceGenerator } from '@/dashboard/services/account.service'
import { useAuth } from '@/dashboard/context-providers/auth.provider'
import { API_URL } from '@/dashboard/constants/api-url.cont'
import { History, ArrowRight, ArrowRightLeft } from 'lucide-react'
import { formatDateIdStandard } from '@/dashboard/lib/time-converter.util'

interface AccountMoveHistoryModalProps {
  productId: string
  productName: string
}

export function AccountMoveHistoryModal({ productId, productName }: AccountMoveHistoryModalProps) {
  const [open, setOpen] = useState(false)
  const [page, setPage] = useState(1)
  const auth = useAuth()

  useEffect(() => {
    if (open) {
      setPage(1)
    }
  }, [open])

  const accountService = AccountServiceGenerator(
    API_URL,
    auth.tenant!.accessToken,
    auth.tenant!.id,
  )

  const { data: history, isLoading } = useQuery({
    queryKey: ['account-move-history-product', productId],
    queryFn: () => accountService.getProductMoveHistory(productId),
    enabled: open,
  })

  const itemsPerPage = 10
  const totalPages = history ? Math.ceil(history.length / itemsPerPage) : 0
  const paginatedHistory = history ? history.slice((page - 1) * itemsPerPage, page * itemsPerPage) : []

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="cursor-pointer">
          <History className="size-4 mr-2" />
          Riwayat Perpindahan
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl sm:max-w-5xl w-[90vw] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Audit Trail: Riwayat Perpindahan User</DialogTitle>
          <DialogDescription className="hidden">
            Daftar riwayat perpindahan user untuk produk ini.
          </DialogDescription>
          <p className="text-sm text-muted-foreground">Produk: {productName}</p>
        </DialogHeader>

        <div className="flex-1 overflow-hidden mt-2">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <p className="text-muted-foreground animate-pulse">Memuat riwayat...</p>
            </div>
          ) : history && history.length > 0 ? (
            <>
              <div className="h-full max-h-[60vh] md:max-h-[70vh] overflow-y-auto overflow-x-hidden pr-2 md:pr-4 relative scroll-smooth touch-pan-y">
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                {paginatedHistory.map((record) => {
                  return (
                    <div key={record.id} className="relative flex items-start group is-active">
                      {/* Timeline Dot */}
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border border-background bg-secondary text-primary shadow shrink-0 z-10 relative">
                        <ArrowRightLeft className="size-4" />
                      </div>
                      
                      {/* Card Content */}
                      <div className="ml-4 w-full p-4 rounded border bg-card shadow-sm flex flex-col md:flex-row items-start md:items-center gap-4">
                        {/* Info Column */}
                        <div className="flex-1 space-y-1 min-w-[200px]">
                          <div className="font-bold text-sm text-foreground">
                            {record.account_user?.name || 'User Terhapus'}
                          </div>
                          <time className="block font-mono text-xs text-muted-foreground">
                            {formatDateIdStandard(record.created_at)}
                          </time>
                          <div className="text-sm text-muted-foreground italic mt-1">
                            Alasan: "{record.reason}"
                          </div>
                        </div>
                        
                        {/* Dari Akun */}
                        <div className="flex-1 w-full bg-secondary/50 p-3 rounded-md min-w-[180px]">
                          <span className="block text-[10px] uppercase text-muted-foreground font-semibold mb-1">Dari Akun</span>
                          <span className="text-sm font-semibold truncate block" title={record.from_account?.email?.email}>
                            {record.from_account?.email?.email || 'N/A'}
                          </span>
                          <span className="text-xs font-normal text-muted-foreground">({record.from_profile?.name || 'N/A'})</span>
                        </div>

                        {/* Arrow */}
                        <div className="hidden md:flex items-center justify-center shrink-0">
                          <ArrowRight className="size-5 text-muted-foreground" />
                        </div>

                        {/* Ke Akun */}
                        <div className="flex-1 w-full bg-secondary/50 p-3 rounded-md min-w-[180px]">
                          <span className="block text-[10px] uppercase text-muted-foreground font-semibold mb-1">Ke Akun</span>
                          <span className="text-sm font-semibold truncate block" title={record.to_account?.email?.email}>
                            {record.to_account?.email?.email || 'N/A'}
                          </span>
                          <span className="text-xs font-normal text-muted-foreground">({record.to_profile?.name || 'N/A'})</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-4 pt-4 border-t">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setPage(p => Math.max(1, p - 1))} 
                  disabled={page === 1}
                >
                  Sebelumnya
                </Button>
                <span className="text-sm text-muted-foreground">
                  Halaman {page} dari {totalPages}
                </span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
                  disabled={page === totalPages}
                >
                  Selanjutnya
                </Button>
              </div>
            )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <History className="size-12 mb-4 opacity-20" />
              <p>Belum ada riwayat perpindahan di produk ini.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/dashboard/components/ui/dialog'
import { Button } from '@/dashboard/components/ui/button'
import { ScrollArea } from '@/dashboard/components/ui/scroll-area'
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
  const auth = useAuth()

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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="cursor-pointer">
          <History className="size-4 mr-2" />
          Riwayat Perpindahan
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Audit Trail: Riwayat Perpindahan User</DialogTitle>
          <p className="text-sm text-muted-foreground">Produk: {productName}</p>
        </DialogHeader>

        <div className="flex-1 overflow-hidden mt-2">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <p className="text-muted-foreground animate-pulse">Memuat riwayat...</p>
            </div>
          ) : history && history.length > 0 ? (
            <ScrollArea className="h-full max-h-[60vh] pr-4">
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                {history.map((record) => {
                  return (
                    <div key={record.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      {/* Timeline Dot */}
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border border-background bg-secondary text-primary shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                        <ArrowRightLeft className="size-4" />
                      </div>
                      
                      {/* Card Content */}
                      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded border bg-card shadow-sm">
                        <div className="flex items-center justify-between space-x-2 mb-1">
                          <div className="font-bold text-sm text-foreground">
                            {record.account_user?.name || 'User Terhapus'}
                          </div>
                          <time className="font-mono text-xs text-muted-foreground">
                            {formatDateIdStandard(record.created_at)}
                          </time>
                        </div>
                        <div className="text-sm text-muted-foreground mb-3 italic">
                          Alasan: "{record.reason}"
                        </div>
                        
                        {/* Flow Diagram */}
                        <div className="flex flex-col space-y-2 bg-secondary/50 p-2 rounded-md">
                          <div className={`flex flex-col opacity-100 font-semibold`}>
                            <span className="text-xs uppercase text-muted-foreground">Dari Akun</span>
                            <span className="text-sm truncate" title={record.from_account?.email?.email}>
                              {record.from_account?.email?.email || 'N/A'} <br/>
                              <span className="text-xs font-normal">({record.from_profile?.name || 'N/A'})</span>
                            </span>
                          </div>
                          <div className="flex justify-center items-center">
                            <ArrowRight className="size-4 text-muted-foreground" />
                          </div>
                          <div className={`flex flex-col opacity-100 font-semibold`}>
                            <span className="text-xs uppercase text-muted-foreground">Ke Akun</span>
                            <span className="text-sm truncate" title={record.to_account?.email?.email}>
                              {record.to_account?.email?.email || 'N/A'} <br/>
                              <span className="text-xs font-normal">({record.to_profile?.name || 'N/A'})</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
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

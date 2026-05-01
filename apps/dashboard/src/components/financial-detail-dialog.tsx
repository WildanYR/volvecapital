import type { Account, AddAccountCapitalPayload } from '@/dashboard/services/account.service'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Banknote, Plus, History, TrendingUp, User } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/dashboard/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/dashboard/components/ui/dialog'
import { Input } from '@/dashboard/components/ui/input'
import { Label } from '@/dashboard/components/ui/label'
import { ScrollArea } from '@/dashboard/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/dashboard/components/ui/tabs'
import { formatRupiah } from '@/dashboard/lib/currency.util'
import { formatDateIdStandard } from '@/dashboard/lib/time-converter.util'
import { AccountServiceGenerator } from '@/dashboard/services/account.service'
import { API_URL } from '@/dashboard/constants/api-url.cont'
import { useAuth } from '@/dashboard/context-providers/auth.provider'
import { Pagination } from '@/dashboard/components/pagination'

interface FinancialDetailDialogProps {
  account: Account
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FinancialDetailDialog({
  account,
  open,
  onOpenChange,
}: FinancialDetailDialogProps) {
  const auth = useAuth()
  const queryClient = useQueryClient()
  const accountService = AccountServiceGenerator(
    API_URL,
    auth.tenant?.accessToken || '',
    auth.tenant?.id || '',
  )

  const [newCapital, setNewCapital] = useState<string>('')
  const [newNote, setNewNote] = useState<string>('')
  const [capitalPage, setCapitalPage] = useState(1)
  const [revenuePage, setRevenuePage] = useState(1)
  const itemsPerPage = 5

  const { data: details, isLoading } = useQuery({
    queryKey: ['account-financial-details', account?.id],
    queryFn: () => accountService.getFinancialDetails(account!.id),
    enabled: !!account && open,
  })

  const addCapitalMutation = useMutation({
    mutationFn: (payload: AddAccountCapitalPayload) =>
      accountService.addAccountCapital(account!.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account-financial-details', account?.id] })
      queryClient.invalidateQueries({ queryKey: ['account'] })
      setNewCapital('')
      setNewNote('')
      toast.success('Modal berhasil ditambahkan')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Gagal menambahkan modal')
    },
  })

  if (!account) return null

  const handleAddCapital = () => {
    const amount = Number.parseInt(newCapital)
    if (Number.isNaN(amount) || amount <= 0) {
      toast.error('Masukkan nominal modal yang valid')
      return
    }
    addCapitalMutation.mutate({ amount, note: newNote })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="md:min-w-[700px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="size-5 text-primary" />
            Detail Finansial - {account.email.email}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 mb-4 bg-muted/30 p-4 rounded-lg">
          <div className="space-y-1">
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Total Modal (Accumulated)</p>
            <p className="text-xl font-bold text-primary">{formatRupiah(account.total_capital || account.capital_price)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Total Pendapatan</p>
            <p className="text-xl font-bold text-green-600 dark:text-green-400">{formatRupiah(account.total_revenue || 0)}</p>
          </div>
        </div>

        <Tabs defaultValue="capital" className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="capital" className="flex items-center gap-2">
              <Banknote className="size-4" />
              Riwayat Modal
            </TabsTrigger>
            <TabsTrigger value="revenue" className="flex items-center gap-2">
              <History className="size-4" />
              Riwayat Pendapatan
            </TabsTrigger>
          </TabsList>

          <TabsContent value="capital" className="flex-1 flex flex-col min-h-0 pt-4">
            <div className="flex gap-2 mb-4 items-end">
              <div className="grid gap-1.5 flex-1">
                <Label htmlFor="amount" className="text-xs">Nominal Modal</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Contoh: 54000"
                  value={newCapital}
                  onChange={e => setNewCapital(e.target.value)}
                />
              </div>
              <div className="grid gap-1.5 flex-[2]">
                <Label htmlFor="note" className="text-xs">Catatan (Opsional)</Label>
                <Input
                  id="note"
                  placeholder="Catatan penggunaan modal..."
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                />
              </div>
              <Button 
                onClick={handleAddCapital} 
                disabled={addCapitalMutation.isPending}
                className="cursor-pointer"
              >
                <Plus className="size-4 mr-2" />
                Tambah
              </Button>
            </div>

            <ScrollArea className="flex-1 border rounded-md">
              <div className="p-4 space-y-4">
                {isLoading ? (
                  <p className="text-center text-sm text-muted-foreground py-10">Memuat riwayat modal...</p>
                ) : details?.capitals.length ? (
                  <div className="flex flex-col h-full">
                    <div className="space-y-3 flex-1">
                      {/* Initial Capital (from account.capital_price if exists) - Only on Page 1 or last? 
                          User wants latest data first, so initial capital (legacy) is at the end.
                      */}
                      
                      {(() => {
                        const allCapitals = [...details.capitals]
                        const totalItems = allCapitals.length + (account.capital_price > 0 ? 1 : 0)
                        const totalPages = Math.ceil(totalItems / itemsPerPage)
                        
                        // Combine legacy capital if exists (put at the end because it's oldest)
                        const combinedData = [...allCapitals]
                        if (account.capital_price > 0) {
                          // We use a dummy object for the legacy capital
                          (combinedData as any[]).push({ isLegacy: true, amount: account.capital_price })
                        }
                        
                        const startIndex = (capitalPage - 1) * itemsPerPage
                        const paginatedData = combinedData.slice(startIndex, startIndex + itemsPerPage)
                        
                        return (
                          <>
                            {paginatedData.map((cap: any, index) => (
                              cap.isLegacy ? (
                                <div key="legacy-cap" className="flex justify-between items-center p-3 bg-secondary/20 rounded-md border-l-4 border-secondary">
                                  <div>
                                    <p className="text-sm font-bold">{formatRupiah(cap.amount)}</p>
                                    <p className="text-[10px] text-muted-foreground">Modal Awal Akun (Legacy)</p>
                                  </div>
                                  <p className="text-[10px] font-medium opacity-70">-</p>
                                </div>
                              ) : (
                                <div key={cap.id} className="flex justify-between items-center p-3 bg-muted/50 rounded-md">
                                  <div>
                                    <p className="text-sm font-bold">{formatRupiah(cap.amount)}</p>
                                    <p className="text-[10px] text-muted-foreground">{cap.note || 'Tidak ada catatan'}</p>
                                  </div>
                                  <p className="text-[10px] font-medium opacity-70">
                                    {formatDateIdStandard(cap.created_at, true)}
                                  </p>
                                </div>
                              )
                            ))}
                            
                            {totalPages > 1 && (
                              <div className="pt-4 flex justify-center border-t mt-4">
                                <Pagination 
                                  currentPage={capitalPage} 
                                  totalPages={totalPages} 
                                  onPageChange={setCapitalPage} 
                                />
                              </div>
                            )}
                          </>
                        )
                      })()}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <p className="text-sm text-muted-foreground mb-1">Belum ada riwayat modal tambahan</p>
                    {account.capital_price > 0 ? (
                      <p className="text-[10px] font-medium">Hanya modal awal: {formatRupiah(account.capital_price)}</p>
                    ) : null}
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="revenue" className="flex-1 flex flex-col min-h-0 pt-4">
            <ScrollArea className="flex-1 border rounded-md">
              <div className="p-4 space-y-3">
                {isLoading ? (
                  <p className="text-center text-sm text-muted-foreground py-10">Memuat riwayat pendapatan...</p>
                ) : details?.revenues.length ? (
                  (() => {
                    const totalPages = Math.ceil(details.revenues.length / itemsPerPage)
                    const startIndex = (revenuePage - 1) * itemsPerPage
                    const paginatedRevenues = details.revenues.slice(startIndex, startIndex + itemsPerPage)
                    
                    return (
                      <>
                        <div className="space-y-3 flex-1">
                          {paginatedRevenues.map((rev) => (
                            <div key={rev.transaction_id} className="flex justify-between items-center p-3 bg-green-500/5 dark:bg-green-500/10 rounded-md border-l-4 border-green-500">
                              <div>
                                <p className="text-sm font-bold text-green-600 dark:text-green-400">{formatRupiah(rev.amount)}</p>
                                <div className="flex items-center gap-1 mt-0.5">
                                  <User className="size-3 text-muted-foreground" />
                                  <p className="text-[10px] font-medium">{rev.user_name}</p>
                                </div>
                              </div>
                              <p className="text-[10px] font-medium opacity-70 text-right">
                                {formatDateIdStandard(rev.date, true)}
                                <br />
                                <span className="text-[8px] uppercase tracking-tighter">ID: {rev.transaction_id.slice(-6)}</span>
                              </p>
                            </div>
                          ))}
                        </div>
                        
                        {totalPages > 1 && (
                          <div className="pt-4 flex justify-center border-t mt-4">
                            <Pagination 
                              currentPage={revenuePage} 
                              totalPages={totalPages} 
                              onPageChange={setRevenuePage} 
                            />
                          </div>
                        )}
                      </>
                    )
                  })()
                ) : (
                  <p className="text-center text-sm text-muted-foreground py-10">Belum ada riwayat pendapatan</p>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/dashboard/components/ui/dialog'
import { Button } from '@/dashboard/components/ui/button'
import { Label } from '@/dashboard/components/ui/label'
import { Textarea } from '@/dashboard/components/ui/textarea'
import { ScrollArea } from '@/dashboard/components/ui/scroll-area'
import { MoveRight, Loader2, Search, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/dashboard/components/ui/input'
import { AccountServiceGenerator } from '@/dashboard/services/account.service'
import type { AccountProfileUser } from '@/dashboard/services/account.service'
import { API_URL } from '@/dashboard/constants/api-url.cont'
import { useAuth } from '@/dashboard/context-providers/auth.provider'
import { formatDateIdStandard } from '@/dashboard/lib/time-converter.util'

interface MoveUserModalProps {
  user: AccountProfileUser
  currentAccountId: string
  trigger?: React.ReactNode
  onSuccess?: () => void
}

export function MoveUserModal({ user, trigger, onSuccess }: MoveUserModalProps) {
  const [open, setOpen] = useState(false)
  const [selectedAccountId, setSelectedAccountId] = useState<string>('')
  const [selectedProfileId, setSelectedProfileId] = useState<string>('')
  const [reason, setReason] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const queryClient = useQueryClient()
  const auth = useAuth()

  const accountService = AccountServiceGenerator(
    API_URL,
    auth.tenant!.accessToken,
    auth.tenant!.id,
  )

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Get recommendations
  const { data: recommendations, isLoading: isLoadingRecs } = useQuery({
    queryKey: ['move-recommendations', user.id],
    queryFn: () => accountService.getMoveRecommendations(user.id),
    enabled: open,
  })

  // Manual search
  const { data: searchResults, isLoading: isLoadingSearch } = useQuery({
    queryKey: ['accounts', debouncedSearch],
    queryFn: () => accountService.getAllAccount({ filter: { email: debouncedSearch }, page: 1, limit: 10 }),
    enabled: open && debouncedSearch.length >= 3,
  })

  const moveMutation = useMutation({
    mutationFn: () => accountService.moveUser(user.id, {
      to_account_id: selectedAccountId,
      to_profile_id: selectedProfileId,
      reason
    }),
    onSuccess: () => {
      toast.success('Berhasil memindah pengguna')
      setOpen(false)
      setSelectedAccountId('')
      setSelectedProfileId('')
      setReason('')
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['account'] })
      onSuccess?.()
    },
    onError: (error: any) => {
      toast.error(error.message || 'Gagal memindah pengguna')
    }
  })

  const handleSelectAccount = (accountId: string) => {
    setSelectedAccountId(accountId)
    setSelectedProfileId('') // reset profile selection
  }

  const selectedAccountDetails = 
    recommendations?.find((a: any) => a.id === selectedAccountId) || 
    searchResults?.items?.find((a: any) => a.id === selectedAccountId)

  const isSubmitting = moveMutation.isPending
  const isFormValid = selectedAccountId && selectedProfileId && reason.trim().length > 0

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="cursor-pointer text-xs group hover:bg-primary/10 hover:text-primary hover:border-primary">
            <MoveRight className="size-4 mr-1 group-hover:translate-x-0.5 transition-transform" />
            Pindah Akun
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col gap-0 p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle>Pindah Pengguna (Move User)</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            <div className="bg-muted/50 p-4 rounded-lg border flex justify-between items-center">
              <div>
                <p className="font-semibold">{user.name}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Berakhir: <span className="font-medium text-foreground">{formatDateIdStandard(user.expired_at)}</span>
                </p>
              </div>
              <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-medium">
                Data durasi akan dipertahankan
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-base">1. Pilih Akun Tujuan</Label>
              
              {!searchQuery && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm text-muted-foreground">Rekomendasi Cerdas (Smart Recommendations)</Label>
                  </div>
                  {isLoadingRecs ? (
                    <div className="flex items-center justify-center p-8 border rounded-lg border-dashed">
                      <Loader2 className="size-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : recommendations?.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic p-4 border rounded-lg border-dashed bg-secondary/20">
                      Tidak ada rekomendasi yang ditemukan. Gunakan pencarian di bawah.
                    </p>
                  ) : (
                    <div className="grid gap-2">
                      {recommendations?.map(acc => (
                        <div 
                          key={acc.id}
                          onClick={() => handleSelectAccount(acc.id)}
                          className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all ${selectedAccountId === acc.id ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:border-foreground/30'}`}
                        >
                          <div>
                            <p className="font-medium flex items-center gap-2">
                              {acc.email?.email || '-'}
                              {selectedAccountId === acc.id && <CheckCircle2 className="size-4 text-primary" />}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {acc.product_variant?.product?.name} - {acc.product_variant?.name} • 
                              Berakhir: {formatDateIdStandard(acc.batch_end_date)}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-medium px-2 py-1 bg-secondary rounded-full">
                              {acc.profile?.length || 0} Profil
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-3 pt-2">
                <Label className="text-sm text-muted-foreground">Pencarian Manual Lintas Varian</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input 
                    placeholder="Cari email akun..." 
                    className="pl-9"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
                
                {searchQuery && debouncedSearch.length >= 3 && (
                  <div className="mt-4 grid gap-2">
                    {isLoadingSearch ? (
                      <div className="flex justify-center p-4"><Loader2 className="size-5 animate-spin" /></div>
                    ) : searchResults?.items?.map((acc: any) => (
                      <div 
                        key={acc.id}
                        onClick={() => handleSelectAccount(acc.id)}
                        className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all ${selectedAccountId === acc.id ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:border-foreground/30'}`}
                      >
                        <div>
                          <p className="font-medium flex items-center gap-2">
                            {acc.email?.email || '-'}
                            {selectedAccountId === acc.id && <CheckCircle2 className="size-4 text-primary" />}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {acc.product_variant?.product?.name} - {acc.product_variant?.name} • 
                            Berakhir: {formatDateIdStandard(acc.batch_end_date)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {selectedAccountDetails && (
              <div className="space-y-4 pt-4 border-t">
                <Label className="text-base">2. Pilih Profil Tujuan</Label>
                <div className="grid grid-cols-2 gap-2">
                  {selectedAccountDetails.profile?.map((p: any) => {
                    const activeUsers = p.user?.filter((u: any) => u.status !== 'expired') || []
                    const isFull = activeUsers.length >= 1 // Visually indicate if > 0 users, but admin can still select
                    
                    return (
                      <div 
                        key={p.id}
                        onClick={() => setSelectedProfileId(p.id)}
                        className={`p-3 border rounded-lg cursor-pointer transition-all ${selectedProfileId === p.id ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:border-foreground/30'}`}
                      >
                        <div className="flex justify-between items-center">
                          <p className="font-medium text-sm">{p.name}</p>
                          {selectedProfileId === p.id && <CheckCircle2 className="size-4 text-primary" />}
                        </div>
                        <p className={`text-xs mt-2 font-medium ${isFull ? 'text-amber-500' : 'text-green-500'}`}>
                          {activeUsers.length} / {p.max_user} Pengguna Aktif
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="space-y-3 pt-4 border-t">
              <Label className="text-base">3. Alasan Pemindahan</Label>
              <Textarea 
                placeholder="Contoh: Akun limit screen, pengguna komplain tidak bisa masuk"
                value={reason}
                onChange={e => setReason(e.target.value)}
                rows={3}
                required
              />
            </div>
          </div>
        </ScrollArea>
        
        <div className="p-6 pt-4 border-t bg-muted/20 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
            Batal
          </Button>
          <Button 
            onClick={() => moveMutation.mutate()} 
            disabled={!isFormValid || isSubmitting}
            className="min-w-32"
          >
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : 'Simpan Kepindahan'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

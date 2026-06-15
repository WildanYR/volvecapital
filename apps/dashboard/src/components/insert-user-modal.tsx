import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/dashboard/components/ui/dialog'
import { Button } from '@/dashboard/components/ui/button'
import { Label } from '@/dashboard/components/ui/label'
import { Input } from '@/dashboard/components/ui/input'
import { ScrollArea } from '@/dashboard/components/ui/scroll-area'
import { AccountServiceGenerator } from '@/dashboard/services/account.service'
import { useDebounce } from 'use-debounce'
import { toast } from 'sonner'
import { UserPlus, Search, ArrowRight } from 'lucide-react'
import { formatDateIdStandard } from '@/dashboard/lib/time-converter.util'
import { API_URL } from '@/dashboard/constants/api-url.cont'
import type { Account, AccountProfile, AccountProfileUser } from '@/dashboard/services/account.service'
import { useAuth } from '@/dashboard/context-providers/auth.provider'

interface InsertUserModalProps {
  targetAccountId: string
  targetProfileId: string
  onSuccess?: () => void
}

export function InsertUserModal({ targetAccountId, targetProfileId, onSuccess }: InsertUserModalProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [reason, setReason] = useState('')
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [step, setStep] = useState<1 | 2>(1)

  const [debouncedSearch] = useDebounce(searchQuery, 500)
  const queryClient = useQueryClient()
  const auth = useAuth()

  const accountService = AccountServiceGenerator(
    API_URL,
    auth.tenant!.accessToken,
    auth.tenant!.id,
  )

  // Find accounts based on email
  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ['accounts-search-insert', debouncedSearch],
    queryFn: async () => {
      if (!debouncedSearch || debouncedSearch.length < 3) return null
      // Search by email
      const resultByEmail = await accountService.getAllAccount({
        limit: 10,
        page: 1,
        filter: { email: debouncedSearch },
      })
      
      // Search by user name
      const resultByUser = await accountService.getAllAccount({
        limit: 10,
        page: 1,
        filter: { user: debouncedSearch },
      })

      // Merge unique accounts
      const accountsMap = new Map<string, Account>()
      resultByEmail.items.forEach((acc: Account) => accountsMap.set(acc.id, acc))
      resultByUser.items.forEach((acc: Account) => accountsMap.set(acc.id, acc))

      return {
        ...resultByEmail,
        items: Array.from(accountsMap.values()),
      }
    },
    enabled: debouncedSearch.length >= 3,
  })

  const moveMutation = useMutation({
    mutationFn: async (allow_old_profile_generate: boolean) => {
      if (!selectedUserId) throw new Error('Pilih user terlebih dahulu')
      if (!reason) throw new Error('Alasan wajib diisi')
      
      return accountService.moveUser(selectedUserId, {
        to_account_id: targetAccountId,
        to_profile_id: targetProfileId,
        reason,
        allow_old_profile_generate,
      })
    },
    onSuccess: () => {
      toast.success('User berhasil diselipkan!')
      setOpen(false)
      setStep(1)
      resetForm()
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['account'] })
      queryClient.invalidateQueries({ queryKey: ['countAccount'] })
      onSuccess?.()
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || 'Gagal menyelipkan user')
    },
  })

  const resetForm = () => {
    setSearchQuery('')
    setReason('')
    setSelectedUserId(null)
  }

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) {
      resetForm()
      setStep(1)
    }
  }

  let selectedUserName = ''
  if (selectedUserId && searchResults) {
    for (const acc of searchResults.items) {
      for (const p of acc.profile || []) {
        const u = p.user?.find((u: AccountProfileUser) => u.id === selectedUserId)
        if (u) {
          selectedUserName = u.name
          break
        }
      }
      if (selectedUserName) break
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="cursor-pointer text-xs">
          <UserPlus className="size-4" />
          {' '}
          Selipkan User
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle>
            {step === 1 ? 'Selipkan User ke Profil Ini' : 'Konfirmasi Profil Lama'}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-y-auto">
          {step === 1 ? (
            <div className="flex flex-col gap-4 p-6">
          <div className="space-y-2">
            <Label>Cari Akun Asal (Berdasarkan Email)</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Ketik email akun atau nama user... (minimal 3 karakter)"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setSelectedUserId(null) // Reset selection when searching
                }}
                className="pl-9"
              />
            </div>
          </div>

          {isSearching && <p className="text-sm text-muted-foreground">Mencari...</p>}

          {searchResults && searchResults.items.length > 0 && (
            <ScrollArea className="h-[250px] border rounded-md p-2">
              <div className="space-y-4">
                {searchResults.items.map((account: Account) => {
                  // Filter out profiles with no active users to clean up UI
                  const profilesWithUsers = account.profile?.filter((p: AccountProfile) => p.user && p.user.length > 0) || []
                  
                  if (profilesWithUsers.length === 0) return null

                  return (
                    <div key={account.id} className="border p-3 rounded-md bg-secondary/20">
                      <p className="font-semibold text-sm mb-2">{account.email?.email || '-'}</p>
                      
                      <div className="space-y-2">
                        {profilesWithUsers.map((profile: AccountProfile) => (
                          <div key={profile.id} className="pl-2 border-l-2 border-primary/20">
                            <p className="text-xs text-muted-foreground font-medium mb-1">{profile.name}</p>
                            <div className="space-y-1">
                              {profile.user!.map((user: AccountProfileUser) => (
                                <div 
                                  key={user.id}
                                  onClick={() => setSelectedUserId(user.id)}
                                  className={`flex justify-between items-center p-2 rounded-md cursor-pointer transition-colors border ${
                                    selectedUserId === user.id 
                                      ? 'bg-primary/10 border-primary' 
                                      : 'bg-background hover:bg-secondary border-border'
                                  }`}
                                >
                                  <div>
                                    <p className="text-sm font-medium">{user.name}</p>
                                    <p className="text-xs text-muted-foreground">Exp: {formatDateIdStandard(user.expired_at)}</p>
                                  </div>
                                  {selectedUserId === user.id && (
                                    <ArrowRight className="h-4 w-4 text-primary" />
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          )}

          {searchResults && searchResults.items.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">Tidak ada akun yang ditemukan.</p>
          )}

          {selectedUserId && (
            <div className="space-y-2 mt-4 pt-4 border-t">
              <Label>Alasan Penyelipan <span className="text-red-500">*</span></Label>
              <Input
                placeholder="Contoh: Akun sebelumnya bermasalah"
                value={reason}
                onChange={e => setReason(e.target.value)}
              />
            </div>
          )}
            </div>
          ) : (
            <div className="p-6 space-y-6">
              <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-lg text-center">
                <h3 className="text-lg font-bold text-amber-500 mb-2">Peringatan Profil Lama</h3>
                <p className="text-sm">
                  Pengguna <strong>{selectedUserName || 'Terpilih'}</strong> akan dipindahkan ke sini.
                  Apakah Anda mengizinkan profil asalnya di akun lama untuk diisi (digenerate) kembali oleh pengguna baru?
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Pilih "Jangan Izinkan" jika Anda ingin membiarkan profil lamanya kosong agar durasi akun tersebut tidak bergeser jika dimasuki orang baru.
                </p>
              </div>
            </div>
          )}
        </ScrollArea>

        <div className="p-6 pt-4 border-t bg-muted/20 flex justify-end gap-3">
          {step === 1 ? (
            <>
              <Button variant="outline" onClick={() => { setOpen(false); setStep(1); }} disabled={moveMutation.isPending}>
                Batal
              </Button>
              <Button 
                onClick={() => setStep(2)} 
                disabled={!selectedUserId || !reason || moveMutation.isPending}
                className="min-w-32"
              >
                Lanjutkan
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setStep(1)} disabled={moveMutation.isPending}>
                Kembali
              </Button>
              <Button 
                variant="default"
                onClick={() => moveMutation.mutate(true)} 
                disabled={moveMutation.isPending}
                className="bg-green-600 hover:bg-green-700 text-white min-w-32"
              >
                Izinkan
              </Button>
              <Button 
                variant="destructive"
                onClick={() => moveMutation.mutate(false)} 
                disabled={moveMutation.isPending}
                className="min-w-32"
              >
                Jangan Izinkan
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

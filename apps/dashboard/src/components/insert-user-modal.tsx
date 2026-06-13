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
}

export function InsertUserModal({ targetAccountId, targetProfileId }: InsertUserModalProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [reason, setReason] = useState('')
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

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
    mutationFn: async () => {
      if (!selectedUserId) throw new Error('Pilih user terlebih dahulu')
      if (!reason) throw new Error('Alasan wajib diisi')
      
      return accountService.moveUser(selectedUserId, {
        to_account_id: targetAccountId,
        to_profile_id: targetProfileId,
        reason,
      })
    },
    onSuccess: () => {
      toast.success('User berhasil diselipkan!')
      setOpen(false)
      resetForm()
      queryClient.invalidateQueries({ queryKey: ['account'] })
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
      <DialogContent className="max-w-xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Selipkan User ke Profil Ini</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 mt-4 overflow-hidden">
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

        <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={moveMutation.isPending}>
            Batal
          </Button>
          <Button 
            onClick={() => moveMutation.mutate()} 
            disabled={!selectedUserId || !reason || moveMutation.isPending}
          >
            {moveMutation.isPending ? 'Memproses...' : 'Selipkan User'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

import type { AccountProfileUser, UpdateAccountUserPayload } from '@/dashboard/services/account.service'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { AccountUserUpdateForm } from '@/dashboard/components/forms/account-user-update-form'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/dashboard/components/ui/dialog'
import { API_URL } from '@/dashboard/constants/api-url.cont'
import { useAuth } from '@/dashboard/context-providers/auth.provider'
import { AccountServiceGenerator } from '@/dashboard/services/account.service'

export function PagesAccountIndexDialogUserUpdate({ open, selectedAccountUser, onOpenChange, onProfileStateChange}: { open?: boolean, selectedAccountUser?: AccountProfileUser, onOpenChange: (value: boolean) => void, onProfileStateChange?: (value: boolean) => void }) {
  const auth = useAuth()
  const accountService = AccountServiceGenerator(
    API_URL,
    auth.tenant!.accessToken,
    auth.tenant!.id,
  )
  const queryClient = useQueryClient()

  const accountUserUpdateMutation = useMutation({
    mutationFn: (payload: UpdateAccountUserPayload) =>
      accountService.updateAccountUser(selectedAccountUser!.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account'] })
      toast.success('User Akun berhasil diedit.')
      if (onProfileStateChange) {
        onProfileStateChange(false)
      }
    },
    onError: (error) => {
      toast.error(`Gagal update user akun: ${error.message}`)
    },
    onSettled: () => {
      onOpenChange(false)
    },
  })

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="md:min-w-4xl">
        <DialogHeader>
          <DialogTitle>Ubah User Akun</DialogTitle>
        </DialogHeader>
        {selectedAccountUser
          ? (
              <AccountUserUpdateForm
                initialData={selectedAccountUser}
                isPending={accountUserUpdateMutation.isPending}
                onSubmit={(value) => { accountUserUpdateMutation.mutate(value) }}
              />
            )
          : (
              <div className="flex items-center justify-center">
                <p>Tidak ada user terseleksi</p>
              </div>
            )}
      </DialogContent>
    </Dialog>
  )
}

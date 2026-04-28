import type { AccountProfile, CreateAccountProfilePayload, UpdateAccountProfilePayload } from '@/dashboard/services/account.service'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { AccountProfileForm } from '@/dashboard/components/forms/account-profile.form'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/dashboard/components/ui/dialog'
import { API_URL } from '@/dashboard/constants/api-url.cont'
import { useAuth } from '@/dashboard/context-providers/auth.provider'
import { convertMetadataObjectToString } from '@/dashboard/lib/metadata-converter'
import { AccountServiceGenerator } from '@/dashboard/services/account.service'

export function PagesAccountIndexDialogEditProfile({ open, selectedAccountProfile, selectedAccountId, onOpenChange}: { open?: boolean, selectedAccountProfile?: AccountProfile, selectedAccountId?: string, onOpenChange: (value: boolean) => void }) {
  const auth = useAuth()
  const accountService = AccountServiceGenerator(
    API_URL,
    auth.tenant!.accessToken,
    auth.tenant!.id,
  )
  const queryClient = useQueryClient()

  const accountProfileCreateMutation = useMutation({
    mutationFn: (payload: CreateAccountProfilePayload) =>
      accountService.createNewAccountProfile(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account'] })
      toast.success('Profil Akun berhasil dibuat.')
    },
    onError: (error) => {
      toast.error(`Gagal membuat profil akun: ${error.message}`)
    },
    onSettled: () => {
      onOpenChange(false)
    },
  })

  const accountProfileEditMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: UpdateAccountProfilePayload
    }) => accountService.updateAccountProfile(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account'] })
      toast.success('Profil Akun berhasil diperbarui.')
    },
    onError: (error) => {
      toast.error(`Gagal memperbarui profil akun: ${error.message}`)
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
          <DialogTitle>
            {selectedAccountProfile ? 'Ubah' : 'Buat'}
            {' '}
            Profil Akun
          </DialogTitle>
        </DialogHeader>
        <AccountProfileForm
          initialData={selectedAccountProfile}
          isPending={accountProfileCreateMutation.isPending || accountProfileEditMutation.isPending}
          onSubmit={(value) => {
            const payload = {
              ...value,
              max_user: value.max_user ? Number.parseInt(value.max_user) : 0,
              metadata: convertMetadataObjectToString(value.metadata),
            }
            if (selectedAccountProfile) {
              accountProfileEditMutation.mutate({
                id: selectedAccountProfile.id,
                payload,
              })
            }
            else {
              accountProfileCreateMutation.mutate({
                ...payload,
                account_id: selectedAccountId,
              })
            }
          }}
        />
      </DialogContent>
    </Dialog>
  )
}

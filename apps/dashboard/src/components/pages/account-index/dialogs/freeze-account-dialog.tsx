import type { Account, FreezeAccountPayload } from '@/dashboard/services/account.service'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { AccountFreezeForm } from '@/dashboard/components/forms/account-freeze.form'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/dashboard/components/ui/dialog'
import { API_URL } from '@/dashboard/constants/api-url.cont'
import { useAuth } from '@/dashboard/context-providers/auth.provider'
import { AccountServiceGenerator } from '@/dashboard/services/account.service'

export function PagesAccountIndexDialogFreeze({ open, selectedAccount, onOpenChange}: { open?: boolean, selectedAccount?: Account, onOpenChange: (value: boolean) => void }) {
  const auth = useAuth()
  const accountService = AccountServiceGenerator(
    API_URL,
    auth.tenant!.accessToken,
    auth.tenant!.id,
  )
  const queryClient = useQueryClient()

  const accountFreezeMutation = useMutation({
    mutationFn: (payload: FreezeAccountPayload) =>
      accountService.freezeAccount(selectedAccount!.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account'] })
      toast.success('Akun berhasil dibekukan.')
    },
    onError: (error) => {
      toast.error(`Gagal mebekukan akun: ${error.message}`)
    },
    onSettled: () => {
      onOpenChange(false)
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="md:min-w-4xl">
        <DialogHeader>
          <DialogTitle>Bekukan Akun</DialogTitle>
        </DialogHeader>
        <AccountFreezeForm
          isPending={accountFreezeMutation.isPending}
          onSubmit={(value) => { accountFreezeMutation.mutate(value) }}
        />
      </DialogContent>
    </Dialog>
  )
}

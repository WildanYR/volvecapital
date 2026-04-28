import type { Account, UpdateAccountPayload } from '@/dashboard/services/account.service'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { AccountEditForm } from '@/dashboard/components/forms/account-edit.form'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/dashboard/components/ui/dialog'
import { API_URL } from '@/dashboard/constants/api-url.cont'
import { useAuth } from '@/dashboard/context-providers/auth.provider'
import { AccountServiceGenerator } from '@/dashboard/services/account.service'

export function PagesAccountIndexDialogEdit({ open, selectedAccount, onOpenChange}: { open?: boolean, selectedAccount?: Account, onOpenChange: (value: boolean) => void }) {
  const auth = useAuth()
  const accountService = AccountServiceGenerator(
    API_URL,
    auth.tenant!.accessToken,
    auth.tenant!.id,
  )
  const queryClient = useQueryClient()

  const accountEditMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: UpdateAccountPayload
    }) => accountService.updateAccount(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account'] })
      toast.success(' Akun berhasil diperbarui.')
    },
    onError: (error) => {
      toast.error(`Gagal memperbarui akun: ${error.message}`)
    },
    onSettled: () => {
      onOpenChange(false)
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="md:min-w-4xl">
        <DialogHeader>
          <DialogTitle>Ubah Akun</DialogTitle>
        </DialogHeader>
        <AccountEditForm
          initialData={selectedAccount}
          isPending={accountEditMutation.isPending}
          onSubmit={(value) => {
            accountEditMutation.mutate({
              id: selectedAccount!.id,
              payload: {
                ...value,
                email_id: value.email_id,
                product_variant_id: value.product_variant_id,
              },
            })
          }}
        />
      </DialogContent>
    </Dialog>
  )
}

import type { Account, UpdateAccountModifierPayload } from '@/dashboard/services/account.service'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { AccountModifierEditForm } from '@/dashboard/components/forms/account-modifier-edit.form'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/dashboard/components/ui/dialog'
import { API_URL } from '@/dashboard/constants/api-url.cont'
import { useAuth } from '@/dashboard/context-providers/auth.provider'
import { convertMetadataObjectToString } from '@/dashboard/lib/metadata-converter'
import { AccountServiceGenerator } from '@/dashboard/services/account.service'

export function PagesAccountIndexDialogEditModifier({ open, selectedAccount, onOpenChange}: { open?: boolean, selectedAccount?: Account, onOpenChange: (value: boolean) => void }) {
  const auth = useAuth()
  const accountService = AccountServiceGenerator(
    API_URL,
    auth.tenant!.accessToken,
    auth.tenant!.id,
  )
  const queryClient = useQueryClient()

  const accountModifierEditMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: UpdateAccountModifierPayload
    }) => accountService.updateAccountModifier(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account'] })
      toast.success('Modifier Akun berhasil diperbarui.')
    },
    onError: (error) => {
      toast.error(`Gagal memperbarui modifier akun: ${error.message}`)
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
          <DialogTitle>Ubah Modifier Akun</DialogTitle>
        </DialogHeader>
        <AccountModifierEditForm
          initialData={selectedAccount?.modifier}
          isPending={accountModifierEditMutation.isPending}
          onSubmit={(value) => {
            const payload = {
              modifier: value.modifier.map(mod => ({
                action: mod.action,
                modifier_id: mod.modifier_id,
                metadata: mod.metadata
                  ? convertMetadataObjectToString(mod.metadata)
                  : undefined,
              })),
            }
            accountModifierEditMutation.mutate({ id: selectedAccount!.id, payload })
          }}
        />
      </DialogContent>
    </Dialog>
  )
}

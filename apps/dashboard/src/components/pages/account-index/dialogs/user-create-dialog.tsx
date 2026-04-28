import type { AccountUserFormInitialData } from '@/dashboard/components/forms/account-user.form'
import type { CreateAccountUserPayload } from '@/dashboard/services/account.service'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { AccountUserForm } from '@/dashboard/components/forms/account-user.form'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/dashboard/components/ui/dialog'
import { API_URL } from '@/dashboard/constants/api-url.cont'
import { useAuth } from '@/dashboard/context-providers/auth.provider'
import { handleCopyTemplate } from '@/dashboard/lib/copy-template'
import { AccountServiceGenerator } from '@/dashboard/services/account.service'

export function PagesAccountIndexDialogUserCreate({ open, initialFormData, onOpenChange, onProfileStateChange}: { open?: boolean, initialFormData?: AccountUserFormInitialData, onOpenChange: (value: boolean) => void, onProfileStateChange?: (value: boolean) => void }) {
  const auth = useAuth()
  const accountService = AccountServiceGenerator(
    API_URL,
    auth.tenant!.accessToken,
    auth.tenant!.id,
  )
  const queryClient = useQueryClient()

  const accountUserCreateMutation = useMutation({
    mutationFn: (payload: CreateAccountUserPayload) =>
      accountService.createNewAccountUser(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['account'] })
      toast.success('User Akun berhasil dibuat.')
      handleCopyTemplate(data.profile, data.account)
      if (onProfileStateChange) {
        onProfileStateChange(false)
      }
    },
    onError: (error) => {
      toast.error(`Gagal membuat user akun: ${error.message}`)
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
          <DialogTitle>Buat User Akun</DialogTitle>
        </DialogHeader>
        <AccountUserForm
          initialData={initialFormData}
          isPending={accountUserCreateMutation.isPending}
          onSubmit={(value) => {
            accountUserCreateMutation.mutate({
              ...value,
              product_variant_id: value.product_variant_id,
              account_profile_id: value.account_profile_id
                ? value.account_profile_id
                : undefined,
              transaction: value.transaction
                ? {
                    platform: value.transaction.platform,
                    total_price: Number.parseInt(value.transaction.total_price),
                  }
                : undefined,
            })
          }}
        />
      </DialogContent>
    </Dialog>
  )
}

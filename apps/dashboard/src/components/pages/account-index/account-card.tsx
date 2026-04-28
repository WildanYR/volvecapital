import type { Account } from '@/dashboard/services/account.service'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { BrushCleaning, CalendarClock, CircleQuestionMark, Cog, EllipsisVertical, Info, LockKeyholeOpen, Package, Pin, PinOff, SquarePen, SquareUser, Timer, TimerOff, Trash2, Wallet } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { API_URL } from '@/dashboard/constants/api-url.cont'
import { useGlobalAlertDialog } from '@/dashboard/context-providers/alert-dialog.provider'
import { useAuth } from '@/dashboard/context-providers/auth.provider'
import { formatDateIdStandard } from '@/dashboard/lib/time-converter.util'
import { AccountServiceGenerator } from '@/dashboard/services/account.service'
import { AccountStatus } from '../../account-status'
import { Button } from '../../ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../ui/dropdown-menu'
import { PagesAccountIndexDialogEdit } from './dialogs/edit-account-dialog'
import { PagesAccountIndexDialogEditModifier } from './dialogs/edit-account-modifier-dialog'
import { PagesAccountIndexDialogFreeze } from './dialogs/freeze-account-dialog'
import { PagesAccountIndexDialogProfile } from './dialogs/profile-dialog'

export function AccountCard({ account }: { account: Account }) {
  const auth = useAuth()
  const accountService = AccountServiceGenerator(
    API_URL,
    auth.tenant!.accessToken,
    auth.tenant!.id,
  )
  const queryClient = useQueryClient()
  const { showAlertDialog, hideAlertDialog } = useGlobalAlertDialog()

  const [dialogAccountEditOpen, setDialogAccountEditOpen] = useState(false)
  const [dialogAccountModifierOpen, setDialogAccountModifierOpen] = useState(false)
  const [dialogFreezeOpen, setDialogFreezeOpen] = useState(false)
  const [dialogProfileDetailOpen, setDialogProfileDetailOpen] = useState(false)

  const pinAccountMutation = useMutation({
    mutationFn: (payload: { accountId: string, pinned: boolean }) =>
      accountService.pinAccount(payload.accountId, payload.pinned),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account'] })
      toast.success('Akun Berhasil di Pin')
    },
    onError: (error) => {
      toast.error(`Akun Gagal di Pin: ${error.message}`)
    },
  })

  const accountUnfreezeMutation = useMutation({
    mutationFn: (accountId: string) =>
      accountService.unfreezeAccount(accountId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account'] })
      toast.success('Akun berhasil dicairkan.')
    },
    onError: (error) => {
      toast.error(`Gagal mencairkan akun: ${error.message}`)
    },
  })

  const accountDeleteMutation = useMutation({
    mutationFn: (id: string) => accountService.deleteAccount(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account'] })
      toast.success('Akun berhasil dihapus.')
    },
    onError: (error) => {
      toast.error(`Gagal menghapus akun: ${error.message}`)
    },
    onSettled: () => {
      hideAlertDialog()
    },
  })

  const accountClearMutation = useMutation({
    mutationFn: (id: string) => accountService.updateAccount(id, { status: 'ready' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account'] })
      toast.success('Akun berhasil dibersihkan.')
    },
    onError: (error) => {
      toast.error(`Gagal membersihkan akun: ${error.message}`)
    },
    onSettled: () => {
      hideAlertDialog()
    },
  })

  const handleDeleteAccount = () => {
    showAlertDialog({
      title: 'Yakin ingin menghapus Akun?',
      description: (
        <>
          Aksi tidak dapat dibatalkan. Ini akan menghapus akun
          <span className="font-bold">
            {' '}
            {account.email.email}
            {' '}
            (
            {account.product_variant.product?.name}
            {' '}
            {account.product_variant.name}
            )
            {' '}
          </span>
          secara permanen.
        </>
      ),
      confirmText: 'Hapus',
      isConfirming: accountDeleteMutation.isPending,
      onConfirm: () => accountDeleteMutation.mutate(account.id),
    })
  }

  const handleClearAccount = () => {
    showAlertDialog({
      title: 'Yakin ingin mereset Akun?',
      description: (
        <>
          Aksi tidak dapat dibatalkan. Ini akan mengubah status akun menjadi
          enable (siap diapakai user baru) dan mengubah status user aktif jadi
          expired pada akun:
          <span className="font-bold">
            {' '}
            {account.email.email}
            {' '}
            (
            {account.product_variant.product?.name}
            {' '}
            {account.product_variant.name}
            )
            {' '}
          </span>
        </>
      ),
      confirmText: 'Clear',
      isConfirming: accountClearMutation.isPending,
      onConfirm: () =>
        accountClearMutation.mutate(account.id),
    })
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex gap-2">
            {account.pinned ? <Pin className="size-6" /> : null}
            <p>{account.email.email}</p>
          </CardTitle>
          <CardDescription>
            <p>{account.account_password}</p>
          </CardDescription>
          <CardAction>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="cursor-pointer"
                >
                  <EllipsisVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center">
                <DropdownMenuItem
                  onSelect={() => { setDialogAccountEditOpen(true) }}
                >
                  <span>
                    <SquarePen />
                  </span>
                  {' '}
                  Update
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => { setDialogAccountModifierOpen(true) }}
                >
                  <span>
                    <Cog />
                  </span>
                  Modifier
                </DropdownMenuItem>
                {!account.pinned
                  ? (
                      <DropdownMenuItem
                        onSelect={() => { pinAccountMutation.mutate({ accountId: account.id, pinned: true }) }}
                      >
                        <span>
                          <Pin />
                        </span>
                        Pin
                      </DropdownMenuItem>
                    )
                  : (
                      <DropdownMenuItem
                        onSelect={() => { pinAccountMutation.mutate({ accountId: account.id, pinned: false }) }}
                      >
                        <span>
                          <PinOff />
                        </span>
                        Unpin
                      </DropdownMenuItem>
                    )}
                {!account.freeze_until
                  ? (
                      <DropdownMenuItem
                        onSelect={() => { setDialogFreezeOpen(true) }}
                      >
                        <span>
                          <TimerOff />
                        </span>
                        Freeze
                      </DropdownMenuItem>
                    )
                  : (
                      <DropdownMenuItem
                        onSelect={() => { accountUnfreezeMutation.mutate(account.id) }}
                      >
                        <span>
                          <Timer />
                        </span>
                        Unfreeze
                      </DropdownMenuItem>
                    )}
                <DropdownMenuItem
                  onSelect={() => handleDeleteAccount()}
                >
                  <span>
                    <Trash2 />
                  </span>
                  {' '}
                  Delete
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => handleClearAccount()}
                >
                  <span>
                    <BrushCleaning />
                  </span>
                  {' '}
                  Clear
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardAction>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4 text-muted-foreground">
            <div className="space-y-1 w-full px-3 border-l-2 border-secondary">
              <p className="text-xs inline-flex items-center gap-1">
                <Package className="size-4" />
                {' '}
                Produk
              </p>
              <p className="font-semibold text-sm">
                {account.product_variant.product?.name}
                {' '}
                {account.product_variant.name}
              </p>
            </div>
            <div className="space-y-1 w-full px-3 border-l-2 border-secondary">
              <p className="text-xs inline-flex items-center gap-1">
                <LockKeyholeOpen className="size-4" />
                {' '}
                Reset Password
              </p>
              <p className="font-semibold text-sm">
                {account.batch_end_date
                  ? formatDateIdStandard(account.batch_end_date)
                  : '-'}
              </p>
            </div>
            <div className="space-y-1 w-full px-3 border-l-2 border-secondary">
              <p className="text-xs inline-flex items-center gap-1">
                <CalendarClock className="size-4" />
                {' '}
                Subs End
              </p>
              <p className="font-semibold text-sm">
                {formatDateIdStandard(
                  account.subscription_expiry,
                  true,
                )}
              </p>
            </div>
            <div className="space-y-1 w-full px-3 border-l-2 border-secondary">
              <p className="text-xs inline-flex items-center gap-1">
                <Info className="size-4" />
                {' '}
                Status
              </p>
              <AccountStatus account={account} />
            </div>
            <div className="space-y-1 w-full px-3 border-l-2 border-secondary col-span-full">
              <p className="text-xs inline-flex items-center gap-1">
                <Wallet className="size-4" />
                {' '}
                Billing
              </p>
              <p className="font-semibold text-sm">
                {account.billing ?? '-'}
              </p>
            </div>
            <div className="space-y-1 w-full px-3 border-l-2 border-secondary col-span-full">
              <p className="text-xs inline-flex items-center gap-1">
                <CircleQuestionMark className="size-4" />
                {' '}
                Label
              </p>
              <p className="font-semibold text-sm">
                {account.label || '-'}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => { setDialogProfileDetailOpen(true) }}
            className="w-full cursor-pointer"
          >
            <SquareUser className="size-4" />
            {' '}
            Profil
            {' '}
            {`( ${account.profile.length || 0} )`}
          </Button>
        </CardContent>
      </Card>
      {/* Edit Account Dialog */}
      <PagesAccountIndexDialogEdit open={dialogAccountEditOpen} onOpenChange={setDialogAccountEditOpen} selectedAccount={account} />
      {/* Edit Modifier Dialog */}
      <PagesAccountIndexDialogEditModifier open={dialogAccountModifierOpen} onOpenChange={setDialogAccountModifierOpen} selectedAccount={account} />
      {/* Account Freeze Dialog */}
      <PagesAccountIndexDialogFreeze open={dialogFreezeOpen} onOpenChange={setDialogFreezeOpen} selectedAccount={account} />
      {/* Profile Detail Dialog */}
      <PagesAccountIndexDialogProfile open={dialogProfileDetailOpen} onOpenChange={setDialogProfileDetailOpen} selectedAccount={account} />
    </>
  )
}

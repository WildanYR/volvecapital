import type { AccountUserFormInitialData } from '@/dashboard/components/forms/account-user.form'
import type { Account, AccountProfile, AccountProfileUser } from '@/dashboard/services/account.service'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, ClockFading, Copy, EllipsisVertical, Plus, SquarePen, Trash2, UserPlus, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/dashboard/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/dashboard/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/dashboard/components/ui/dropdown-menu'
import { ScrollArea } from '@/dashboard/components/ui/scroll-area'
import { API_URL } from '@/dashboard/constants/api-url.cont'
import { useGlobalAlertDialog } from '@/dashboard/context-providers/alert-dialog.provider'
import { useAuth } from '@/dashboard/context-providers/auth.provider'
import { handleCopyTemplate } from '@/dashboard/lib/copy-template'
import { formatDateIdStandard } from '@/dashboard/lib/time-converter.util'
import { AccountServiceGenerator } from '@/dashboard/services/account.service'
import { PagesAccountIndexDialogEditProfile } from './edit-account-profile-dialog'
import { PagesAccountIndexDialogUserCreate } from './user-create-dialog'
import { PagesAccountIndexDialogUserUpdate } from './user-update-dialog'

export function PagesAccountIndexDialogProfile({ open, selectedAccount, onOpenChange}: { open?: boolean, selectedAccount?: Account, onOpenChange: (value: boolean) => void }) {
  const auth = useAuth()
  const accountService = AccountServiceGenerator(
    API_URL,
    auth.tenant!.accessToken,
    auth.tenant!.id,
  )
  const queryClient = useQueryClient()
  const { showAlertDialog, hideAlertDialog } = useGlobalAlertDialog()

  const [selectedAccountProfile, setSelectedAccountProfile]
    = useState<AccountProfile>()
  const [selectedAccountUser, setSelectedAccountUser] = useState<
      AccountProfileUser | undefined
  >(undefined)
  const [createUserFormData, setCreateUserFormData] = useState<AccountUserFormInitialData | undefined>(undefined)

  const [dialogAccountProfileOpen, setDialogAccountProfileOpen]
    = useState<boolean>(false)
  const [dialogAccountUserUpdateOpen, setDialogAccountUserUpdateOpen]
    = useState<boolean>(false)
  const [dialogCreateUserOpen, setDialogCreateUserOpen]
    = useState<boolean>(false)

  const handleOpenAccountProfileDialog = (
    accountProfile?: AccountProfile,
  ) => {
    if (accountProfile) {
      setSelectedAccountProfile(accountProfile)
    }
    else {
      setSelectedAccountProfile(undefined)
    }
    setDialogAccountProfileOpen(true)
  }

  const handleOpenCreateUserDialog = (
    profileId: string,
  ) => {
    setCreateUserFormData({
      product_variant_id: selectedAccount!.product_variant_id,
      product_variant: selectedAccount!.product_variant,
      account_profile_id: profileId,
    },
    )
    setDialogCreateUserOpen(true)
  }

  const handleOpenAccountUserUpdateDialog = (
    accountUser: AccountProfileUser,
  ) => {
    setSelectedAccountUser(accountUser)
    setDialogAccountUserUpdateOpen(true)
  }

  const expireAccountUserMutation = useMutation({
    mutationFn: (userId: string) =>
      accountService.updateAccountUser(userId, { status: 'expired' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account'] })
      toast.success('User Akun berhasil dihapus.')
    },
    onError: (error) => {
      toast.error(`Gagal hapus user akun: ${error.message}`)
    },
    onSettled: () => {
      hideAlertDialog()
    },
  })

  const handleExpireAccountUser = (user: AccountProfileUser) => {
    showAlertDialog({
      title: 'Yakin ingin menghapus User Akun?',
      description: (
        <>
          Aksi tidak dapat dibatalkan. Ini akan menghapus user akun
          <span className="font-bold">
            {' '}
            {user.name}
            {' '}
            pada akun
            {selectedAccount!.email.email}
            {' '}
            (
            {selectedAccount!.product_variant.product?.name}
            {' '}
            {selectedAccount!.product_variant.name}
            )
            {' '}
          </span>
          .
          {' '}
          <span className="italic font-bold">
            Menghapus/ Expire user akun tidak akan menghapus data di transaksi.
          </span>
        </>
      ),
      confirmText: 'Hapus',
      isConfirming: expireAccountUserMutation.isPending,
      onConfirm: () => expireAccountUserMutation.mutate(user.id),
    })
  }

  const accountProfileDeleteMutation = useMutation({
    mutationFn: (id: string) => accountService.deleteAccountProfile(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account'] })
      toast.success('Profil akun berhasil dihapus.')
    },
    onError: (error) => {
      toast.error(`Gagal menghapus profil akun: ${error.message}`)
    },
    onSettled: () => {
      hideAlertDialog()
    },
  })

  const handleDeleteAccountProfile = (accountProfile: AccountProfile) => {
    showAlertDialog({
      title: 'Yakin ingin menghapus Profil Akun?',
      description: (
        <>
          Aksi tidak dapat dibatalkan. Ini akan menghapus profil akun
          <span className="font-bold">
            {' '}
            {accountProfile.name}
          </span>
          secara permanen.
        </>
      ),
      confirmText: 'Hapus',
      isConfirming: accountProfileDeleteMutation.isPending,
      onConfirm: () => accountProfileDeleteMutation.mutate(accountProfile.id),
    })
  }

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={onOpenChange}
      >
        <DialogContent className="md:min-w-4xl">
          <DialogHeader>
            <DialogTitle asChild>
              <div className="flex justify-between items-center pt-6">
                <p className="font-bold text-xl">Profil</p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    handleOpenAccountProfileDialog()
                  }}
                  className="cursor-pointer"
                >
                  <Plus />
                  {' '}
                  Tambah Profil
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          {selectedAccount
            ? (
                <ScrollArea
                  type="auto"
                  className="max-h-[calc(100vh-200px)] **:data-[slot=scroll-area-scrollbar]:-right-4!"
                >
                  {selectedAccount.profile.map(profile => (
                    <div
                      key={`profile-${profile.id}`}
                      className="pt-4 border-t border-neutral-600 space-y-4"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{profile.name}</p>
                          {profile.allow_generate
                            ? (
                                <p className="text-xs flex items-center">
                                  <Check className="size-4 text-green-500" />
                                  {' '}
                                  Allow
                                  Generate
                                </p>
                              )
                            : (
                                <p className="text-xs flex items-center">
                                  <X className="size-4 text-red-500" />
                                  {' '}
                                  Disallow
                                  Generate
                                </p>
                              )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              handleCopyTemplate(profile, selectedAccount)
                            }}
                            className="cursor-pointer"
                          >
                            <Copy className="size-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                className="cursor-pointer"
                              >
                                <EllipsisVertical className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="center">
                              <DropdownMenuItem
                                onSelect={() => {
                                  handleOpenAccountProfileDialog(profile)
                                }}
                              >
                                <span>
                                  <SquarePen />
                                </span>
                                {' '}
                                Update
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onSelect={() => {
                                  handleDeleteAccountProfile(profile)
                                }}
                              >
                                <span>
                                  <Trash2 />
                                </span>
                                {' '}
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      {Array.from({ length: profile.max_user }, (_, i) => (
                        <div
                          key={`user-${profile.id}-${i}`}
                          className="flex justify-between items-center bg-secondary px-4 py-2"
                        >
                          {profile.user?.length && profile.user[i]?.id
                            ? (
                                <>
                                  <div>
                                    <p className="font-medium">
                                      {profile.user[i].name}
                                    </p>
                                    <p className="text-xs">
                                      Berakhir:
                                      {' '}
                                      {formatDateIdStandard(profile.user[i].expired_at)}
                                    </p>
                                  </div>
                                  <div className="flex gap-4">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        handleOpenAccountUserUpdateDialog(
                                          profile.user![i],
                                        )
                                      }}
                                      className="cursor-pointer text-xs"
                                    >
                                      <SquarePen className="size-4" />
                                      {' '}
                                      Edit User
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        handleExpireAccountUser(profile.user![i])
                                      }}
                                      className="cursor-pointer text-xs"
                                    >
                                      <ClockFading className="size-4" />
                                      {' '}
                                      Expire User
                                    </Button>
                                  </div>
                                </>
                              )
                            : (
                                <>
                                  <p className="text-sm italic">No User</p>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      handleOpenCreateUserDialog(profile.id)
                                    }}
                                    className="cursor-pointer text-xs"
                                  >
                                    <UserPlus className="size-4" />
                                    {' '}
                                    Tambah User
                                  </Button>
                                </>
                              )}
                        </div>
                      ))}
                    </div>
                  ))}
                </ScrollArea>
              )
            : (
                <div className="flex items-center justify-center">
                  <p>Tidak ada akun terseleksi</p>
                </div>
              )}
        </DialogContent>
      </Dialog>
      <PagesAccountIndexDialogEditProfile open={dialogAccountProfileOpen} onOpenChange={setDialogAccountProfileOpen} selectedAccountProfile={selectedAccountProfile} selectedAccountId={selectedAccount?.id} />
      <PagesAccountIndexDialogUserUpdate open={dialogAccountUserUpdateOpen} onOpenChange={setDialogAccountUserUpdateOpen} selectedAccountUser={selectedAccountUser} />
      <PagesAccountIndexDialogUserCreate open={dialogCreateUserOpen} onOpenChange={setDialogCreateUserOpen} initialFormData={createUserFormData} />
    </>
  )
}

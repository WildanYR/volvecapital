import type { AccountEditFormSubmitData } from '@/dashboard/components/forms/account-edit.form'
import type { AccountModifierEditFormSubmitData } from '@/dashboard/components/forms/account-modifier-edit.form'
import type { AccountProfileFormSubmitData } from '@/dashboard/components/forms/account-profile.form'
import type { AccountUserUpdateFormSubmitData } from '@/dashboard/components/forms/account-user-update-form'
import type {
  AccountUserFormInitialData,
  AccountUserFormSubmitData,
} from '@/dashboard/components/forms/account-user.form'
import type {
  Account,
  AccountFilter,
  AccountProfile,
  AccountProfileUser,
  CreateAccountProfilePayload,
  CreateAccountUserPayload,
  FreezeAccountPayload,
  UpdateAccountModifierPayload,
  UpdateAccountPayload,
  UpdateAccountProfilePayload,
  UpdateAccountUserPayload,
} from '@/dashboard/services/account.service'
import type { Email } from '@/dashboard/services/email.service'
import type { ProductVariant } from '@/dashboard/services/product.service'
import type { OrderByDirection } from '@/dashboard/types/order-by.type'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  AlertCircle,
  Banknote,
  BrushCleaning,
  CalendarClock,
  Check,
  ChevronLeft,
  CircleQuestionMark,
  ClockFading,
  Cog,
  Copy,
  EllipsisVertical,
  Info,
  LockKeyholeOpen,
  Package,
  Pin,
  PinOff,
  Plus,
  SlidersHorizontal,
  SquarePen,
  SquareUser,
  Timer,
  TimerOff,
  Trash2,
  UserPlus,
  Wallet,
  Warehouse,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useDebouncedCallback } from 'use-debounce'
import { AccountStatus } from '@/dashboard/components/account-status'
import { FinancialDetailDialog } from '@/dashboard/components/financial-detail-dialog'
import { AccountEditForm } from '@/dashboard/components/forms/account-edit.form'
import { AccountFreezeForm } from '@/dashboard/components/forms/account-freeze.form'
import { AccountModifierEditForm } from '@/dashboard/components/forms/account-modifier-edit.form'
import { AccountProfileForm } from '@/dashboard/components/forms/account-profile.form'
import { AccountUserUpdateForm } from '@/dashboard/components/forms/account-user-update-form'
import { AccountUserForm } from '@/dashboard/components/forms/account-user.form'
import { SelectInput } from '@/dashboard/components/forms/common/inputs/select-input'
import { EmailSelect } from '@/dashboard/components/inputs/select/email.select'
import { ProductVariantSelect } from '@/dashboard/components/inputs/select/product-variant.select'
import { NoData } from '@/dashboard/components/no-data'
import { Pagination } from '@/dashboard/components/pagination'
import { Button } from '@/dashboard/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/dashboard/components/ui/card'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/dashboard/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/dashboard/components/ui/dropdown-menu'
import { Input } from '@/dashboard/components/ui/input'
import { Label } from '@/dashboard/components/ui/label'
import { ScrollArea } from '@/dashboard/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/dashboard/components/ui/select'
import { Skeleton } from '@/dashboard/components/ui/skeleton'
import { AccountStatusSelect } from '@/dashboard/constants/account-status-select'
import { API_URL } from '@/dashboard/constants/api-url.cont'
import { useGlobalAlertDialog } from '@/dashboard/context-providers/alert-dialog.provider'
import { useAuth } from '@/dashboard/context-providers/auth.provider'
import { copyAccountTemplate } from '@/dashboard/lib/copy-template'
import { convertMetadataObjectToString } from '@/dashboard/lib/metadata-converter'
import { formatRupiah } from '@/dashboard/lib/currency.util'
import { formatDateIdStandard } from '@/dashboard/lib/time-converter.util'
import {
  AccountServiceGenerator,
  GetAccountsParamsSchema,
} from '@/dashboard/services/account.service'
import { ProductServiceGenerator } from '@/dashboard/services/product.service'
import type { Product } from '@/dashboard/services/product.service'

export const Route = createFileRoute('/dashboard/account/$slug')({
  component: RouteComponent,
  validateSearch: GetAccountsParamsSchema,
})

function RouteComponent() {
  const { slug } = Route.useParams()
  const searchParam = Route.useSearch()
  const navigate = Route.useNavigate()
  const auth = useAuth()
  const queryClient = useQueryClient()
  const { showAlertDialog, hideAlertDialog } = useGlobalAlertDialog()
  const accountService = AccountServiceGenerator(
    API_URL,
    auth.tenant!.accessToken,
    auth.tenant!.id,
  )
  const productService = ProductServiceGenerator(
    API_URL,
    auth.tenant!.accessToken,
    auth.tenant!.id,
  )

  const { data: product } = useQuery({
    queryKey: ['product', slug],
    queryFn: ({ signal }) => productService.getProductById(slug, signal),
  })

  const [filter, setFilter] = useState<AccountFilter>({
    email_id: searchParam.email_id ?? '',
    product_variant_id: searchParam.product_variant_id ?? '',
    product_slug: slug,
    status: searchParam.status ?? '',
    email: searchParam.email ?? '',
    user: searchParam.user ?? '',
    billing: searchParam.billing ?? '',
  })
  const [sort, setSort] = useState<string>(
    !!searchParam.order_by && !!searchParam.order_direction
      ? `${searchParam.order_by}:${searchParam.order_direction}`
      : 'default',
  )

  const [dialogFilterOpen, setDialogFilterOpen] = useState<boolean>(false)
  const [dialogProfileDetailOpen, setDialogProfileDetailOpen]
    = useState<boolean>(false)
  const [dialogAccountOpen, setDialogAccountOpen] = useState<boolean>(false)
  const [dialogAccountProfileOpen, setDialogAccountProfileOpen]
    = useState<boolean>(false)
  const [dialogAccountModifierOpen, setDialogAccountModifierOpen]
    = useState<boolean>(false)
  const [dialogAccountUserOpen, setDialogAccountUserOpen]
    = useState<boolean>(false)
  const [dialogAccountUserUpdateOpen, setDialogAccountUserUpdateOpen]
    = useState<boolean>(false)
  const [dialogFreezeOpen, setDialogFreezeOpen] = useState<boolean>(false)
  const [dialogFinancialDetailOpen, setDialogFinancialDetailOpen] = useState<boolean>(false)

  const [selectedAccountState, setSelectedAccount] = useState<Account>()
  
  const [selectedAccountProfile, setSelectedAccountProfile]
    = useState<AccountProfile>()
  const [selectedEmail, setSelectedEmail] = useState<Email>()
  const [selectedProductVariant, setSelectedProductVariant]
    = useState<ProductVariant>()

  const [accountUserInitialData, setAccountUserInitialData]
    = useState<AccountUserFormInitialData>()

  const { data: accounts, isLoading: isFetchAccountLoading } = useQuery({
    queryKey: ['account', { ...searchParam, product_slug: slug }],
    queryFn: ({ signal }) => accountService.getAllAccount({ ...searchParam, product_slug: slug, signal }),

  })

  const selectedAccount = selectedAccountState 
    ? (accounts?.items?.find(v => v.id === selectedAccountState.id) ?? selectedAccountState)
    : undefined

  const { data: countAccounts, isLoading: isFetchCountAccountsLoading }
    = useQuery({
      queryKey: ['countAccount', { product_slug: slug, product_variant_id: searchParam.product_variant_id }],
      queryFn: ({ signal }) =>
        accountService.countStatusAccount({ product_slug: slug, product_variant_id: searchParam.product_variant_id }, signal),
    })

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
      setDialogAccountOpen(false)
    },
  })

  const handleAccountSelectedEdit = (account: Account) => {
    setSelectedAccount(account)
    setDialogAccountOpen(true)
  }

  const handleAccountEditSubmit = (value: AccountEditFormSubmitData) => {
    accountEditMutation.mutate({
      id: selectedAccount!.id,
      payload: {
        ...value,
        email_id: value.email_id,
        product_variant_id: value.product_variant_id,
      },
    })
  }

  const handleClearAccount = (account: Account) => {
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
      isConfirming: accountEditMutation.isPending,
      onConfirm: () =>
        accountEditMutation.mutate({
          id: account.id,
          payload: { status: 'ready' },
        }),
    })
  }

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

  const handleDeleteAccount = (account: Account) => {
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
      setDialogAccountProfileOpen(false)
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
      setDialogAccountProfileOpen(false)
    },
  })

  const handleOpenAccountProfileDialog = (
    account?: Account,
    accountProfile?: AccountProfile,
  ) => {
    if (account) {
      setSelectedAccount(account)
    }
    if (accountProfile) {
      setSelectedAccountProfile(accountProfile)
    }
    else {
      setSelectedAccountProfile(undefined)
    }
    setDialogAccountProfileOpen(true)
  }

  const handleAccountProfileFormSubmit = (
    value: AccountProfileFormSubmitData,
  ) => {
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
        account_id: selectedAccount!.id,
      })
    }
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
      setDialogAccountModifierOpen(false)
    },
  })

  const handleModifierClick = (account: Account) => {
    setSelectedAccount(account)
    setDialogAccountModifierOpen(true)
  }

  const handleAccountModifierEditSubmit = (
    value: AccountModifierEditFormSubmitData,
  ) => {
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
  }

  const handleCopyTemplate = (profile: AccountProfile, account: Account) => {
    const template = copyAccountTemplate(profile, account)
    navigator.clipboard
      .writeText(template)
      .then(() => {
        toast.success('Akun berhasil di copy')
      })
      .catch((error) => {
        console.error(error)
        toast.error('Akun gagal di copy')
      })
  }

  const accountUserCreateMutation = useMutation({
    mutationFn: (payload: CreateAccountUserPayload) =>
      accountService.createNewAccountUser(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['account'] })
      toast.success('User Akun berhasil dibuat.')
      handleCopyTemplate(data.profile, data.account)
    },
    onError: (error) => {
      toast.error(`Gagal membuat user akun: ${error.message}`)
    },
    onSettled: () => {
      setDialogAccountUserOpen(false)
      setDialogProfileDetailOpen(false)
    },
  })

  const handleOpenAccountUserDialog = (
    accountUserFormInitialData?: AccountUserFormInitialData,
  ) => {
    if (accountUserFormInitialData) {
      setAccountUserInitialData(accountUserFormInitialData)
    }
    else {
      setAccountUserInitialData(undefined)
    }
    setDialogAccountUserOpen(true)
  }

  const handleAccountUserFormSubmit = (value: AccountUserFormSubmitData) => {
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
  }

  const [selectedAccountUser, setSelectedAccountUser] = useState<AccountProfileUser | undefined>(undefined)

  const accountUserUpdateMutation = useMutation({
    mutationFn: (payload: UpdateAccountUserPayload) => accountService.updateAccountUser(selectedAccountUser!.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account'] })
      toast.success('User Akun berhasil diedit.')
    },
    onError: (error) => {
      toast.error(`Gagal update user akun: ${error.message}`)
    },
    onSettled: () => {
      setDialogAccountUserUpdateOpen(false)
    },
  })

  const handleOpenAccountUserUpdateDialog = (accountUser: AccountProfileUser) => {
    setSelectedAccountUser(accountUser)
    setDialogAccountUserUpdateOpen(true)
  }

  const handleAccountUserUpdateFormSubmit = (value: AccountUserUpdateFormSubmitData) => {
    accountUserUpdateMutation.mutate(value)
  }

  const expireAccountUserMutation = useMutation({
    mutationFn: (userId: string) => accountService.updateAccountUser(userId, { status: 'expired' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account'] })
      toast.success('User Akun berhasil dihapus.')
    },
    onError: (error) => {
      toast.error(`Gagal hapus user akun: ${error.message}`)
    },
    onSettled: () => {
      setDialogAccountUserUpdateOpen(false)
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
            {' '}
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
          <span className="italic font-bold">Menghapus/ Expire user akun tidak akan menghapus data di transaksi.</span>
        </>
      ),
      confirmText: 'Hapus',
      isConfirming: expireAccountUserMutation.isPending,
      onConfirm: () => expireAccountUserMutation.mutate(user.id),
    })
  }

  const handleEmailSelect = (email?: Email) => {
    setSelectedEmail(email || undefined)
    setFilter({
      ...filter,
      email_id: email?.id || '',
    })
  }

  const handleProductVariantSelect = (productVariant?: ProductVariant) => {
    setSelectedProductVariant(productVariant || undefined)
    setFilter({
      ...filter,
      product_variant_id: productVariant?.id || '',
    })
  }

  const handleAccountStatusSelect = (status: string) => {
    setFilter({
      ...filter,
      status,
    })
  }

  const handleSearchEmail = useDebouncedCallback((value: string) => {
    setFilter({ ...filter, email: value })
    const email = value || undefined
    navigate({ search: prev => ({ ...prev, email, page: 1 }), replace: true })
  }, 700)

  const handleSearchUser = useDebouncedCallback((value: string) => {
    setFilter({ ...filter, user: value })
    const user = value || undefined
    navigate({ search: prev => ({ ...prev, user, page: 1 }), replace: true })
  }, 700)

  const handleSearchBilling = useDebouncedCallback((value: string) => {
    setFilter({ ...filter, billing: value })
    const billing = value || undefined
    navigate({ search: prev => ({ ...prev, billing, page: 1 }), replace: true })
  }, 700)

  const handleSortChange = (value: string) => {
    setSort(value)

    const [orderBy, orderDirection]
      = value === 'default' ? [undefined, undefined] : value.split(':')
    navigate({
      search: prev => ({
        ...prev,
        order_by: orderBy,
        order_direction: orderDirection as OrderByDirection | undefined,
        page: 1,
      }),
      replace: true,
    })
  }

  const handlePaginationChange = (page: number) => {
    navigate({
      search: (prev: any) => ({
        ...prev,
        page,
      }),
      replace: true,
    })
  }

  const handleFilterApply = () => {
    const filteredFilter = Object.fromEntries(
      Object.entries(filter).filter(ent => ent[1] !== ''),
    )
    navigate({
      search: prev => ({
        ...prev,
        ...filteredFilter,
      }),
      replace: true,
    })
    setDialogFilterOpen(false)
  }

  const handleFilterClear = () => {
    setFilter({
      email_id: '',
      product_variant_id: '',
      status: '',
      email: '',
      user: '',
    })
    setSelectedEmail(undefined)
    setSelectedProductVariant(undefined)
    navigate({
      search: prev => ({
        ...prev,
        email_id: undefined,
        product_variant_id: undefined,
        status: undefined,
      }),
      replace: true,
    })
    setDialogFilterOpen(false)
  }

  const handleProfileDetailClick = (account: Account) => {
    setSelectedAccount(account)
    setDialogProfileDetailOpen(true)
  }

  const handleToggleFreezeDialog = (account: Account) => {
    setSelectedAccount(account)
    setDialogFreezeOpen(true)
  }

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
      setDialogFreezeOpen(false)
    },
  })

  const handleFreezeAccount = (payload: { duration: number }) => {
    accountFreezeMutation.mutate(payload)
  }

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

  const handleUnfreezeAccount = (accountId: string) => {
    accountUnfreezeMutation.mutate(accountId)
  }

  const pinAccountMutation = useMutation({
    mutationFn: (payload: { accountId: string, pinned: boolean }) => accountService.pinAccount(payload.accountId, payload.pinned),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account'] })
      toast.success('Akun Berhasil di Pin')
    },
    onError: (error) => {
      toast.error(`Akun Gagal di Pin: ${error.message}`)
    },
  })

  const handlePinAccount = (accountId: string, pinned: boolean) => {
    pinAccountMutation.mutate({ accountId, pinned })
  }

  return (
    <>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col md:flex-row gap-6 justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild size="icon">
              <Link to="/dashboard/account">
                <ChevronLeft />
              </Link>
            </Button>
            <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight text-balance">
              {product?.name || '...'}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="secondary"
              onClick={() => {
                handleOpenAccountUserDialog()
              }}
              className="cursor-pointer"
            >
              <UserPlus />
              {' '}
              Generate User
            </Button>
            <Button asChild>
              <Link to="/dashboard/account/create">
                <span>
                   <Plus />
                </span>
                {' '}
                Buat Akun
              </Link>
            </Button>
          </div>
        </div>

        {/* Variant Tabs */}
        <div className="flex flex-wrap gap-2 border-b pb-4">
          <Button
            variant={!searchParam.product_variant_id ? 'default' : 'ghost'}
            onClick={() => {
              navigate({
                search: prev => ({ ...prev, product_variant_id: undefined, page: 1 }),
                replace: true,
              })
            }}
          >
            Semua Varian
          </Button>
          {product?.variants?.map(variant => (
            <Button
              key={variant.id}
              variant={searchParam.product_variant_id === variant.id ? 'default' : 'ghost'}
              onClick={() => {
                navigate({
                  search: prev => ({ ...prev, product_variant_id: variant.id, page: 1 }),
                  replace: true,
                })
              }}
            >
              {variant.name}
            </Button>
          ))}
        </div>
        <div className="flex flex-col md:flex-row justify-end items-center gap-4">
          <Input
            type="text"
            defaultValue={filter.email}
            placeholder="Cari Email..."
            onChange={e => handleSearchEmail(e.target.value)}
          />
          <Input
            type="text"
            defaultValue={filter.user}
            placeholder="Cari Nama User..."
            onChange={e => handleSearchUser(e.target.value)}
          />
          <Input
            type="text"
            defaultValue={filter.billing}
            placeholder="Cari Billing"
            onChange={e => handleSearchBilling(e.target.value)}
          />
          <Button
            variant="secondary"
            onClick={() => {
              setDialogFilterOpen(true)
            }}
            className="cursor-pointer w-full md:w-min"
          >
            <SlidersHorizontal className="size-4" />
            {' '}
            Filter
          </Button>
          <div className="flex items-center gap-2 w-full md:w-min">
            <p className="text-sm">Urutkan:</p>
            <Select defaultValue={sort} onValueChange={handleSortChange}>
              <SelectTrigger className="w-full md:w-min">
                <SelectValue placeholder="Theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="email.email:asc">Email A-Z</SelectItem>
                <SelectItem value="email.email:desc">Email Z-A</SelectItem>
                <SelectItem value="batch_end_date:asc">
                  Reset Password Terdekat
                </SelectItem>
                <SelectItem value="batch_end_date:desc">
                  Reset Password Terlama
                </SelectItem>
                <SelectItem value="subscription_expiry:asc">
                  Subscription Expired Terdekat
                </SelectItem>
                <SelectItem value="subscription_expiry:desc">
                  Subscription Expired Terlama
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {isFetchCountAccountsLoading
          ? (
              <Skeleton className="h-20 rounded-md" />
            )
          : (
              <Card>
                <CardHeader>
                  <CardTitle>Stok Akun</CardTitle>
                  <CardDescription>
                    {searchParam.product_variant_id
                      ? 'Terfilter dengan varian produk'
                      : 'Semua Akun (filter dengan varian produk)'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-1 w-full px-3 border-l-2 border-secondary">
                      <p className="text-muted-foreground inline-flex items-center gap-1">
                        <Warehouse className="size-4" />
                        {' '}
                        Akun Generate Tersedia
                      </p>
                      <p className="font-semibold text-2xl">
                        {countAccounts?.accounts_with_slots}
                      </p>
                    </div>
                    <div className="space-y-1 w-full px-3 border-l-2 border-secondary">
                      <p className="text-muted-foreground inline-flex items-center gap-1">
                        <Warehouse className="size-4" />
                        {' '}
                        Profil Generate Tersedia
                      </p>
                      <p className="font-semibold text-2xl">
                        {countAccounts?.profiles_available}
                      </p>
                    </div>
                    <div className="space-y-1 w-full px-3 border-l-2 border-secondary">
                      <p className="text-muted-foreground inline-flex items-center gap-1">
                        <Warehouse className="size-4" />
                        {' '}
                        Akun Penuh
                      </p>
                      <p className="font-semibold text-2xl">
                        {countAccounts?.accounts_full}
                      </p>
                    </div>
                    <div className="space-y-1 w-full px-3 border-l-2 border-secondary">
                      <p className="text-muted-foreground inline-flex items-center gap-1">
                        <Warehouse className="size-4" />
                        {' '}
                        Akun Disable/ Freeze
                      </p>
                      <p className="font-semibold text-2xl">
                        {countAccounts?.accounts_disabled_or_frozen}
                      </p>
                    </div>
                    <div className="space-y-1 w-full px-3 border-l-2 border-secondary">
                      <p className="text-muted-foreground inline-flex items-center gap-1">
                        <Warehouse className="size-4" />
                        {' '}
                        Profil Disallow Generate
                      </p>
                      <p className="font-semibold text-2xl">
                        {countAccounts?.profiles_locked_but_has_slot}
                      </p>
                    </div>
                    <div className="space-y-1 w-full px-3 border-l-2 border-secondary">
                      <p className="text-muted-foreground inline-flex items-center gap-1">
                        <Warehouse className="size-4" />
                        {' '}
                        Akun Berakhir Hari Ini
                      </p>
                      <p className="font-semibold text-2xl">
                        {countAccounts?.accounts_expiring_today}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
        {!!accounts && (
          <div className="flex items-center justify-center">
            <Pagination
              currentPage={accounts.paginationData.currentPage}
              totalPages={accounts.paginationData.totalPage}
              onPageChange={handlePaginationChange}
            />
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {isFetchAccountLoading
            ? (
                <>
                  <Skeleton className="h-20 rounded-md" />
                  <Skeleton className="h-20 rounded-md" />
                  <Skeleton className="h-20 rounded-md" />
                </>
              )
            : accounts?.items.length
              ? (
                  accounts.items.map(account => (
                    <Card key={`account-${account.id}`}>
                      <CardHeader>
                        <CardTitle className="flex gap-2">
                          {account.pinned
                            ? (
                                <Pin className="size-6" />
                              )
                            : null}
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
                                onSelect={() => {
                                  handleAccountSelectedEdit(account)
                                }}
                              >
                                <span>
                                  <SquarePen />
                                </span>
                                {' '}
                                Update
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onSelect={() => handleModifierClick(account)}
                              >
                                <span>
                                  <Cog />
                                </span>
                                Modifier
                              </DropdownMenuItem>
                              {!account.pinned
                                ? (
                                    <DropdownMenuItem
                                      onSelect={() => handlePinAccount(account.id, true)}
                                    >
                                      <span>
                                        <Pin />
                                      </span>
                                      Pin
                                    </DropdownMenuItem>
                                  )
                                : (
                                    <DropdownMenuItem
                                      onSelect={() => handlePinAccount(account.id, false)}
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
                                      onSelect={() => handleToggleFreezeDialog(account)}
                                    >
                                      <span>
                                        <TimerOff />
                                      </span>
                                      Freeze
                                    </DropdownMenuItem>
                                  )
                                : (
                                    <DropdownMenuItem
                                      onSelect={() => handleUnfreezeAccount(account.id)}
                                    >
                                      <span>
                                        <Timer />
                                      </span>
                                      Unfreeze
                                    </DropdownMenuItem>
                                  )}
                              <DropdownMenuItem
                                onSelect={() => handleDeleteAccount(account)}
                              >
                                <span>
                                  <Trash2 />
                                </span>
                                {' '}
                                Delete
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onSelect={() => handleClearAccount(account)}
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
                          
                          <div className="space-y-1 w-full px-3 border-l-2 border-secondary col-span-full bg-card py-3 rounded-r-md mt-2">
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2">
                                <Banknote className="size-4 text-muted-foreground" />
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Statistik Finansial</p>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="size-9 rounded-md hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 cursor-pointer"
                                onClick={() => {
                                  setSelectedAccount(account)
                                  setDialogFinancialDetailOpen(true)
                                }}
                              >
                                <EllipsisVertical className="size-4" />
                              </Button>
                            </div>
                            <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                              <div>
                                <p className="text-[10px] text-muted-foreground uppercase font-medium">Modal (Total)</p>
                                <p className="font-bold text-sm">{formatRupiah(account.total_capital || account.capital_price)}</p>
                              </div>
                              <div>
                                <p className="text-[10px] text-muted-foreground uppercase font-medium">Pendapatan</p>
                                <p className="font-bold text-sm text-muted-foreground dark:text-muted-foreground">{formatRupiah(account.total_revenue || 0)}</p>
                              </div>
                              <div>
                                <p className="text-[10px] text-muted-foreground uppercase font-medium">Laba Bersih</p>
                                <p className="font-bold text-sm text-muted-foreground">
                                  {formatRupiah(account.profit || 0)}
                                </p>
                              </div>
                              <div>
                                <p className="text-[10px] text-muted-foreground uppercase font-medium">ROI</p>
                                <p className="font-bold text-sm text-muted-foreground">
                                  {account.roi || 0}%
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => handleProfileDetailClick(account)}
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
                  ))
                )
              : (
                  <NoData>Akun tidak ditemukan</NoData>
                )}
        </div>
        {!!accounts && (
          <div className="flex items-center justify-center">
            <Pagination
              currentPage={accounts.paginationData.currentPage}
              totalPages={accounts.paginationData.totalPage}
              onPageChange={handlePaginationChange}
            />
          </div>
        )}
      </div>
      {/* Filter Dialog */}
      <Dialog open={dialogFilterOpen} onOpenChange={setDialogFilterOpen}>
        <DialogContent className="md:min-w-4xl">
          <DialogHeader>
            <DialogTitle>Filter Akun</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="grid gap-3">
              <Label>Email</Label>
              <EmailSelect
                selectedItem={selectedEmail}
                onSelect={handleEmailSelect}
              />
            </div>
            <div className="grid gap-3">
              <Label>Produk</Label>
              <ProductVariantSelect
                selectedItem={selectedProductVariant}
                onSelect={handleProductVariantSelect}
                productSlug={slug}
              />
            </div>
            <div className="grid gap-3">
              <SelectInput
                name="filter-status"
                label="Status"
                placeholder="Pilih status..."
                selectItems={AccountStatusSelect}
                value={filter.status}
                onSelected={handleAccountStatusSelect}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary" className="cursor-pointer">
                Tutup
              </Button>
            </DialogClose>
            <Button
              variant="outline"
              onClick={() => {
                handleFilterClear()
              }}
              className="cursor-pointer"
            >
              Clear
            </Button>
            <Button
              onClick={() => {
                handleFilterApply()
              }}
              className="cursor-pointer"
            >
              Terapkan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Edit Account Dialog */}
      <Dialog open={dialogAccountOpen} onOpenChange={setDialogAccountOpen}>
        <DialogContent className="md:min-w-4xl">
          <DialogHeader>
            <DialogTitle>Ubah Akun</DialogTitle>
          </DialogHeader>
          <AccountEditForm
            initialData={selectedAccount}
            isPending={false}
            onSubmit={handleAccountEditSubmit}
            productSlug={slug}
          />
        </DialogContent>
      </Dialog>
      {/* Edit Profile Dialog */}
      <Dialog
        open={dialogAccountProfileOpen}
        onOpenChange={setDialogAccountProfileOpen}
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
            isPending={
              accountProfileCreateMutation.isPending
              || accountProfileEditMutation.isPending
            }
            onSubmit={handleAccountProfileFormSubmit}
          />
        </DialogContent>
      </Dialog>
      {/* Edit Modifier Dialog */}
      <Dialog
        open={dialogAccountModifierOpen}
        onOpenChange={setDialogAccountModifierOpen}
      >
        <DialogContent className="md:min-w-4xl">
          <DialogHeader>
            <DialogTitle>Ubah Modifier Akun</DialogTitle>
          </DialogHeader>
          <AccountModifierEditForm
            initialData={selectedAccount?.modifier}
            isPending={accountModifierEditMutation.isPending}
            onSubmit={handleAccountModifierEditSubmit}
          />
        </DialogContent>
      </Dialog>
      {/* Create Account User Dialog */}
      <Dialog
        open={dialogAccountUserOpen}
        onOpenChange={setDialogAccountUserOpen}
      >
        <DialogContent className="md:min-w-4xl">
          <DialogHeader>
            <DialogTitle>Buat User Akun</DialogTitle>
          </DialogHeader>
          <AccountUserForm
            initialData={accountUserInitialData}
            isPending={accountUserCreateMutation.isPending}
            onSubmit={handleAccountUserFormSubmit}
            productSlug={slug}
          />
        </DialogContent>
      </Dialog>
      {/* Update Account User Dialog */}
      <Dialog
        open={dialogAccountUserUpdateOpen}
        onOpenChange={setDialogAccountUserUpdateOpen}
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
                  onSubmit={handleAccountUserUpdateFormSubmit}
                />
              )
            : (
                <div className="flex items-center justify-center">
                  <p>Tidak ada user akun terseleksi</p>
                </div>
              )}
        </DialogContent>
      </Dialog>
      {/* Profile Detail Dialog */}
      <Dialog
        open={dialogProfileDetailOpen}
        onOpenChange={setDialogProfileDetailOpen}
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
                                  Disallow Generate
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
                                  handleOpenAccountProfileDialog(undefined, profile)
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
                                    <p className="font-medium">{profile.user[i].name}</p>
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
                                        handleOpenAccountUserUpdateDialog(profile.user![i])
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
                                      handleOpenAccountUserDialog({
                                        product_variant_id:
                                          selectedAccount.product_variant_id,
                                        product_variant: selectedAccount.product_variant,
                                        account_profile_id: profile.id,
                                      })
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
      {/* Account Freeze Dialog */}
      <Dialog open={dialogFreezeOpen} onOpenChange={setDialogFreezeOpen}>
        <DialogContent className="md:min-w-4xl">
          <DialogHeader>
            <DialogTitle>Bekukan Akun</DialogTitle>
          </DialogHeader>
          <AccountFreezeForm
            isPending={accountFreezeMutation.isPending}
            onSubmit={handleFreezeAccount}
          />
        </DialogContent>
      </Dialog>
      
      <FinancialDetailDialog
        account={selectedAccount!}
        open={dialogFinancialDetailOpen}
        onOpenChange={setDialogFinancialDetailOpen}
      />
    </>
  )
}

import type { AccountSearchFilter } from '@/dashboard/components/pages/account-index/account-search'
import type { AccountFilter } from '@/dashboard/services/account.service'
import type { OrderByDirection } from '@/dashboard/types/order-by.type'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  Plus,
  UserPlus,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { NoData } from '@/dashboard/components/no-data'
import { AccountCard } from '@/dashboard/components/pages/account-index/account-card'
import { PagesAccountIndexCount } from '@/dashboard/components/pages/account-index/account-count'
import { AccountFilterTab } from '@/dashboard/components/pages/account-index/account-filter-tab'
import { PagesAccountIndexSearch } from '@/dashboard/components/pages/account-index/account-search'
import { PagesAccountIndexDialogEdit } from '@/dashboard/components/pages/account-index/dialogs/edit-account-dialog'
import { PagesAccountIndexDialogEditModifier } from '@/dashboard/components/pages/account-index/dialogs/edit-account-modifier-dialog'
import { PagesAccountIndexDialogExpense } from '@/dashboard/components/pages/account-index/dialogs/expense-dialog'
import { PagesAccountIndexDialogFreeze } from '@/dashboard/components/pages/account-index/dialogs/freeze-account-dialog'
import { PagesAccountIndexDialogProfile } from '@/dashboard/components/pages/account-index/dialogs/profile-dialog'
import { PagesAccountIndexDialogUserCreate } from '@/dashboard/components/pages/account-index/dialogs/user-create-dialog'
import { Pagination } from '@/dashboard/components/pagination'
import { Button } from '@/dashboard/components/ui/button'
import { Skeleton } from '@/dashboard/components/ui/skeleton'
import { API_URL } from '@/dashboard/constants/api-url.cont'
import { useAuth } from '@/dashboard/context-providers/auth.provider'
import {
  AccountServiceGenerator,
  GetAccountsParamsSchema,
} from '@/dashboard/services/account.service'

export const Route = createFileRoute('/dashboard/account/')({
  component: RouteComponent,
  validateSearch: GetAccountsParamsSchema,
})

function RouteComponent() {
  const searchParam = Route.useSearch()
  const navigate = Route.useNavigate()
  const auth = useAuth()
  const accountService = AccountServiceGenerator(
    API_URL,
    auth.tenant!.accessToken,
    auth.tenant!.id,
  )

  const [filter, setFilter] = useState<AccountFilter>({
    email_id: searchParam.email_id ?? '',
    product_variant_id: searchParam.product_variant_id ?? '',
    status: searchParam.status ?? '',
    email: searchParam.email ?? '',
    user: searchParam.user ?? '',
    billing: searchParam.billing ?? '',
    product_id: searchParam.product_id ?? '',
  })
  const [sort, setSort] = useState<string>(
    !!searchParam.order_by && !!searchParam.order_direction
      ? `${searchParam.order_by}:${searchParam.order_direction}`
      : 'default',
  )

  const [dialogCreateUserOpen, setDialogCreateUserOpen]
    = useState<boolean>(false)

  const [selectedAccountId, setSelectedAccountId] = useState<string | undefined>(undefined)
  const [dialogAccountEditOpen, setDialogAccountEditOpen] = useState<boolean>(false)
  const [dialogAccountModifierOpen, setDialogAccountModifierOpen] = useState<boolean>(false)
  const [dialogFreezeOpen, setDialogFreezeOpen] = useState<boolean>(false)
  const [dialogProfileDetailOpen, setDialogProfileDetailOpen] = useState<boolean>(false)
  const [dialogExpenseOpen, setDialogExpenseOpen] = useState<boolean>(false)

  const { data: accounts, isLoading: isFetchAccountLoading } = useQuery({
    queryKey: ['account', searchParam],
    queryFn: ({ signal }) =>
      accountService.getAllAccount({ ...searchParam, signal }),
  })

  const selectedAccount = useMemo(() => {
    if (!selectedAccountId || !accounts?.items)
      return undefined
    return accounts.items.find(acc => acc.id === selectedAccountId)
  }, [accounts?.items, selectedAccountId])

  const handleSearchChange = (searchFilter: AccountSearchFilter) => {
    setFilter({ ...filter, ...searchFilter })
    const cleanFilter = Object.fromEntries(
      Object.entries(searchFilter).map(([key, value]) => [
        key,
        value === '' ? undefined : value,
      ]),
    )
    navigate({
      search: prev => ({ ...prev, ...cleanFilter }),
      replace: true,
    })
  }

  const handleFilterChange = (newFilter: AccountFilter) => {
    setFilter({ ...filter, ...newFilter })
    const cleanFilter = Object.fromEntries(
      Object.entries(newFilter).map(([key, value]) => [
        key,
        value === '' ? undefined : value,
      ]),
    )
    navigate({
      search: prev => ({ ...prev, ...cleanFilter }),
      replace: true,
    })
  }

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

  return (
    <>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col md:flex-row gap-6 justify-between items-center">
          <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight text-balance">
            Akun
          </h1>
          <div className="flex items-center gap-4">
            <Button
              variant="secondary"
              onClick={() => { setDialogCreateUserOpen(true) }}
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
        <AccountFilterTab accountFilter={filter} onAccountFilterChange={handleFilterChange} />
        <PagesAccountIndexSearch defaultSort={sort} onSortChanges={handleSortChange} onSearchChanges={handleSearchChange} />
        <PagesAccountIndexCount accountCountFilter={{ product_variant_id: searchParam.product_variant_id }} />
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
                <>
                  <div className="flex items-center justify-center">
                    <Pagination
                      currentPage={accounts.paginationData.currentPage}
                      totalPages={accounts.paginationData.totalPage}
                      onPageChange={handlePaginationChange}
                    />
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                    {accounts.items.map(account => (
                      <AccountCard
                        key={`account-${account.id}`}
                        account={account}
                        onEditClick={() => {
                          setSelectedAccountId(account.id)
                          setDialogAccountEditOpen(true)
                        }}
                        onModifierClick={() => {
                          setSelectedAccountId(account.id)
                          setDialogAccountModifierOpen(true)
                        }}
                        onFreezeClick={() => {
                          setSelectedAccountId(account.id)
                          setDialogFreezeOpen(true)
                        }}
                        onProfileClick={() => {
                          setSelectedAccountId(account.id)
                          setDialogProfileDetailOpen(true)
                        }}
                        onExpenseClick={() => {
                          setSelectedAccountId(account.id)
                          setDialogExpenseOpen(true)
                        }}
                      />
                    ))}
                  </div>
                  <div className="flex items-center justify-center">
                    <Pagination
                      currentPage={accounts.paginationData.currentPage}
                      totalPages={accounts.paginationData.totalPage}
                      onPageChange={handlePaginationChange}
                    />
                  </div>
                </>
              )
            : (
                <NoData>Akun tidak ditemukan</NoData>
              )}
      </div>
      {/* Create Account User Dialog */}
      <PagesAccountIndexDialogUserCreate open={dialogCreateUserOpen} onOpenChange={setDialogCreateUserOpen} />
      {/* Edit Account Dialog */}
      <PagesAccountIndexDialogEdit
        open={dialogAccountEditOpen}
        onOpenChange={(open) => {
          setDialogAccountEditOpen(open)
          if (!open)
            setSelectedAccountId(undefined)
        }}
        selectedAccount={selectedAccount}
      />
      {/* Edit Modifier Dialog */}
      <PagesAccountIndexDialogEditModifier
        open={dialogAccountModifierOpen}
        onOpenChange={(open) => {
          setDialogAccountModifierOpen(open)
          if (!open)
            setSelectedAccountId(undefined)
        }}
        selectedAccount={selectedAccount}
      />
      {/* Account Freeze Dialog */}
      <PagesAccountIndexDialogFreeze
        open={dialogFreezeOpen}
        onOpenChange={(open) => {
          setDialogFreezeOpen(open)
          if (!open)
            setSelectedAccountId(undefined)
        }}
        selectedAccount={selectedAccount}
      />
      {/* Profile Detail Dialog */}
      <PagesAccountIndexDialogProfile
        open={dialogProfileDetailOpen}
        onOpenChange={(open) => {
          setDialogProfileDetailOpen(open)
          if (!open)
            setSelectedAccountId(undefined)
        }}
        selectedAccount={selectedAccount}
      />
      {/* Expense Dialog */}
      <PagesAccountIndexDialogExpense
        open={dialogExpenseOpen}
        onOpenChange={(open) => {
          setDialogExpenseOpen(open)
          if (!open)
            setSelectedAccountId(undefined)
        }}
        selectedAccount={selectedAccount}
      />
    </>
  )
}

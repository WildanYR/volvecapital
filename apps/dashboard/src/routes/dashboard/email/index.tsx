import type { Email, EmailFilter } from '@/dashboard/services/email.service'
import type { OrderByDirection } from '@/dashboard/types/order-by.type'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { EllipsisVertical, Plus, SquarePen, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useDebouncedCallback } from 'use-debounce'
import { NoData } from '@/dashboard/components/no-data'
import { Pagination } from '@/dashboard/components/pagination'
import { PasswordText } from '@/dashboard/components/password-text'
import { Button } from '@/dashboard/components/ui/button'
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/dashboard/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/dashboard/components/ui/dropdown-menu'
import { Input } from '@/dashboard/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/dashboard/components/ui/select'
import { Skeleton } from '@/dashboard/components/ui/skeleton'
import { API_URL } from '@/dashboard/constants/api-url.cont'
import { useGlobalAlertDialog } from '@/dashboard/context-providers/alert-dialog.provider'
import { useAuth } from '@/dashboard/context-providers/auth.provider'
import {
  EmailServiceGenerator,
  GetEmailsParamsSchema,
} from '@/dashboard/services/email.service'

export const Route = createFileRoute('/dashboard/email/')({
  component: RouteComponent,
  validateSearch: GetEmailsParamsSchema,
})

function RouteComponent() {
  const searchParam = Route.useSearch()
  const navigate = Route.useNavigate()
  const auth = useAuth()
  const queryClient = useQueryClient()
  const { showAlertDialog, hideAlertDialog } = useGlobalAlertDialog()
  const emailService = EmailServiceGenerator(
    API_URL,
    auth.tenant!.accessToken,
    auth.tenant!.id,
  )

  const [filter, setFilter] = useState<EmailFilter>({
    email: searchParam.email ?? '',
  })
  const [sort, setSort] = useState<string>(
    !!searchParam.order_by && !!searchParam.order_direction
      ? `${searchParam.order_by}:${searchParam.order_direction}`
      : 'default',
  )

  const { data: emails, isLoading: isFetchEmailLoading } = useQuery({
    queryKey: ['email', searchParam],
    queryFn: ({ signal }) => emailService.getAllEmail({ ...searchParam, signal }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => emailService.deleteEmail(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email'] })
      toast.success('Email berhasil dihapus.')
    },
    onError: (error) => {
      toast.error(`Gagal menghapus email: ${error.message}`)
    },
    onSettled: () => {
      hideAlertDialog()
    },
  })

  const handleDeleteEmail = (email: Email) => {
    showAlertDialog({
      title: 'Yakin ingin menghapus Email?',
      description: (
        <>
          Aksi tidak dapat dibatalkan. Ini akan menghapus email
          <span className="font-bold">
            {' '}
            {email.email}
            {' '}
          </span>
          secara permanen.
        </>
      ),
      confirmText: 'Hapus',
      isConfirming: deleteMutation.isPending,
      onConfirm: () => deleteMutation.mutate(email.id),
    })
  }

  const handleSearchEmail = useDebouncedCallback((value: string) => {
    setFilter({ ...filter, email: value })
    const email = value || undefined
    navigate({ search: prev => ({ ...prev, email, page: 1 }), replace: true })
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

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row gap-6 justify-between items-center">
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight text-balance">
          Email
        </h1>
        <Button asChild>
          <Link to="/dashboard/email/create">
            <span>
              <Plus />
            </span>
            {' '}
            Buat Email
          </Link>
        </Button>
      </div>
      <div className="flex flex-col md:flex-row justify-center items-center gap-4">
        <Input
          type="text"
          defaultValue={filter.email}
          placeholder="Cari Email..."
          onChange={e => handleSearchEmail(e.target.value)}
        />
        <div className="flex items-center gap-2 w-full md:w-min">
          <p className="text-sm">Urutkan:</p>
          <Select defaultValue={sort} onValueChange={handleSortChange}>
            <SelectTrigger className="w-full md:w-min">
              <SelectValue placeholder="Theme" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default</SelectItem>
              <SelectItem value="email:asc">Email A-Z</SelectItem>
              <SelectItem value="email:desc">Email Z-A</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {!!emails && (
        <div className="flex items-center justify-center">
          <Pagination
            currentPage={emails.paginationData.currentPage}
            totalPages={emails.paginationData.totalPage}
            onPageChange={handlePaginationChange}
          />
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isFetchEmailLoading
          ? (
              <>
                <Skeleton className="h-16 rounded-md" />
                <Skeleton className="h-16 rounded-md" />
                <Skeleton className="h-16 rounded-md" />
              </>
            )
          : emails?.items.length
            ? (
                emails.items.map(email => (
                  <Card key={email.id}>
                    <CardHeader>
                      <CardTitle>
                        <p>{email.email}</p>
                      </CardTitle>
                      <CardDescription>
                        {email.password
                          ? (
                              <PasswordText className="text-sm text-neutral-400">
                                {email.password}
                              </PasswordText>
                            )
                          : (
                              <p className="text-sm text-neutral-400 italic">
                                No Password
                              </p>
                            )}
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
                              onSelect={() =>
                                navigate({
                                  to: '/dashboard/email/$id',
                                  params: { id: email.id },
                                })}
                            >
                              <span>
                                <SquarePen />
                              </span>
                              {' '}
                              Update
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={() => handleDeleteEmail(email)}
                            >
                              <span>
                                <Trash2 />
                              </span>
                              {' '}
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </CardAction>
                    </CardHeader>
                  </Card>
                ))
              )
            : (
                <NoData>Email tidak ditemukan</NoData>
              )}
      </div>
      {!!emails && (
        <div className="flex items-center justify-center">
          <Pagination
            currentPage={emails.paginationData.currentPage}
            totalPages={emails.paginationData.totalPage}
            onPageChange={handlePaginationChange}
          />
        </div>
      )}
    </div>
  )
}

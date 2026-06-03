import type { EmailSubject } from '@/dashboard/services/email-subject.service'
import type { OrderByDirection } from '@/dashboard/types/order-by.type'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Plus, SquarePen, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useDebouncedCallback } from 'use-debounce'
import { NoData } from '@/dashboard/components/no-data'
import { Pagination } from '@/dashboard/components/pagination'
import { Button } from '@/dashboard/components/ui/button'
import { Input } from '@/dashboard/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/dashboard/components/ui/select'
import { Skeleton } from '@/dashboard/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/dashboard/components/ui/table'
import { API_URL } from '@/dashboard/constants/api-url.cont'
import { useGlobalAlertDialog } from '@/dashboard/context-providers/alert-dialog.provider'
import { useAuth } from '@/dashboard/context-providers/auth.provider'
import {
  EmailSubjectServiceGenerator,
  GetEmailSubjectsParamsSchema,
} from '@/dashboard/services/email-subject.service'

export const Route = createFileRoute('/dashboard/email-subject/')({
  component: RouteComponent,
  validateSearch: GetEmailSubjectsParamsSchema,
})

function RouteComponent() {
  const searchParam = Route.useSearch()
  const navigate = Route.useNavigate()
  const auth = useAuth()
  const queryClient = useQueryClient()
  const { showAlertDialog, hideAlertDialog } = useGlobalAlertDialog()
  const emailSubjectService = EmailSubjectServiceGenerator(
    API_URL,
    auth.tenant!.accessToken,
    auth.tenant!.id,
  )

  const [sort, setSort] = useState<string>(
    !!searchParam.order_by && !!searchParam.order_direction
      ? `${searchParam.order_by}:${searchParam.order_direction}`
      : 'default',
  )

  const { data: emailSubjects, isLoading: isFetchEmailSubjectLoading } = useQuery({
    queryKey: ['email-subject', searchParam],
    queryFn: ({ signal }) => emailSubjectService.getAllEmailSubject({ ...searchParam, signal }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => emailSubjectService.deleteEmailSubject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-subject'] })
      toast.success('Email Subject berhasil dihapus.')
    },
    onError: (error) => {
      toast.error(`Gagal menghapus email subject: ${error.message}`)
    },
    onSettled: () => {
      hideAlertDialog()
    },
  })

  const handleDeleteEmailSubject = (emailSubject: EmailSubject) => {
    showAlertDialog({
      title: 'Yakin ingin menghapus Email Subject?',
      description: (
        <>
          Aksi tidak dapat dibatalkan. Ini akan menghapus email subject
          <span className="font-bold">
            {' '}
            {emailSubject.subject}
            {' '}
          </span>
          secara permanen.
        </>
      ),
      confirmText: 'Hapus',
      isConfirming: deleteMutation.isPending,
      onConfirm: () => deleteMutation.mutate(emailSubject.id),
    })
  }

  const handleSearchSubject = useDebouncedCallback((value: string) => {
    const subject = value || undefined
    navigate({ search: prev => ({ ...prev, subject, page: 1 }), replace: true })
  }, 700)

  const handleContextChange = (value: string) => {
    const context = value === 'all' ? undefined : value
    navigate({ search: prev => ({ ...prev, context, page: 1 }), replace: true })
  }

  const handleClearFilter = () => {
    navigate({
      search: prev => ({
        ...prev,
        subject: undefined,
        context: undefined,
        page: 1,
      }),
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
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row gap-6 justify-between items-center">
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight text-balance">
          Email Subject
        </h1>
        <Button asChild>
          <Link to="/dashboard/email-subject/create">
            <span>
              <Plus />
            </span>
            {' '}
            Buat Email Subject
          </Link>
        </Button>
      </div>

      <div className="flex flex-col md:flex-row justify-center items-center gap-4">
        <Input
          key={searchParam.subject ?? ''}
          type="text"
          defaultValue={searchParam.subject ?? ''}
          placeholder="Cari Subject..."
          onChange={e => handleSearchSubject(e.target.value)}
        />
        <div className="flex items-center gap-2 w-full md:w-min">
          <p className="text-sm whitespace-nowrap">Context:</p>
          <Select
            value={searchParam.context ?? 'all'}
            onValueChange={handleContextChange}
          >
            <SelectTrigger className="w-full md:w-[220px]">
              <SelectValue placeholder="Semua Context" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Context</SelectItem>
              <SelectItem value="NETFLIX_SIGNIN_OTP">NETFLIX_SIGNIN_OTP</SelectItem>
              <SelectItem value="NETFLIX_REQ_RESET_PASSWORD">NETFLIX_REQ_RESET_PASSWORD</SelectItem>
              <SelectItem value="NETFLIX_TRAVEL_OTP">NETFLIX_TRAVEL_OTP</SelectItem>
              <SelectItem value="NETFLIX_HOUSE_CHANGE">NETFLIX_HOUSE_CHANGE</SelectItem>
              <SelectItem value="NETFLIX_VERIFY_EMAIL">NETFLIX_VERIFY_EMAIL</SelectItem>
              <SelectItem value="NETFLIX_CANCELLATION">NETFLIX_CANCELLATION</SelectItem>
              <SelectItem value="NETFLIX_MFA">NETFLIX_MFA</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          variant="outline"
          onClick={handleClearFilter}
          className="cursor-pointer w-full md:w-auto"
        >
          Clear Filter
        </Button>

        <div className="flex items-center gap-2 w-full md:w-min">
          <p className="text-sm whitespace-nowrap">Urutkan:</p>
          <Select defaultValue={sort} onValueChange={handleSortChange}>
            <SelectTrigger className="w-full md:w-[150px]">
              <SelectValue placeholder="Theme" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Terbaru</SelectItem>
              <SelectItem value="subject:asc">Subject A-Z</SelectItem>
              <SelectItem value="subject:desc">Subject Z-A</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {!!emailSubjects && (
        <div className="flex items-center justify-center">
          <Pagination
            currentPage={emailSubjects.paginationData.currentPage}
            totalPages={emailSubjects.paginationData.totalPage}
            onPageChange={handlePaginationChange}
          />
        </div>
      )}

      {isFetchEmailSubjectLoading
        ? (
            <Skeleton className="h-32 w-full rounded-md" />
          )
        : emailSubjects?.items.length
          ? (
              <Table>
                <TableHeader className="bg-secondary text-secondary-foreground">
                  <TableRow className="*:p-4">
                    <TableHead>Subject</TableHead>
                    <TableHead>Context</TableHead>
                    <TableHead>Extract Method</TableHead>
                    <TableHead className="w-[200px]">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {emailSubjects.items.map(subject => (
                    <TableRow key={subject.id} className="*:px-4 *:py-6">
                      <TableCell className="font-semibold">{subject.subject}</TableCell>
                      <TableCell>{subject.context}</TableCell>
                      <TableCell>{subject.extract_method}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="secondary" size="sm" asChild>
                            <Link
                              to="/dashboard/email-subject/$id"
                              params={{ id: subject.id }}
                            >
                              <SquarePen className="size-4 mr-1" />
                              Edit
                            </Link>
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteEmailSubject(subject)}
                            className="cursor-pointer"
                          >
                            <Trash2 className="size-4 mr-1" />
                            Hapus
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )
          : (
              <NoData>Email Subject tidak ditemukan</NoData>
            )}

      {!!emailSubjects && (
        <div className="flex items-center justify-center">
          <Pagination
            currentPage={emailSubjects.paginationData.currentPage}
            totalPages={emailSubjects.paginationData.totalPage}
            onPageChange={handlePaginationChange}
          />
        </div>
      )}
    </div>
  )
}

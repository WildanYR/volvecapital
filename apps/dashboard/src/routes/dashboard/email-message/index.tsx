import type { EmailMessageFilter } from '@/dashboard/services/email-message.service'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { Copy } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useDebouncedCallback } from 'use-debounce'
import { NoData } from '@/dashboard/components/no-data'
import { Pagination } from '@/dashboard/components/pagination'
import { Button } from '@/dashboard/components/ui/button'
import { Input } from '@/dashboard/components/ui/input'
import { Skeleton } from '@/dashboard/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/dashboard/components/ui/table'
import { API_URL } from '@/dashboard/constants/api-url.cont'
import { useAuth } from '@/dashboard/context-providers/auth.provider'
import { formatDateIdStandard } from '@/dashboard/lib/time-converter.util'
import { EmailMessageServiceGenerator, GetEmailMessageParamsSchema } from '@/dashboard/services/email-message.service'

export const Route = createFileRoute('/dashboard/email-message/')({
  component: RouteComponent,
  validateSearch: GetEmailMessageParamsSchema,
})

function RouteComponent() {
  const searchParam = Route.useSearch()
  const navigate = Route.useNavigate()
  const auth = useAuth()
  const emailMessageService = EmailMessageServiceGenerator(
    API_URL,
    auth.tenant!.accessToken,
    auth.tenant!.id,
  )

  const [filter, setFilter] = useState<EmailMessageFilter>({
    from_email: searchParam.from_email || '',
  })

  const { data: emailMessages, isLoading: isFetchEmailMessagesLoading } = useQuery({
    queryKey: ['email-message', searchParam],
    queryFn: ({ signal }) => emailMessageService.getEmailMessages({ ...searchParam, signal }),
  })

  const handleSearchFromEmail = useDebouncedCallback((value: string) => {
    setFilter({ from_email: value })
    const from_email = value || undefined
    navigate({
      search: prev => ({
        ...prev,
        from_email,
        page: 1,
      }),
      replace: true,
    })
  }, 700)

  const handlePaginationChange = (page: number) => {
    navigate({
      search: prev => ({
        ...prev,
        page,
      }),
      replace: true,
    })
  }

  const handleCopyParsedData = (parsedData: string) => {
    navigator.clipboard
      .writeText(parsedData)
      .then(() => {
        toast.success('Parsed data berhasil di copy')
      })
      .catch(() => {
        toast.error('Parsed data gagal di copy')
      })
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row gap-6 justify-between items-center">
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight text-balance">
          Email Message
        </h1>
      </div>
      <div className="flex flex-col md:flex-row justify-center items-center gap-4">
        <Input
          type="text"
          defaultValue={filter.from_email}
          placeholder="Cari Email Pengirim..."
          onChange={e => handleSearchFromEmail(e.target.value)}
        />
      </div>
      {!!emailMessages && (
        <div className="flex items-center justify-center">
          <Pagination
            currentPage={emailMessages.paginationData.currentPage}
            totalPages={emailMessages.paginationData.totalPage}
            onPageChange={handlePaginationChange}
          />
        </div>
      )}
      {isFetchEmailMessagesLoading
        ? (
            <Skeleton className="h-16 w-full rounded-md" />
          )
        : emailMessages?.items.length
          ? (
              <Table>
                <TableHeader className="bg-secondary text-secondary-foreground">
                  <TableRow className="*:p-4">
                    <TableHead>From Email</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Context</TableHead>
                    <TableHead>Parsed Data</TableHead>
                    <TableHead>Email Date</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {emailMessages.items.map(emailMessage => (
                    <TableRow key={emailMessage.id} className="*:px-4 *:py-6">
                      <TableCell>{emailMessage.from_email}</TableCell>
                      <TableCell className="max-w-sm truncate">{emailMessage.subject}</TableCell>
                      <TableCell>{emailMessage.parsed_context}</TableCell>
                      <TableCell className="max-w-sm truncate">{emailMessage.parsed_data}</TableCell>
                      <TableCell>{formatDateIdStandard(emailMessage.email_date)}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            handleCopyParsedData(emailMessage.parsed_data)
                          }}
                          className="cursor-pointer"
                        >
                          <Copy className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )
          : (
              <NoData>Email message tidak ditemukan</NoData>
            )}
      {!!emailMessages && (
        <div className="flex items-center justify-center">
          <Pagination
            currentPage={emailMessages.paginationData.currentPage}
            totalPages={emailMessages.paginationData.totalPage}
            onPageChange={handlePaginationChange}
          />
        </div>
      )}
    </div>
  )
}

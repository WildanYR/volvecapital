import type { Logs, LogsFilter } from '@/dashboard/services/logs.service'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { NoData } from '@/dashboard/components/no-data'
import { Pagination } from '@/dashboard/components/pagination'
import { Button } from '@/dashboard/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/dashboard/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/dashboard/components/ui/select'
import { Skeleton } from '@/dashboard/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/dashboard/components/ui/table'
import { Textarea } from '@/dashboard/components/ui/textarea'
import { API_URL } from '@/dashboard/constants/api-url.cont'
import { useAuth } from '@/dashboard/context-providers/auth.provider'
import { formatDateIdStandard } from '@/dashboard/lib/time-converter.util'
import { GetLogsParamsSchema, LogsServiceGenerator } from '@/dashboard/services/logs.service'

export const Route = createFileRoute('/dashboard/logs/')({
  component: RouteComponent,
  validateSearch: GetLogsParamsSchema,
})

function RouteComponent() {
  const searchParam = Route.useSearch()
  const navigate = Route.useNavigate()
  const auth = useAuth()
  const logsService = LogsServiceGenerator(
    API_URL,
    auth.tenant!.accessToken,
    auth.tenant!.id,
  )

  const [filter, setFilter] = useState<LogsFilter>({
    level: searchParam.level || '',
    context: searchParam.context || '',
  })

  const [dialogLogsDetailOpen, setDialogLogsDetailOpen] = useState(false)

  const [selectedLogs, setSelectedLogs] = useState<Logs>()

  const { data: logs, isLoading: isFetchLogsLoading } = useQuery({
    queryKey: ['logs', searchParam],
    queryFn: () => logsService.getLogs(searchParam),
  })

  const handleViewLogDetail = (log: Logs) => {
    setSelectedLogs(log)
    setDialogLogsDetailOpen(true)
  }

  const handlePaginationChange = (page: number) => {
    navigate({
      search: prev => ({
        ...prev,
        page,
      }),
      replace: true,
    })
  }

  const handleFilterApply = () => {
    const f: LogsFilter = {
      level: filter.level || undefined,
      context: filter.context || undefined,
    }
    navigate({
      search: prev => ({
        ...prev,
        ...f,
      }),
      replace: true,
    })
  }

  const handleFilterClear = () => {
    setFilter({
      level: '',
      context: '',
    })
    navigate({
      search: prev => ({
        ...prev,
        level: undefined,
        context: undefined,
      }),
      replace: true,
    })
  }

  return (
    <>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col md:flex-row gap-6 justify-between items-center">
          <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight text-balance">
            Logs
          </h1>
        </div>
        <div className="flex flex-col md:flex-row justify-center items-center gap-4">
          <div className="flex items-center gap-2 w-full">
            <p className="text-sm">Level:</p>
            <Select defaultValue={filter.level} onValueChange={v => setFilter({ ...filter, level: v })}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih filter level..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INFO">INFO</SelectItem>
                <SelectItem value="ERROR">ERROR</SelectItem>
                <SelectItem value="WARN">WARN</SelectItem>
                <SelectItem value="NEED_ACTION">
                  NEED ACTION
                </SelectItem>
                <SelectItem value="REMINDER">REMINDER</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={() => {
              handleFilterApply()
            }}
            className="cursor-pointer w-full md:w-min"
          >
            Terapkan
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              handleFilterClear()
            }}
            className="cursor-pointer w-full md:w-min"
          >
            Clear
          </Button>
        </div>
        {!!logs && (
          <div className="flex items-center justify-center">
            <Pagination
              currentPage={logs.paginationData.currentPage}
              totalPages={logs.paginationData.totalPage}
              onPageChange={handlePaginationChange}
            />
          </div>
        )}
        {isFetchLogsLoading
          ? (
              <Skeleton className="h-16 w-full rounded-md" />
            )
          : logs?.items.length
            ? (
                <Table>
                  <TableHeader className="bg-secondary text-secondary-foreground">
                    <TableRow className="*:p-4">
                      <TableHead>Level</TableHead>
                      <TableHead>Context</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead>Waktu</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.items.map(log => (
                      <TableRow key={log.id} className="*:px-4 *:py-6">
                        <TableCell>{log.level}</TableCell>
                        <TableCell>{log.context}</TableCell>
                        <TableCell className="max-w-sm truncate">{log.message}</TableCell>
                        <TableCell>
                          {formatDateIdStandard(log.created_at)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              handleViewLogDetail(log)
                            }}
                            className="cursor-pointer"
                          >
                            lihat detail
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )
            : (
                <NoData>Logs tidak ditemukan</NoData>
              )}
        {!!logs && (
          <div className="flex items-center justify-center">
            <Pagination
              currentPage={logs.paginationData.currentPage}
              totalPages={logs.paginationData.totalPage}
              onPageChange={handlePaginationChange}
            />
          </div>
        )}
      </div>
      <Dialog
        open={dialogLogsDetailOpen}
        onOpenChange={setDialogLogsDetailOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detail Logs</DialogTitle>
          </DialogHeader>
          {selectedLogs
            ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Level</p>
                    <p>{selectedLogs.level}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Context</p>
                    <p>{selectedLogs.context}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Message</p>
                    <Textarea
                      value={selectedLogs.message}
                      readOnly
                      className="max-h-40"
                    />
                    {/* <p>{selectedLogs.message}</p> */}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Waktu</p>
                    <p>{formatDateIdStandard(selectedLogs.created_at)}</p>
                  </div>
                </div>
              )
            : (
                <p>Tidak ada Log Terseleksi</p>
              )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary" className="w-full">
                Tutup
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

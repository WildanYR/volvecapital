import type { EmailMessageFilter } from '@/dashboard/services/email-message.service'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { Copy, Plus, Trash2, ExternalLink } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useDebouncedCallback } from 'use-debounce'
import { NoData } from '@/dashboard/components/no-data'
import { Pagination } from '@/dashboard/components/pagination'
import { Button } from '@/dashboard/components/ui/button'
import { Input } from '@/dashboard/components/ui/input'
import { Skeleton } from '@/dashboard/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/dashboard/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/dashboard/components/ui/dialog'
import { Label } from '@/dashboard/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/dashboard/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/dashboard/components/ui/alert-dialog'
import { API_URL } from '@/dashboard/constants/api-url.cont'
import { useAuth } from '@/dashboard/context-providers/auth.provider'
import { formatDateIdStandard } from '@/dashboard/lib/time-converter.util'
import { EmailMessageServiceGenerator, GetEmailMessageParamsSchema } from '@/dashboard/services/email-message.service'
import { EmailSubjectServiceGenerator } from '@/dashboard/services/email-subject.service'

export const Route = createFileRoute('/dashboard/email-message/')({
  component: RouteComponent,
  validateSearch: GetEmailMessageParamsSchema,
})

function RouteComponent() {
  const searchParam = Route.useSearch()
  const navigate = Route.useNavigate()
  const auth = useAuth()
  const queryClient = useQueryClient()
  
  // States for Email Subject Management
  const [isSubjectDialogOpen, setIsSubjectDialogOpen] = useState(false)
  const [subjectToDelete, setSubjectToDelete] = useState<string | null>(null)
  const [newSubject, setNewSubject] = useState({ context: 'NETFLIX_OTP', subject: '' })
  const [subjectPage, setSubjectPage] = useState(1)
  const subjectsPerPage = 5

  const emailMessageService = EmailMessageServiceGenerator(
    API_URL,
    auth.tenant!.accessToken,
    auth.tenant!.id,
  )

  const emailSubjectService = EmailSubjectServiceGenerator(
    API_URL,
    auth.tenant!.accessToken,
    auth.tenant!.id,
  )

  const [filter, setFilter] = useState<EmailMessageFilter>({
    from_email: searchParam.from_email || '',
  })

  // Queries
  const { data: emailMessages, isLoading: isFetchEmailMessagesLoading } = useQuery({
    queryKey: ['email-message', searchParam],
    queryFn: ({ signal }) => emailMessageService.getEmailMessages({ ...searchParam, signal }),
  })

  const { data: subjects, isLoading: isSubjectsLoading } = useQuery({
    queryKey: ['email-subjects'],
    queryFn: () => emailSubjectService.getEmailSubjects(),
  })

  // Pagination logic for subjects
  const totalSubjectPages = subjects ? Math.ceil(subjects.length / subjectsPerPage) : 0
  const paginatedSubjects = subjects?.slice(
    (subjectPage - 1) * subjectsPerPage,
    subjectPage * subjectsPerPage,
  )

  // Mutations for Subjects
  const createSubjectMutation = useMutation({
    mutationFn: (data: { context: string; subject: string }) =>
      emailSubjectService.createEmailSubject(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-subjects'] })
      toast.success('Subjek email berhasil ditambahkan')
      setIsSubjectDialogOpen(false)
      setNewSubject({ context: 'NETFLIX_OTP', subject: '' })
    },
    onError: () => toast.error('Gagal menambahkan subjek email'),
  })

  const deleteSubjectMutation = useMutation({
    mutationFn: (id: string) => emailSubjectService.deleteEmailSubject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-subjects'] })
      toast.success('Subjek email berhasil dihapus')
    },
    onError: () => toast.error('Gagal menghapus subjek email'),
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
      .then(() => toast.success('Data berhasil di copy'))
      .catch(() => toast.error('Gagal copy data'))
  }

  const handleAddSubject = () => {
    if (!newSubject.subject.trim()) {
      toast.error('Subjek tidak boleh kosong')
      return
    }
    createSubjectMutation.mutate(newSubject)
  }

  return (
    <div className="flex flex-col gap-10">
      {/* SECTION: Email Subject Management */}
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-extrabold tracking-tight">Email Subject Management</h2>
          <Dialog open={isSubjectDialogOpen} onOpenChange={setIsSubjectDialogOpen}>
            <DialogTrigger asChild>
              <Button className="cursor-pointer bg-red-600 hover:bg-red-700 text-white">
                <Plus className="mr-2 size-4" /> Tambah Subjek
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tambah Subjek Baru</DialogTitle>
                <DialogDescription>Subjek harus persis sama dengan yang ada di Gmail.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Context</Label>
                  <Select
                    value={newSubject.context}
                    onValueChange={(val) => setNewSubject({ ...newSubject, context: val })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NETFLIX_OTP">Netflix OTP</SelectItem>
                      <SelectItem value="NETFLIX_REQ_RESET_PASSWORD">Netflix Reset Link</SelectItem>
                      <SelectItem value="NETFLIX_GENERAL_NOTIFICATION">General Notification</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Subject Email</Label>
                  <Input
                    placeholder="Contoh: Your Netflix temporary access code"
                    value={newSubject.subject}
                    onChange={(e) => setNewSubject({ ...newSubject, subject: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsSubjectDialogOpen(false)}>Batal</Button>
                <Button onClick={handleAddSubject} disabled={createSubjectMutation.isPending}>
                  Simpan
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="rounded-md border border-border">
          <Table>
            <TableHeader className="bg-secondary text-secondary-foreground">
              <TableRow className="*:p-4">
                <TableHead>Context</TableHead>
                <TableHead>Subject Email</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isSubjectsLoading ? (
                <TableRow><TableCell colSpan={3} className="text-center py-6">Loading...</TableCell></TableRow>
              ) : subjects?.length === 0 ? (
                <TableRow><TableCell colSpan={3} className="text-center py-6 text-muted-foreground">No subjects registered.</TableCell></TableRow>
              ) : (
                paginatedSubjects?.map((s) => (
                  <TableRow key={s.id} className="group *:px-4 *:py-6 h-16">
                    <TableCell>
                      <span className={`text-[11px] font-bold uppercase px-3 py-1 rounded-md ${
                        s.context === 'NETFLIX_OTP' ? 'bg-blue-500/20 text-blue-400' :
                        s.context === 'NETFLIX_REQ_RESET_PASSWORD' ? 'bg-purple-500/20 text-purple-400' :
                        'bg-orange-500/20 text-orange-400'
                      }`}>
                        {s.context.replace('NETFLIX_', '').replace('_', ' ')}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium text-base">{s.subject}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                        onClick={() => setSubjectToDelete(s.id)}
                      >
                        <Trash2 className="size-5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        {totalSubjectPages > 1 && (
          <div className="flex justify-center">
            <Pagination
              currentPage={subjectPage}
              totalPages={totalSubjectPages}
              onPageChange={setSubjectPage}
            />
          </div>
        )}
      </div>

      <AlertDialog open={!!subjectToDelete} onOpenChange={(open) => !open && setSubjectToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Subjek Email?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Sistem tidak akan lagi memproses email dengan subjek ini secara otomatis.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-red-600"
              onClick={() => {
                if (subjectToDelete) {
                  deleteSubjectMutation.mutate(subjectToDelete)
                  setSubjectToDelete(null)
                }
              }}
            >
              Hapus Subjek
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* SECTION: Email Messages */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row gap-6 justify-between items-center">
          <h2 className="text-3xl font-extrabold tracking-tight">Recent Email Messages</h2>
          <Input
            className="md:max-w-xs h-10"
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
          ? <Skeleton className="h-40 w-full rounded-md" />
          : emailMessages?.items.length
            ? (
                <div className="rounded-md border border-border">
                  <Table>
                    <TableHeader className="bg-secondary text-secondary-foreground">
                      <TableRow className="*:p-4">
                        <TableHead>From Email</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Context</TableHead>
                        <TableHead>Parsed Data</TableHead>
                        <TableHead>Email Date</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {emailMessages.items.map(emailMessage => (
                        <TableRow key={emailMessage.id} className="*:px-4 *:py-6">
                          <TableCell className="font-medium">{emailMessage.from_email}</TableCell>
                          <TableCell className="max-w-sm truncate text-muted-foreground">{emailMessage.subject}</TableCell>
                          <TableCell>
                            <span className="text-[11px] font-bold px-3 py-1 bg-accent rounded-md">{emailMessage.parsed_context}</span>
                          </TableCell>
                          <TableCell className="max-w-xs truncate font-mono text-xs">{emailMessage.parsed_data}</TableCell>
                          <TableCell className="text-sm">{formatDateIdStandard(emailMessage.email_date)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {emailMessage.parsed_data.startsWith('http') && (
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => window.open(emailMessage.parsed_data, '_blank')}
                                  className="cursor-pointer border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                                  title="Buka Link"
                                >
                                  <ExternalLink className="size-4" />
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleCopyParsedData(emailMessage.parsed_data)}
                                className="cursor-pointer"
                                title="Copy Data"
                              >
                                <Copy className="size-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )
            : <NoData>Email message tidak ditemukan</NoData>
        }

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
    </div>
  )
}

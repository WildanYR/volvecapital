import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Plus, Trash2, Users } from 'lucide-react'
import { toast } from 'sonner'
import { PermissionGate } from '@/dashboard/components/permission-gate'
import { ProtectedButton } from '@/dashboard/components/protected-button'
import { Badge } from '@/dashboard/components/ui/badge'
import { Button } from '@/dashboard/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/dashboard/components/ui/card'
import { Skeleton } from '@/dashboard/components/ui/skeleton'
import { API_URL } from '@/dashboard/constants/api-url.cont'
import { useGlobalAlertDialog } from '@/dashboard/context-providers/alert-dialog.provider'
import { useAuth } from '@/dashboard/context-providers/auth.provider'
import { DashboardUserServiceGenerator } from '@/dashboard/services/dashboard-user.service'

export const Route = createFileRoute('/dashboard/staff/')({
  component: RouteComponent,
})

function RouteComponent() {
  const auth = useAuth()
  const queryClient = useQueryClient()
  const { showAlertDialog, hideAlertDialog } = useGlobalAlertDialog()

  const staffService = DashboardUserServiceGenerator(API_URL, auth.tenant!.accessToken, auth.tenant!.id)

  const { data: staff, isLoading } = useQuery({
    queryKey: ['staff'],
    queryFn: () => staffService.getAll(),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => staffService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] })
      toast.success('Staff berhasil dihapus')
      hideAlertDialog()
    },
    onError: (error: any) => {
      toast.error(`Gagal menghapus staff: ${error.message}`)
      hideAlertDialog()
    },
  })

  const handleDelete = (user: any) => {
    showAlertDialog({
      title: 'Yakin ingin menghapus Staff?',
      description: (
        <>
          Akun staff
          {' '}
          <span className="font-bold">{user.name}</span>
          {' '}
          akan dihapus permanen.
        </>
      ),
      confirmText: 'Hapus',
      isConfirming: deleteMutation.isPending,
      onConfirm: () => deleteMutation.mutate(user.id),
    })
  }

  const toggleActive = useMutation({
    mutationFn: ({ id, is_active }: { id: string, is_active: boolean }) =>
      staffService.update(id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] })
      toast.success('Status staff diperbarui')
    },
    onError: (error: any) => toast.error(`Gagal: ${error.message}`),
  })

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Manajemen Staff</h1>
          <p className="text-muted-foreground mt-1">Kelola akun staff yang dapat login ke dashboard</p>
        </div>
        <PermissionGate permission="user.create">
          <Button asChild>
            <Link to="/dashboard/staff/create">
              <Plus className="size-4" />
              Tambah Staff
            </Link>
          </Button>
        </PermissionGate>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-lg" />)
          : staff?.map(user => (
              <Card key={user.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <Users className="size-4 text-primary shrink-0" />
                      <CardTitle className="text-base">{user.name}</CardTitle>
                    </div>
                    <Badge variant={user.is_active ? 'default' : 'secondary'}>
                      {user.is_active ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <Badge variant="outline" className="w-fit">{user.role?.name ?? '-'}</Badge>
                </CardHeader>
                <CardContent className="flex gap-2 pt-2">
                  <PermissionGate permission="user.edit">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleActive.mutate({ id: user.id, is_active: !user.is_active })}
                    >
                      {user.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                    </Button>
                  </PermissionGate>
                  <ProtectedButton
                    permission="user.delete"
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive ml-auto"
                    onClick={() => handleDelete(user)}
                  >
                    <Trash2 className="size-4" />
                  </ProtectedButton>
                </CardContent>
              </Card>
            ))}
      </div>

      {!isLoading && !staff?.length && (
        <div className="text-center py-16 text-muted-foreground">
          <Users className="size-12 mx-auto mb-4 opacity-30" />
          <p>Belum ada staff. Tambah staff pertama Anda.</p>
        </div>
      )}
    </div>
  )
}

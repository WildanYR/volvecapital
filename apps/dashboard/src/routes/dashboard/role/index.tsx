import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ChevronRight, Plus, Shield, SquarePen, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { PermissionGate } from '@/dashboard/components/permission-gate'
import { ProtectedButton } from '@/dashboard/components/protected-button'
import { Badge } from '@/dashboard/components/ui/badge'
import { Button } from '@/dashboard/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/dashboard/components/ui/card'
import { Skeleton } from '@/dashboard/components/ui/skeleton'
import { API_URL } from '@/dashboard/constants/api-url.cont'
import { useGlobalAlertDialog } from '@/dashboard/context-providers/alert-dialog.provider'
import { useAuth } from '@/dashboard/context-providers/auth.provider'
import { RoleServiceGenerator } from '@/dashboard/services/role.service'

export const Route = createFileRoute('/dashboard/role/')({
  component: RouteComponent,
})

function RouteComponent() {
  const auth = useAuth()
  const queryClient = useQueryClient()
  const { showAlertDialog, hideAlertDialog } = useGlobalAlertDialog()

  const roleService = RoleServiceGenerator(API_URL, auth.tenant!.accessToken, auth.tenant!.id)

  const { data: roles, isLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: () => roleService.getAll(),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => roleService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      toast.success('Role berhasil dihapus')
      hideAlertDialog()
    },
    onError: (error: any) => {
      toast.error(`Gagal menghapus role: ${error.message}`)
      hideAlertDialog()
    },
  })

  const handleDelete = (role: any) => {
    showAlertDialog({
      title: 'Yakin ingin menghapus Role?',
      description: (
        <>
          Role
          {' '}
          <span className="font-bold">{role.name}</span>
          {' '}
          akan dihapus permanen.
          Staff yang memiliki role ini tidak akan bisa login.
        </>
      ),
      confirmText: 'Hapus',
      isConfirming: deleteMutation.isPending,
      onConfirm: () => deleteMutation.mutate(role.id),
    })
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Role & Permission</h1>
          <p className="text-muted-foreground mt-1">Kelola role dan hak akses staff dashboard</p>
        </div>
        <PermissionGate permission="role.create">
          <Button asChild>
            <Link to="/dashboard/role/create">
              <Plus className="size-4" />
              Buat Role Baru
            </Link>
          </Button>
        </PermissionGate>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-36 rounded-lg" />
            ))
          : roles?.map(role => (
              <Card key={role.id} className="flex flex-col">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Shield className="size-5 text-primary shrink-0" />
                      <CardTitle className="text-lg">{role.name}</CardTitle>
                    </div>
                    <Badge variant="secondary">
                      {role.permissions?.length ?? 0}
                      {' '}
                      akses
                    </Badge>
                  </div>
                  {role.description && (
                    <CardDescription className="mt-1">{role.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="flex gap-2 mt-auto pt-4">
                  <PermissionGate permission="role.edit">
                    <Button asChild variant="outline" size="sm" className="flex-1">
                      <Link to="/dashboard/role/$roleId" params={{ roleId: role.id }}>
                        <SquarePen className="size-4" />
                        Edit
                        <ChevronRight className="size-4 ml-auto" />
                      </Link>
                    </Button>
                  </PermissionGate>
                  <ProtectedButton
                    permission="role.delete"
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(role)}
                  >
                    <Trash2 className="size-4" />
                  </ProtectedButton>
                </CardContent>
              </Card>
            ))}
      </div>

      {!isLoading && !roles?.length && (
        <div className="text-center py-16 text-muted-foreground">
          <Shield className="size-12 mx-auto mb-4 opacity-30" />
          <p>Belum ada role. Buat role pertama Anda.</p>
        </div>
      )}
    </div>
  )
}

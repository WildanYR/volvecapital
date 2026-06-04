import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Save } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/dashboard/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/dashboard/components/ui/card'
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
import { useAuth } from '@/dashboard/context-providers/auth.provider'
import { DashboardUserServiceGenerator } from '@/dashboard/services/dashboard-user.service'
import { RoleServiceGenerator } from '@/dashboard/services/role.service'

export const Route = createFileRoute('/dashboard/staff/create')({
  component: RouteComponent,
})

function RouteComponent() {
  const auth = useAuth()
  const navigate = useNavigate()
  const staffService = DashboardUserServiceGenerator(API_URL, auth.tenant!.accessToken, auth.tenant!.id)
  const roleService = RoleServiceGenerator(API_URL, auth.tenant!.accessToken, auth.tenant!.id)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [roleId, setRoleId] = useState('')

  const { data: roles, isLoading: isLoadingRoles } = useQuery({
    queryKey: ['roles'],
    queryFn: () => roleService.getAll(),
  })

  const createMutation = useMutation({
    mutationFn: () => staffService.create({ name, email, password, role_id: roleId }),
    onSuccess: () => {
      toast.success('Staff berhasil dibuat')
      navigate({ to: '/dashboard/staff' })
    },
    onError: (error: any) => toast.error(`Gagal membuat staff: ${error.message}`),
  })

  const isValid = name.trim() && email.trim() && password.trim() && roleId

  return (
    <div className="flex flex-col gap-6 max-w-md">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/dashboard/staff' })}>
          <ArrowLeft className="size-4" />
        </Button>
        <h1 className="text-3xl font-extrabold tracking-tight">Tambah Staff</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Data Staff</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Nama Lengkap</label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="cth: Budi Santoso" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Email (untuk login)</label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="budi@example.com" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Password</label>
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 6 karakter" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Role</label>
            {isLoadingRoles
              ? <Skeleton className="h-10 rounded-md" />
              : (
                  <Select onValueChange={setRoleId} value={roleId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles?.map(role => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
          </div>
          <Button
            className="w-full gap-2 mt-2"
            disabled={!isValid || createMutation.isPending}
            onClick={() => createMutation.mutate()}
          >
            <Save className="size-4" />
            {createMutation.isPending ? 'Menyimpan...' : 'Tambah Staff'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

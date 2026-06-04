import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Save } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/dashboard/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/dashboard/components/ui/card'
import { Checkbox } from '@/dashboard/components/ui/checkbox'
import { Input } from '@/dashboard/components/ui/input'
import { Skeleton } from '@/dashboard/components/ui/skeleton'
import { API_URL } from '@/dashboard/constants/api-url.cont'
import { useAuth } from '@/dashboard/context-providers/auth.provider'
import { PermissionServiceGenerator } from '@/dashboard/services/permission.service'
import { RoleServiceGenerator } from '@/dashboard/services/role.service'

export const Route = createFileRoute('/dashboard/role/create')({
  component: RouteComponent,
})

const PERMISSION_GROUPS: Record<string, string> = {
  dashboard: 'Dashboard',
  product: 'Produk',
  user: 'Staff',
  role: 'Role',
  transaction: 'Transaksi',
  report: 'Laporan',
  voucher: 'Voucher',
  platform_product: 'Platform Produk',
  account: 'Akun (Slug)',
  email: 'Email',
  email_message: 'System Message',
  wallet: 'Keuangan / Wallet',
  landing: 'Landing Page CMS',
  content: 'Artikel & Tutorial',
  withdrawal: 'Penarikan Dana',
}

function RouteComponent() {
  const auth = useAuth()
  const navigate = useNavigate()
  const roleService = RoleServiceGenerator(API_URL, auth.tenant!.accessToken, auth.tenant!.id)
  const permissionService = PermissionServiceGenerator(API_URL, auth.tenant!.accessToken, auth.tenant!.id)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set())

  const { data: permissions, isLoading: isLoadingPermissions } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => permissionService.getAll(),
  })

  const createMutation = useMutation({
    mutationFn: () =>
      roleService.create({
        name,
        description,
        permission_ids: Array.from(selectedPermissions),
      }),
    onSuccess: () => {
      toast.success('Role berhasil dibuat')
      navigate({ to: '/dashboard/role' })
    },
    onError: (error: any) => {
      toast.error(`Gagal membuat role: ${error.message}`)
    },
  })

  const togglePermission = (id: string) => {
    setSelectedPermissions((prev) => {
      const next = new Set(prev)
      if (next.has(id))
        next.delete(id)
      else next.add(id)
      return next
    })
  }

  const grouped = permissions?.reduce<Record<string, typeof permissions>>((acc, perm) => {
    const group = perm.name.split('.')[0]
    if (!acc[group])
      acc[group] = []
    acc[group].push(perm)
    return acc
  }, {}) ?? {}

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/dashboard/role' })}>
          <ArrowLeft className="size-4" />
        </Button>
        <h1 className="text-3xl font-extrabold tracking-tight">Buat Role Baru</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informasi Role</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Nama Role</label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="cth: Staff CS"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Deskripsi</label>
            <Input
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Deskripsi singkat tentang role ini"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Permissions</CardTitle>
          <CardDescription>Pilih akses yang dimiliki role ini</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoadingPermissions
            ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)
            : Object.entries(grouped)
                .sort(([groupA], [groupB]) => {
                  const order = [
                    'dashboard',
                    'product',
                    'platform_product',
                    'email',
                    'account',
                    'transaction',
                    'voucher',
                    'email_message',
                    'wallet',
                    'setting',
                    'content',
                    'role',
                    'user',
                    'withdrawal',
                  ]
                  const indexA = order.indexOf(groupA)
                  const indexB = order.indexOf(groupB)
                  return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB)
                })
                .filter(([group]) => group !== 'report') // Remove report
                .map(([group, perms]) => (
                <div key={group} className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    {PERMISSION_GROUPS[group] ?? group}
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {perms.map(perm => (
                      <label
                        key={perm.id}
                        className="flex items-center gap-2 cursor-pointer rounded-md p-2 hover:bg-muted/50 transition-colors"
                      >
                        <Checkbox
                          checked={selectedPermissions.has(perm.id)}
                          onCheckedChange={() => togglePermission(perm.id)}
                        />
                        <span className="text-sm">{perm.name.split('.')[1]}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
        </CardContent>
      </Card>

      <Button
        onClick={() => createMutation.mutate()}
        disabled={!name.trim() || createMutation.isPending}
        className="self-start gap-2"
      >
        <Save className="size-4" />
        {createMutation.isPending ? 'Menyimpan...' : 'Simpan Role'}
      </Button>
    </div>
  )
}

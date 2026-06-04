import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2, Save } from 'lucide-react'
import { Button } from '@/dashboard/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/dashboard/components/ui/card'
import { Input } from '@/dashboard/components/ui/input'
import { useAuth } from '@/dashboard/context-providers/auth.provider'
import { API_URL } from '@/dashboard/constants/api-url.cont'
import { TenantServiceGenerator } from '@/dashboard/services/tenant.service'

import { DashboardUserServiceGenerator } from '@/dashboard/services/dashboard-user.service'

export const Route = createFileRoute('/dashboard/accountsetting/')({
  component: RouteComponent,
})

function RouteComponent() {
  const auth = useAuth()
  const tenantService = TenantServiceGenerator(
    API_URL,
    auth.tenant!.accessToken,
    auth.tenant!.id,
  )
  const dashboardUserService = DashboardUserServiceGenerator(
    API_URL,
    auth.tenant!.accessToken,
    auth.tenant!.id,
  )

  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const changePasswordMutation = useMutation({
    mutationFn: (payload: any) => {
      if (auth.tenant?.role === 'TENANT_OWNER') {
        return tenantService.changePassword(payload)
      }
      return dashboardUserService.changePassword(payload)
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Password berhasil diperbarui')
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
    },
    onError: (error: any) => {
      toast.error(`Gagal memperbarui password: ${error.message}`)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error('Semua field wajib diisi')
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error('Password baru dan konfirmasi tidak cocok')
      return
    }

    changePasswordMutation.mutate({
      oldPassword,
      newPassword,
    })
  }

  return (
    <div className="flex flex-col gap-8 max-w-4xl">
      <div className="flex flex-col md:flex-row gap-6 justify-between items-center">
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight">
          Pengaturan Akun
        </h1>
      </div>

      <Card className="bg-card">
        <CardHeader>
          <CardTitle>Keamanan & Password</CardTitle>
          <CardDescription>
            Ubah password akun {auth.tenant?.role === 'TENANT_OWNER' ? 'tenant owner' : 'staff'} Anda untuk keamanan yang lebih baik.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2 max-w-md">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold">Password Lama</label>
                <Link to="/forgot-password" className="text-xs text-muted-foreground hover:text-primary transition-colors">Lupa password lama?</Link>
              </div>
              <Input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Masukkan password lama"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
              <div className="space-y-2">
                <label className="text-sm font-bold">Password Baru</label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Masukkan password baru"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold">Konfirmasi Password Baru</label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Konfirmasi password baru"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="destructive"
              className="gap-2 font-semibold bg-red-800 hover:bg-red-900 text-white border border-red-700/50"
              disabled={changePasswordMutation.isPending}
            >
              {changePasswordMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              Perbarui Password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

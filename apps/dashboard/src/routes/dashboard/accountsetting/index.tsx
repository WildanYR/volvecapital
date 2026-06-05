import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2, Save, ShieldCheck, Users, Laptop, Smartphone, LogOut, Globe } from 'lucide-react'
import { Button } from '@/dashboard/components/ui/button'
import { PermissionGate } from '@/dashboard/components/permission-gate'
import { can } from '@/dashboard/lib/permission'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/dashboard/components/ui/card'
import { Input } from '@/dashboard/components/ui/input'
import { Checkbox } from '@/dashboard/components/ui/checkbox'
import { Badge } from '@/dashboard/components/ui/badge'
import { useAuth } from '@/dashboard/context-providers/auth.provider'
import { API_URL } from '@/dashboard/constants/api-url.cont'
import { TenantServiceGenerator } from '@/dashboard/services/tenant.service'

import { DashboardUserServiceGenerator } from '@/dashboard/services/dashboard-user.service'

export const Route = createFileRoute('/dashboard/accountsetting/')({
  component: RouteComponent,
})

function parseUserAgent(ua: string) {
  let browser = 'Unknown Browser'
  let os = 'Unknown OS'

  if (ua.includes('Edg/')) browser = 'Microsoft Edge'
  else if (ua.includes('Chrome/')) browser = 'Google Chrome'
  else if (ua.includes('Firefox/')) browser = 'Mozilla Firefox'
  else if (ua.includes('Safari/') && !ua.includes('Chrome/')) browser = 'Apple Safari'
  else if (ua.includes('Opera/') || ua.includes('OPR/')) browser = 'Opera'

  if (ua.includes('Windows')) os = 'Windows'
  else if (ua.includes('Mac OS')) os = 'macOS'
  else if (ua.includes('Linux')) os = 'Linux'
  else if (ua.includes('Android')) os = 'Android'
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS'

  return `${browser} di ${os}`
}

function RouteComponent() {
  const auth = useAuth()
  if (!auth.tenant) return null

  const showManajemen = can('role.view', auth.tenant) || can('user.view', auth.tenant)
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

  const queryClient = useQueryClient()
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [logoutAllDevices, setLogoutAllDevices] = useState(false)

  const hasViewAll = auth.tenant?.role !== 'DASHBOARD_USER' || auth.tenant?.permissions?.includes('device.view')
  const hasDeleteAll = auth.tenant?.role !== 'DASHBOARD_USER' || auth.tenant?.permissions?.includes('device.delete')

  const { data: devices, isLoading: isLoadingDevices } = useQuery({
    queryKey: ['device-sessions'],
    queryFn: () => {
      if (hasViewAll) {
        if (auth.tenant?.role !== 'DASHBOARD_USER') {
          return tenantService.getAllDeviceSessions()
        }
        return dashboardUserService.getAllDeviceSessions()
      }

      if (auth.tenant?.role !== 'DASHBOARD_USER') {
        return tenantService.getDeviceSessions()
      }
      return dashboardUserService.getDeviceSessions()
    },
  })

  const revokeSessionMutation = useMutation({
    mutationFn: (sessionId: string) => {
      if (hasDeleteAll) {
        if (auth.tenant?.role !== 'DASHBOARD_USER') {
          return tenantService.revokeAnyDeviceSession(sessionId)
        }
        return dashboardUserService.revokeAnyDeviceSession(sessionId)
      }

      if (auth.tenant?.role !== 'DASHBOARD_USER') {
        return tenantService.revokeDeviceSession(sessionId)
      }
      return dashboardUserService.revokeDeviceSession(sessionId)
    },
    onSuccess: () => {
      toast.success('Sesi berhasil diakhiri')
      queryClient.invalidateQueries({ queryKey: ['device-sessions'] })
    },
    onError: (error: any) => {
      toast.error(`Gagal mengakhiri sesi: ${error.message}`)
    },
  })

  const changePasswordMutation = useMutation({
    mutationFn: (payload: any) => {
      if (auth.tenant?.role !== 'DASHBOARD_USER') {
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
      logoutAllDevices,
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
            Ubah password akun {auth.tenant?.role !== 'DASHBOARD_USER' ? 'tenant owner' : 'staff'} Anda untuk keamanan yang lebih baik.
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

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="logoutAll" 
                checked={logoutAllDevices}
                onCheckedChange={(checked) => setLogoutAllDevices(checked as boolean)}
              />
              <label
                htmlFor="logoutAll"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Keluarkan saya dari semua perangkat lain
              </label>
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

      {hasViewAll && (
        <Card className="bg-card">
          <CardHeader>
          <CardTitle>{hasViewAll ? 'Kelola Akses Semua Perangkat' : 'Kelola Akses dan Perangkat'}</CardTitle>
          <CardDescription>
            {hasViewAll 
              ? 'Daftar semua perangkat yang saat ini terhubung ke tenant Anda. Anda dapat mengeluarkan perangkat yang mencurigakan.'
              : 'Perangkat ini sudah login ke akun Anda. Jika ada perangkat yang tidak Anda kenali, segera keluarkan.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingDevices ? (
            <div className="flex justify-center p-8"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="flex flex-col gap-4">
              {devices?.map((device: any) => (
                <div key={device.id} className="flex items-center justify-between p-4 border rounded-lg bg-background/50">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-primary/10 rounded-full text-primary">
                      {device.device_info.toLowerCase().includes('mobile') || device.device_info.toLowerCase().includes('android') || device.device_info.toLowerCase().includes('iphone') ? (
                        <Smartphone className="size-6" />
                      ) : (
                        <Laptop className="size-6" />
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{parseUserAgent(device.device_info)}</span>
                        {device.owner_name && (
                          <span className="text-xs text-muted-foreground">
                            ({device.owner_role === 'Owner' ? 'Owner' : `Staff: ${device.owner_name}`})
                          </span>
                        )}
                        {device.id === auth.tenant?.session_id && (
                          <Badge variant="default" className="text-[10px] h-5">Perangkat Ini</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Globe className="size-3" />
                          <span>{device.ip_address}</span>
                        </div>
                        <span>Aktif pada {new Date(device.last_active_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })} WIB</span>
                      </div>
                    </div>
                  </div>
                  {device.id !== auth.tenant?.session_id && (
                    <Button 
                      type="button"
                      variant="outline" 
                      size="sm" 
                      onClick={() => revokeSessionMutation.mutate(device.id)}
                      disabled={revokeSessionMutation.isPending || (!hasDeleteAll && device.user_id !== auth.tenant?.userId)}
                      className="gap-2 text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200 disabled:opacity-50"
                    >
                      <LogOut className="size-4" />
                      Keluar
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
          </CardContent>
        </Card>
      )}

      {showManajemen && (
        <Card className="bg-card">
          <CardHeader>
            <CardTitle>Manajemen</CardTitle>
            <CardDescription>
              Atur role, permission, dan kelola daftar akun staff Anda.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <PermissionGate permission="role.view">
              <Link to="/dashboard/role">
                <Button variant="outline" className="w-full h-32 flex flex-col items-center justify-center gap-3 border-dashed hover:border-primary hover:text-primary transition-colors hover:bg-primary/5">
                  <ShieldCheck className="size-8" />
                  <span className="font-semibold text-base">Role & Permission</span>
                </Button>
              </Link>
            </PermissionGate>
            
            <PermissionGate permission="user.view">
              <Link to="/dashboard/staff">
                <Button variant="outline" className="w-full h-32 flex flex-col items-center justify-center gap-3 border-dashed hover:border-primary hover:text-primary transition-colors hover:bg-primary/5">
                  <Users className="size-8" />
                  <span className="font-semibold text-base">Staff</span>
                </Button>
              </Link>
            </PermissionGate>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

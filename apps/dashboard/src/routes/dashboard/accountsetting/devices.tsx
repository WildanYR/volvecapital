import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Loader2, Laptop, Smartphone, LogOut, Globe, ChevronLeft } from 'lucide-react'
import { Button } from '@/dashboard/components/ui/button'
import { Badge } from '@/dashboard/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/dashboard/components/ui/card'
import { Link } from '@tanstack/react-router'
import { useAuth } from '@/dashboard/context-providers/auth.provider'
import { API_URL } from '@/dashboard/constants/api-url.cont'
import { TenantServiceGenerator } from '@/dashboard/services/tenant.service'
import { DashboardUserServiceGenerator } from '@/dashboard/services/dashboard-user.service'

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

export const Route = createFileRoute('/dashboard/accountsetting/devices')({
  component: DevicesPage,
})

function DevicesPage() {
  const auth = useAuth()
  if (!auth.tenant) return null

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

  const groupedDevices = useMemo(() => {
    if (!devices) return {}
    return devices.reduce((acc: any, device: any) => {
      const isOwner = device.owner_role === 'Owner' || device.owner_role === 'Admin'
      const groupName = isOwner ? 'Tenant Owner' : `Staff: ${device.owner_name || 'Unknown'}`
      if (!acc[groupName]) {
        acc[groupName] = {
          label: groupName,
          isOwner,
          userId: device.user_id,
          devices: [],
        }
      }
      acc[groupName].devices.push(device)
      return acc
    }, {})
  }, [devices, auth.tenant])

  const [revokingGroupId, setRevokingGroupId] = useState<string | null>(null)

  const handleRevokeAll = async (groupName: string, groupDevices: any[]) => {
    setRevokingGroupId(groupName)
    try {
      const devicesToRevoke = groupDevices.filter(d => d.id !== auth.tenant?.session_id)
      for (const device of devicesToRevoke) {
        await revokeSessionMutation.mutateAsync(device.id)
      }
      if (devicesToRevoke.length > 0) {
        toast.success(`Berhasil mengeluarkan ${devicesToRevoke.length} perangkat`)
      }
      queryClient.invalidateQueries({ queryKey: ['device-sessions'] })
    } catch (error: any) {
      toast.error(`Gagal mengeluarkan beberapa perangkat`)
    } finally {
      setRevokingGroupId(null)
    }
  }

  return (
    <div className="flex flex-col gap-8 max-w-4xl">
      <div className="flex flex-col md:flex-row gap-6 justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/dashboard/accountsetting">
              <ChevronLeft className="size-5" />
            </Link>
          </Button>
          <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight">
            Perangkat Saya
          </h1>
        </div>
      </div>

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
            <div className="flex flex-col gap-8">
              {Object.values(groupedDevices).map((group: any) => {
                const canRevokeGroup = hasDeleteAll || group.userId === auth.tenant?.userId
                const otherDevices = group.devices.filter((d: any) => d.id !== auth.tenant?.session_id)
                const hasOtherDevices = otherDevices.length > 0

                return (
                  <div key={group.label} className="flex flex-col gap-4">
                    <div className="flex items-center justify-between pb-2 border-b">
                      <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                        {group.label}
                        <Badge variant="secondary" className="ml-2">{group.devices.length} Perangkat</Badge>
                      </h3>
                      {hasOtherDevices && canRevokeGroup && (
                        <Button 
                          type="button"
                          variant="destructive" 
                          size="sm" 
                          onClick={() => handleRevokeAll(group.label, group.devices)}
                          disabled={revokingGroupId === group.label || revokeSessionMutation.isPending}
                          className="gap-2"
                        >
                          {revokingGroupId === group.label ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <LogOut className="size-4" />
                          )}
                          Keluarkan Semua
                        </Button>
                      )}
                    </div>
                    <div className="flex flex-col gap-3">
                      {group.devices.map((device: any) => (
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
                              disabled={revokingGroupId !== null || revokeSessionMutation.isPending || !canRevokeGroup}
                              className="gap-2 text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200 disabled:opacity-50"
                            >
                              <LogOut className="size-4" />
                              Keluar
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

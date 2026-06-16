import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { useAuth } from '@/dashboard/context-providers/auth.provider'
import { API_URL } from '@/dashboard/constants/api-url.cont'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/dashboard/components/ui/card'
import { Loader2, Check, X, ChevronLeft, Users, UserX, Clock, CalendarOff, AlertCircle, FileText, Save } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/dashboard/components/ui/tabs'
import { Badge } from '@/dashboard/components/ui/badge'
import { Button } from '@/dashboard/components/ui/button'
import { Input } from '@/dashboard/components/ui/input'
import { toast } from 'sonner'

export const Route = createFileRoute('/dashboard/accountsetting/attendance/')({
  component: AdminAttendancePage,
})

function AdminAttendancePage() {
  const auth = useAuth()
  const queryClient = useQueryClient()

  const [tolerance, setTolerance] = useState(10)
  const [maxOff, setMaxOff] = useState(1)

  const headers = {
    'Authorization': `VC ${auth.tenant?.accessToken}`,
    'x-tenant-id': auth.tenant?.id || '',
    'Content-Type': 'application/json',
  }

  const { data: attendances, isLoading: isLoadingAttendance } = useQuery({
    queryKey: ['admin', 'attendance'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/admin/attendance`, { headers })
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    },
  })

  const { data: weeklyOffs, isLoading: isLoadingWeeklyOff } = useQuery({
    queryKey: ['admin', 'weekly-off'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/admin/weekly-off`, { headers })
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    },
  })

  const { data: dashboardStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['admin', 'attendance', 'dashboard'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/admin/attendance/dashboard`, { headers })
      if (!res.ok) throw new Error('Failed to fetch stats')
      return res.json()
    },
  })

  const { data: setting, isLoading: isLoadingSetting } = useQuery({
    queryKey: ['admin', 'attendance', 'setting'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/admin/attendance/setting`, { headers })
      if (!res.ok) throw new Error('Failed to fetch setting')
      return res.json()
    },
  })

  useEffect(() => {
    if (setting) {
      setTolerance(setting.late_tolerance_minutes)
      setMaxOff(setting.max_off_per_day)
    }
  }, [setting])

  const updateSettingMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_URL}/admin/attendance/setting`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          late_tolerance_minutes: Number(tolerance),
          max_off_per_day: Number(maxOff)
        })
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || 'Gagal menyimpan pengaturan')
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success('Pengaturan absensi berhasil disimpan')
      queryClient.invalidateQueries({ queryKey: ['admin', 'attendance', 'setting'] })
    },
    onError: (err: any) => toast.error(err.message),
  })

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_URL}/admin/weekly-off/${id}/approve`, {
        method: 'POST',
        headers,
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || 'Gagal approve')
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success('Pengajuan disetujui')
      queryClient.invalidateQueries({ queryKey: ['admin', 'weekly-off'] })
    },
    onError: (err: any) => toast.error(err.message),
  })

  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_URL}/admin/weekly-off/${id}/reject`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ note: 'Ditolak oleh admin' }),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || 'Gagal reject')
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success('Pengajuan ditolak')
      queryClient.invalidateQueries({ queryKey: ['admin', 'weekly-off'] })
    },
    onError: (err: any) => toast.error(err.message),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/dashboard/accountsetting">
              <ChevronLeft className="size-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Kelola Absensi</h1>
            <p className="text-muted-foreground">Pantau kehadiran harian dan atur jadwal libur karyawan.</p>
          </div>
      </div>
      <div className="flex justify-end">
        <Button asChild>
          <Link to="/dashboard/accountsetting/attendance/report">
            <FileText className="size-4 mr-2" />
            Laporan Absensi
          </Link>
        </Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-2">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-full dark:bg-blue-900/50 dark:text-blue-400"><Users className="size-5" /></div>
            <p className="text-sm font-medium text-muted-foreground">Sedang Bekerja</p>
            <h3 className="text-2xl font-bold">{isLoadingStats ? <Loader2 className="animate-spin size-4" /> : dashboardStats?.working || 0}</h3>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-2">
            <div className="p-3 bg-gray-100 text-gray-600 rounded-full dark:bg-gray-800 dark:text-gray-400"><UserX className="size-5" /></div>
            <p className="text-sm font-medium text-muted-foreground">Belum Absen</p>
            <h3 className="text-2xl font-bold">{isLoadingStats ? <Loader2 className="animate-spin size-4" /> : dashboardStats?.not_started || 0}</h3>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-2">
            <div className="p-3 bg-amber-100 text-amber-600 rounded-full dark:bg-amber-900/50 dark:text-amber-400"><Clock className="size-5" /></div>
            <p className="text-sm font-medium text-muted-foreground">Terlambat Hari Ini</p>
            <h3 className="text-2xl font-bold">{isLoadingStats ? <Loader2 className="animate-spin size-4" /> : dashboardStats?.late || 0}</h3>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-2">
            <div className="p-3 bg-green-100 text-green-600 rounded-full dark:bg-green-900/50 dark:text-green-400"><CalendarOff className="size-5" /></div>
            <p className="text-sm font-medium text-muted-foreground">Libur Hari Ini</p>
            <h3 className="text-2xl font-bold">{isLoadingStats ? <Loader2 className="animate-spin size-4" /> : dashboardStats?.weekly_off || 0}</h3>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-2">
            <div className="p-3 bg-red-100 text-red-600 rounded-full dark:bg-red-900/50 dark:text-red-400"><AlertCircle className="size-5" /></div>
            <p className="text-sm font-medium text-muted-foreground">Missing Checkout</p>
            <h3 className="text-2xl font-bold">{isLoadingStats ? <Loader2 className="animate-spin size-4" /> : dashboardStats?.missing_checkout || 0}</h3>
          </CardContent>
        </Card>
      </div>
      <Tabs defaultValue="today">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="today">Absensi Hari Ini</TabsTrigger>
          <TabsTrigger value="weeklyoff">Pengajuan Libur</TabsTrigger>
          <TabsTrigger value="setting">Pengaturan</TabsTrigger>
        </TabsList>
        <TabsContent value="today" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Kehadiran Hari Ini</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingAttendance ? (
                <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>
              ) : (
                <div className="relative w-full overflow-auto">
                  <table className="w-full caption-bottom text-sm">
                    <thead className="[&_tr]:border-b">
                      <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Karyawan</th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Shift</th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Masuk</th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Pulang</th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                      </tr>
                    </thead>
                    <tbody className="[&_tr:last-child]:border-0">
                      {attendances?.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-4 text-center text-muted-foreground">Belum ada data kehadiran hari ini</td>
                        </tr>
                      )}
                      {attendances?.map((record: any) => (
                        <tr key={record.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                          <td className="p-4 align-middle font-medium">{record.user?.name}</td>
                          <td className="p-4 align-middle">{record.shift?.name}</td>
                          <td className="p-4 align-middle">{record.start_time ? new Date(record.start_time).toLocaleTimeString("id-ID") : "-"}</td>
                          <td className="p-4 align-middle">{record.end_time ? new Date(record.end_time).toLocaleTimeString("id-ID") : "-"}</td>
                          <td className="p-4 align-middle">
                            <Badge variant="outline">{record.status.replace(/_/g, " ").toUpperCase()}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="weeklyoff" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Daftar Pengajuan Libur</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingWeeklyOff ? (
                <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>
              ) : (
                <div className="relative w-full overflow-auto">
                  <table className="w-full caption-bottom text-sm">
                    <thead className="[&_tr]:border-b">
                      <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Karyawan</th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Hari Libur Lama</th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Hari Libur Baru</th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                        <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="[&_tr:last-child]:border-0">
                      {weeklyOffs?.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-4 text-center text-muted-foreground">Belum ada pengajuan</td>
                        </tr>
                      )}
                      {weeklyOffs?.map((record: any) => (
                        <tr key={record.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                          <td className="p-4 align-middle font-medium">{record.user?.name}</td>
                          <td className="p-4 align-middle">{record.current_off_day || "-"}</td>
                          <td className="p-4 align-middle font-semibold capitalize">{record.requested_off_day}</td>
                          <td className="p-4 align-middle">
                            <Badge variant={record.status === 'pending' ? 'secondary' : record.status === 'approved' ? 'default' : 'destructive'}>
                              {record.status.toUpperCase()}
                            </Badge>
                          </td>
                          <td className="p-4 align-middle text-right">
                            {record.status === 'pending' && (
                              <div className="flex justify-end gap-2">
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="text-green-600 hover:text-green-700"
                                  onClick={() => approveMutation.mutate(record.id)}
                                  disabled={approveMutation.isPending || rejectMutation.isPending}
                                >
                                  <Check className="size-4 mr-1" /> Approve
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="text-red-600 hover:text-red-700"
                                  onClick={() => rejectMutation.mutate(record.id)}
                                  disabled={approveMutation.isPending || rejectMutation.isPending}
                                >
                                  <X className="size-4 mr-1" /> Reject
                                </Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="setting" className="mt-6">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Pengaturan Absensi</CardTitle>
              <CardDescription>Atur kebijakan dan konfigurasi sistem absensi karyawan.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoadingSetting ? (
                <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Toleransi Keterlambatan (Menit)</label>
                    <Input 
                      type="number" 
                      min="0" 
                      value={tolerance} 
                      onChange={(e) => setTolerance(Number(e.target.value))} 
                    />
                    <p className="text-xs text-muted-foreground">Karyawan yang melakukan check-in melewati waktu shift + toleransi akan ditandai Terlambat.</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Maksimal Libur Per Hari</label>
                    <Input 
                      type="number" 
                      min="0" 
                      value={maxOff} 
                      onChange={(e) => setMaxOff(Number(e.target.value))} 
                    />
                    <p className="text-xs text-muted-foreground">Batas kuota jumlah staf yang boleh mengambil hari libur mingguan pada hari yang sama.</p>
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={() => updateSettingMutation.mutate()}
                    disabled={updateSettingMutation.isPending}
                  >
                    {updateSettingMutation.isPending ? <Loader2 className="animate-spin size-4 mr-2" /> : <Save className="size-4 mr-2" />}
                    Simpan Pengaturan
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useAuth } from '@/dashboard/context-providers/auth.provider'
import { API_URL } from '@/dashboard/constants/api-url.cont'
import { Button } from '@/dashboard/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/dashboard/components/ui/card'
import { Input } from '@/dashboard/components/ui/input'
import { Badge } from '@/dashboard/components/ui/badge'
import { Textarea } from '@/dashboard/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/dashboard/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/dashboard/components/ui/tabs'
import { toast } from 'sonner'
import { Loader2, CalendarCheck, Clock, CalendarDays } from 'lucide-react'

export const Route = createFileRoute('/dashboard/attendance/me')({
  component: AttendanceMePage,
})

function AttendanceMePage() {
  const auth = useAuth()
  const queryClient = useQueryClient()
  const [workSummary, setWorkSummary] = useState('')
  const [selectedDay, setSelectedDay] = useState('')
  const [historyFilter, setHistoryFilter] = useState('30days')

  const headers = {
    'Authorization': `VC ${auth.tenant?.accessToken}`,
    'x-tenant-id': auth.tenant?.id || '',
    'Content-Type': 'application/json',
  }

  const { data: today, isLoading: isLoadingToday } = useQuery({
    queryKey: ['attendance', 'today'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/attendance/me/today`, { headers })
      if (!res.ok) throw new Error('Failed to fetch today status')
      return res.json()
    },
  })

  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['attendance', 'stats'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/attendance/me/stats`, { headers })
      if (!res.ok) throw new Error('Failed to fetch stats')
      return res.json()
    },
  })

  const { data: history, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['attendance', 'history', historyFilter],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/attendance/me/history?filter=${historyFilter}`, { headers })
      if (!res.ok) throw new Error('Failed to fetch history')
      return res.json()
    },
  })

  const { data: pageData, isLoading: isLoadingWeeklyOff } = useQuery({
    queryKey: ['attendance', 'weekly-off-requests'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/attendance/me/weekly-off`, { headers })
      if (!res.ok) throw new Error('Failed to fetch requests')
      return res.json()
    },
  })

  const startMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_URL}/attendance/start`, {
        method: 'POST',
        headers,
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || 'Gagal Start Shift')
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success('Shift berhasil dimulai')
      queryClient.invalidateQueries({ queryKey: ['attendance'] })
    },
    onError: (err: any) => toast.error(err.message),
  })

  const endMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_URL}/attendance/end`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ work_summary: workSummary }),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || 'Gagal End Shift')
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success('Shift berhasil diakhiri')
      setWorkSummary('')
      queryClient.invalidateQueries({ queryKey: ['attendance'] })
    },
    onError: (err: any) => toast.error(err.message),
  })

  const requestMutation = useMutation({
    mutationFn: async () => {
      if (!selectedDay) throw new Error('Pilih hari libur terlebih dahulu')
      const res = await fetch(`${API_URL}/attendance/me/weekly-off`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ requested_off_day: selectedDay }),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || 'Gagal mengajukan libur')
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success('Pengajuan libur berhasil dikirim')
      setSelectedDay('')
      queryClient.invalidateQueries({ queryKey: ['attendance', 'weekly-off-requests'] })
    },
    onError: (err: any) => toast.error(err.message),
  })

  if (isLoadingToday) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>

  const isWorking = today?.status === 'working'
  const isCompleted = ['completed', 'late', 'early_leave', 'late_and_early_leave'].includes(today?.status)

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Absensi & Libur</h1>
        <p className="text-muted-foreground">Kelola kehadiran, jam kerja, dan pengajuan libur mingguan Anda di sini.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Total Hadir Bulan Ini</p>
              <div className="text-2xl font-bold">
                {isLoadingStats ? <Loader2 className="animate-spin size-4" /> : stats?.total_present || 0}
              </div>
            </div>
            <div className="p-3 bg-primary/10 rounded-full text-primary">
              <CalendarCheck className="size-5" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Total Telat Bulan Ini</p>
              <div className="text-2xl font-bold text-amber-600">
                {isLoadingStats ? <Loader2 className="animate-spin size-4" /> : stats?.total_late || 0}
              </div>
            </div>
            <div className="p-3 bg-amber-500/10 rounded-full text-amber-600">
              <Clock className="size-5" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Total Jam Kerja Bulan Ini</p>
              <div className="text-2xl font-bold">
                {isLoadingStats ? <Loader2 className="animate-spin size-4" /> : `${stats?.total_work_hours || 0} Jam`}
              </div>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-full text-blue-600">
              <CalendarDays className="size-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="attendance" className="space-y-6">
        <TabsList>
          <TabsTrigger value="attendance">Absensi Harian</TabsTrigger>
          <TabsTrigger value="weekly-off">Pengajuan Libur</TabsTrigger>
        </TabsList>

        <TabsContent value="attendance" className="space-y-6">
          <Card>
        <CardHeader>
          <CardTitle>Status Hari Ini</CardTitle>
          <CardDescription>{new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {today?.is_off ? (
            <div className="p-4 bg-muted rounded-lg text-center">
              <h3 className="text-lg font-medium">Hari ini adalah jadwal libur Anda</h3>
              <p className="text-muted-foreground">Selamat beristirahat!</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Jadwal Shift</p>
                  <p className="text-lg font-semibold">
                    {(today?.shift || today?.attendance?.shift) ? `${(today?.shift || today?.attendance?.shift).name} (${(today?.shift || today?.attendance?.shift).start_time} - ${(today?.shift || today?.attendance?.shift).end_time})` : 'Belum ada shift assigned'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge variant={today?.status === 'not_started' ? 'secondary' : isWorking ? 'default' : 'outline'} className="text-sm mt-1">
                    {today?.status?.replace(/_/g, ' ').toUpperCase()}
                  </Badge>
                </div>
              </div>

              <div className="space-y-4 border-l pl-6">
                {!isWorking && !isCompleted && (
                  <Button 
                    className="w-full h-12 text-lg" 
                    onClick={() => startMutation.mutate()}
                    disabled={startMutation.isPending}
                  >
                    {startMutation.isPending ? <Loader2 className="animate-spin mr-2" /> : null}
                    Start Shift (Check In)
                  </Button>
                )}

                {isWorking && (
                  <div className="space-y-3">
                    <Textarea 
                      placeholder="Ringkasan pekerjaan hari ini..." 
                      value={workSummary}
                      onChange={(e) => setWorkSummary(e.target.value)}
                    />
                    <Button 
                      className="w-full h-12 text-lg" 
                      variant="destructive"
                      onClick={() => endMutation.mutate()}
                      disabled={endMutation.isPending}
                    >
                      {endMutation.isPending ? <Loader2 className="animate-spin mr-2" /> : null}
                      End Shift (Check Out)
                    </Button>
                  </div>
                )}

                {isCompleted && (
                  <div className="p-4 bg-green-50 text-green-700 rounded-lg text-center dark:bg-green-950 dark:text-green-300">
                    <p className="font-medium">Anda telah menyelesaikan shift hari ini.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Riwayat Absensi</CardTitle>
          <Select value={historyFilter} onValueChange={setHistoryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Pilih Periode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Hari Ini</SelectItem>
              <SelectItem value="week">Minggu Ini</SelectItem>
              <SelectItem value="month">Bulan Ini</SelectItem>
              <SelectItem value="30days">30 Hari Terakhir</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {isLoadingHistory ? (
            <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>
          ) : (
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b">
                  <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Tanggal</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Shift</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Check In</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Check Out</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {history?.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-muted-foreground">Tidak ada data riwayat</td>
                    </tr>
                  )}
                  {history?.map((record: any) => (
                    <tr key={record.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                      <td className="p-4 align-middle">{record.attendance_date}</td>
                      <td className="p-4 align-middle">{record.shift?.name}</td>
                      <td className="p-4 align-middle">{record.start_time ? new Date(record.start_time).toLocaleTimeString('id-ID') : '-'}</td>
                      <td className="p-4 align-middle">{record.end_time ? new Date(record.end_time).toLocaleTimeString('id-ID') : '-'}</td>
                      <td className="p-4 align-middle">
                        <Badge variant="outline">{record.status.replace(/_/g, ' ').toUpperCase()}</Badge>
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

      <TabsContent value="weekly-off" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Ajukan Hari Libur Baru</CardTitle>
            <CardDescription>Pilih hari dalam seminggu yang ingin Anda jadikan hari libur reguler. Pengajuan ini memerlukan persetujuan Admin.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end">
              <div className="space-y-2 flex-1">
                <label className="text-sm font-medium">Pilih Hari</label>
                <Select value={selectedDay} onValueChange={setSelectedDay}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih hari libur..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Monday">Senin (Monday)</SelectItem>
                    <SelectItem value="Tuesday">Selasa (Tuesday)</SelectItem>
                    <SelectItem value="Wednesday">Rabu (Wednesday)</SelectItem>
                    <SelectItem value="Thursday">Kamis (Thursday)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={() => requestMutation.mutate()} 
                disabled={!selectedDay || requestMutation.isPending}
              >
                {requestMutation.isPending && <Loader2 className="animate-spin mr-2 size-4" />}
                Kirim Pengajuan
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Riwayat Pengajuan Libur</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingWeeklyOff ? (
              <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>
            ) : (
              <div className="relative w-full overflow-auto">
                <table className="w-full caption-bottom text-sm">
                  <thead className="[&_tr]:border-b">
                    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Tanggal Pengajuan</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Hari Libur Lama</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Hari Libur Baru</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody className="[&_tr:last-child]:border-0">
                    {(!pageData?.requests || pageData?.requests?.length === 0) && (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-muted-foreground">Belum ada riwayat pengajuan</td>
                      </tr>
                    )}
                    {pageData?.requests?.map((req: any) => {
                      const indonesianDays: Record<string, string> = {
                        'Monday': 'Senin', 'Tuesday': 'Selasa', 'Wednesday': 'Rabu', 
                        'Thursday': 'Kamis', 'Friday': 'Jumat', 'Saturday': 'Sabtu', 'Sunday': 'Minggu'
                      }
                      return (
                      <tr key={req.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                        <td className="p-4 align-middle">
                          {new Date(req.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </td>
                        <td className="p-4 align-middle">{req.current_off_day ? `${indonesianDays[req.current_off_day]} (${req.current_off_day})` : '-'}</td>
                        <td className="p-4 align-middle font-semibold">{indonesianDays[req.requested_off_day]} ({req.requested_off_day})</td>
                        <td className="p-4 align-middle">
                          <Badge 
                            variant={
                              req.status === 'approved' ? 'default' : 
                              req.status === 'rejected' ? 'destructive' : 
                              'secondary'
                            }
                          >
                            {req.status.toUpperCase()}
                          </Badge>
                        </td>
                      </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
      </Tabs>
    </div>
  )
}

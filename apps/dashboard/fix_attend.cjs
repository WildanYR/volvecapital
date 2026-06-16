import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/dashboard/context-providers/auth.provider'
import { API_URL } from '@/dashboard/constants/api-url.cont'
import { Card, CardContent, CardHeader, CardTitle } from '@/dashboard/components/ui/card'
import { Loader2, Check, X, ChevronLeft } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/dashboard/components/ui/tabs'
import { Badge } from '@/dashboard/components/ui/badge'
import { Button } from '@/dashboard/components/ui/button'
import { toast } from 'sonner'

export const Route = createFileRoute('/dashboard/accountsetting/attendance')({
  component: AdminAttendancePage,
})

function AdminAttendancePage() {
  const auth = useAuth()
  const queryClient = useQueryClient()

  const headers = {
    'Authorization': \`VC \${auth.tenant?.accessToken}\`,
    'x-tenant-id': auth.tenant?.id || '',
    'Content-Type': 'application/json',
  }

  const { data: attendances, isLoading: isLoadingAttendance } = useQuery({
    queryKey: ['admin', 'attendance'],
    queryFn: async () => {
      const res = await fetch(\`\${API_URL}/admin/attendance\`, { headers })
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    },
  })

  const { data: weeklyOffs, isLoading: isLoadingWeeklyOff } = useQuery({
    queryKey: ['admin', 'weekly-off'],
    queryFn: async () => {
      const res = await fetch(\`\${API_URL}/admin/weekly-off\`, { headers })
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    },
  })

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(\`\${API_URL}/admin/weekly-off/\${id}/approve\`, {
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
      const res = await fetch(\`\${API_URL}/admin/weekly-off/\${id}/reject\`, {
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
      <Tabs defaultValue="today">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="today">Absensi Hari Ini</TabsTrigger>
          <TabsTrigger value="weeklyoff">Pengajuan Libur</TabsTrigger>
        </TabsList>
        <TabsContent value="today" className="mt-6">

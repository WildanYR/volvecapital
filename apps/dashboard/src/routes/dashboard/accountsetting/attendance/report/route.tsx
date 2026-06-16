import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useAuth } from '@/dashboard/context-providers/auth.provider'
import { API_URL } from '@/dashboard/constants/api-url.cont'
import { Card, CardContent, CardHeader, CardTitle } from '@/dashboard/components/ui/card'
import { Loader2, ChevronLeft, Download, Filter } from 'lucide-react'
import { Button } from '@/dashboard/components/ui/button'
import { Input } from '@/dashboard/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/dashboard/components/ui/select'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'

export const Route = createFileRoute('/dashboard/accountsetting/attendance/report')({
  component: AdminAttendanceReportPage,
})

function AdminAttendanceReportPage() {
  const auth = useAuth()
  
  const today = new Date()
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0]

  const [startDate, setStartDate] = useState(firstDay)
  const [endDate, setEndDate] = useState(lastDay)
  const [selectedUser, setSelectedUser] = useState('all')

  const headers = {
    'Authorization': `VC ${auth.tenant?.accessToken}`,
    'x-tenant-id': auth.tenant?.id || '',
    'Content-Type': 'application/json',
  }

  const { data: users } = useQuery({
    queryKey: ['dashboard-users'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/dashboard-user`, { headers })
      if (!res.ok) return []
      return res.json()
    },
  })

  const queryUrl = `${API_URL}/admin/attendance/report?start_date=${startDate}&end_date=${endDate}${selectedUser !== 'all' ? `&user_id=${selectedUser}` : ''}`

  const { data: report, isLoading } = useQuery({
    queryKey: ['admin', 'attendance', 'report', startDate, endDate, selectedUser],
    queryFn: async () => {
      const res = await fetch(queryUrl, { headers })
      if (!res.ok) throw new Error('Failed to fetch report')
      return res.json()
    },
  })

  const handleExportCSV = () => {
    if (!report || report.length === 0) {
      toast.error('Tidak ada data untuk diexport')
      return
    }

    const exportData = report.map((r: any) => ({
      'Nama Karyawan': r.name,
      'Hari Kerja': r.work_days,
      'Hari Libur': r.off_days,
      'Total Hadir': r.present,
      'Total Telat': r.late,
      'Pulang Cepat': r.early_leave,
      'Alpha': r.absent,
      'Missing Checkout': r.missing_checkout,
      'Total Jam Kerja': r.total_work_hours
    }))

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Laporan_Absensi')
    XLSX.writeFile(wb, `Laporan_Absensi_${startDate}_to_${endDate}.csv`, { bookType: 'csv' })
    toast.success('Berhasil export ke CSV')
  }

  const handleExportExcel = () => {
    if (!report || report.length === 0) {
      toast.error('Tidak ada data untuk diexport')
      return
    }

    const exportData = report.map((r: any) => ({
      'Nama Karyawan': r.name,
      'Hari Kerja': r.work_days,
      'Hari Libur': r.off_days,
      'Total Hadir': r.present,
      'Total Telat': r.late,
      'Pulang Cepat': r.early_leave,
      'Alpha': r.absent,
      'Missing Checkout': r.missing_checkout,
      'Total Jam Kerja': r.total_work_hours
    }))

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Laporan_Absensi')
    XLSX.writeFile(wb, `Laporan_Absensi_${startDate}_to_${endDate}.xlsx`)
    toast.success('Berhasil export ke Excel')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="shrink-0">
            <Link to="/dashboard/accountsetting/attendance">
              <ChevronLeft className="size-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Laporan Absensi</h1>
            <p className="text-muted-foreground">Rekapitulasi dan ekspor data absensi karyawan.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="size-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={handleExportExcel}>
            <Download className="size-4 mr-2" />
            Export Excel
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="bg-muted/30">
          <div className="flex items-center gap-2">
            <Filter className="size-5 text-muted-foreground" />
            <CardTitle className="text-lg">Filter Laporan</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tanggal Mulai</label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="[&::-webkit-calendar-picker-indicator]:invert" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tanggal Selesai</label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="[&::-webkit-calendar-picker-indicator]:invert" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Pilih Karyawan</label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua Karyawan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Karyawan</SelectItem>
                  {users?.map((u: any) => (
                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rekapitulasi Absensi</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8"><Loader2 className="animate-spin size-8 text-muted-foreground" /></div>
          ) : (
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b">
                  <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Karyawan</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Hari Kerja</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Libur</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Hadir</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Telat</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Pulang Cepat</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Alpha</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Miss Out</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Total Jam</th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {(!report || report.length === 0) && (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-muted-foreground">Tidak ada data untuk periode ini</td>
                    </tr>
                  )}
                  {report?.map((row: any, i: number) => (
                    <tr key={i} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                      <td className="p-4 align-middle font-medium">{row.name}</td>
                      <td className="p-4 align-middle">{row.work_days}</td>
                      <td className="p-4 align-middle">{row.off_days}</td>
                      <td className="p-4 align-middle font-medium">{row.present}</td>
                      <td className="p-4 align-middle">{row.late}</td>
                      <td className="p-4 align-middle">{row.early_leave}</td>
                      <td className="p-4 align-middle font-medium">{row.absent}</td>
                      <td className="p-4 align-middle">{row.missing_checkout}</td>
                      <td className="p-4 align-middle font-bold">{row.total_work_hours} J</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useAuth } from '@/dashboard/context-providers/auth.provider'
import { API_URL } from '@/dashboard/constants/api-url.cont'
import { Card, CardContent, CardHeader, CardTitle } from '@/dashboard/components/ui/card'
import { Button } from '@/dashboard/components/ui/button'
import { Input } from '@/dashboard/components/ui/input'
import { Label } from '@/dashboard/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/dashboard/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/dashboard/components/ui/select'
import { Loader2, Plus, Users, Pencil, ChevronLeft } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { toast } from 'sonner'

export const Route = createFileRoute('/dashboard/accountsetting/shift')({
  component: AdminShiftPage,
})

function AdminShiftPage() {
  const auth = useAuth()
  const queryClient = useQueryClient()
  
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isAssignOpen, setIsAssignOpen] = useState(false)
  
  // Shift Form State
  const [editingShiftId, setEditingShiftId] = useState<string | null>(null)
  const [shiftForm, setShiftForm] = useState({ name: '', start_time: '09:00', end_time: '17:00' })
  
  // Assign Form State
  const [assignData, setAssignData] = useState<{ id?: string, userId: string, shiftId: string, effective_date: string }>({ userId: '', shiftId: '', effective_date: new Date().toISOString().split('T')[0] })

  const headers = {
    'Authorization': `VC ${auth.tenant?.accessToken}`,
    'x-tenant-id': auth.tenant?.id || '',
    'Content-Type': 'application/json',
  }

  const { data: shifts, isLoading: isLoadingShifts } = useQuery({
    queryKey: ['admin', 'shifts'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/admin/shifts`, { headers })
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    },
  })

  const { data: users } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/dashboard-user`, { headers })
      if (!res.ok) throw new Error('Failed to fetch users')
      return res.json()
    },
  })

  const { data: assignments, isLoading: isLoadingAssignments } = useQuery({
    queryKey: ['admin', 'shifts', 'assignments'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/admin/shifts/assignments`, { headers })
      if (!res.ok) throw new Error('Failed to fetch assignments')
      return res.json()
    },
  })

  const createOrUpdateMutation = useMutation({
    mutationFn: async () => {
      const url = editingShiftId 
        ? `${API_URL}/admin/shifts/${editingShiftId}` 
        : `${API_URL}/admin/shifts`
      
      const res = await fetch(url, {
        method: editingShiftId ? 'PUT' : 'POST',
        headers,
        body: JSON.stringify({ ...shiftForm, is_active: true }),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || (editingShiftId ? 'Gagal mengubah shift' : 'Gagal membuat shift'))
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success(editingShiftId ? 'Shift berhasil diubah' : 'Shift berhasil dibuat')
      setIsCreateOpen(false)
      setEditingShiftId(null)
      setShiftForm({ name: '', start_time: '09:00', end_time: '17:00' })
      queryClient.invalidateQueries({ queryKey: ['admin', 'shifts'] })
    },
    onError: (err: any) => toast.error(err.message),
  })

  const assignMutation = useMutation({
    mutationFn: async () => {
      const url = assignData.id 
        ? `${API_URL}/admin/shifts/assignments/${assignData.id}`
        : `${API_URL}/admin/shifts/users/${assignData.userId}`
        
      const res = await fetch(url, {
        method: assignData.id ? 'PUT' : 'POST',
        headers,
        body: JSON.stringify({ 
          shift_id: assignData.shiftId,
          effective_date: assignData.effective_date 
        }),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || (assignData.id ? 'Gagal mengubah penugasan' : 'Gagal assign shift'))
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success(assignData.id ? 'Penugasan berhasil diubah' : 'Shift berhasil ditugaskan')
      setIsAssignOpen(false)
      setAssignData({ userId: '', shiftId: '', effective_date: new Date().toISOString().split('T')[0] })
      queryClient.invalidateQueries({ queryKey: ['admin'] })
    },
    onError: (err: any) => toast.error(err.message),
  })

  const openEdit = (shift: any) => {
    setEditingShiftId(shift.id)
    setShiftForm({ 
      name: shift.name, 
      start_time: shift.start_time?.substring(0, 5) || '09:00', 
      end_time: shift.end_time?.substring(0, 5) || '17:00' 
    })
    setIsCreateOpen(true)
  }

  const openCreate = () => {
    setEditingShiftId(null)
    setShiftForm({ name: '', start_time: '09:00', end_time: '17:00' })
    setIsCreateOpen(true)
  }

  const openEditAssignment = (assignment: any) => {
    setAssignData({
      id: assignment.id,
      userId: assignment.user_id,
      shiftId: assignment.shift_id,
      effective_date: assignment.effective_date,
    })
    setIsAssignOpen(true)
  }

  const openAssign = () => {
    setAssignData({ userId: '', shiftId: '', effective_date: new Date().toISOString().split('T')[0] })
    setIsAssignOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="shrink-0">
            <Link to="/dashboard/accountsetting">
              <ChevronLeft className="size-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Kelola Shift</h1>
            <p className="text-muted-foreground">Kelola jam kerja shift karyawan.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
            <Button variant="outline" onClick={openAssign}><Users className="size-4 mr-2" /> Assign Shift</Button>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{assignData.id ? 'Edit Penugasan Shift' : 'Tugaskan Shift ke Karyawan'}</DialogTitle>
                <DialogDescription>{assignData.id ? 'Ubah shift atau tanggal berlaku.' : 'Pilih karyawan dan shift untuk ditugaskan.'}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Pilih Karyawan</Label>
                  <Select value={assignData.userId} onValueChange={(val) => setAssignData({ ...assignData, userId: val })} disabled={!!assignData.id}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih karyawan..." />
                    </SelectTrigger>
                    <SelectContent>
                      {users?.map((u: any) => (
                        <SelectItem key={u.id} value={u.id}>{u.name} ({u.email})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Pilih Shift</Label>
                  <Select value={assignData.shiftId} onValueChange={(val) => setAssignData({ ...assignData, shiftId: val })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih shift..." />
                    </SelectTrigger>
                    <SelectContent>
                      {shifts?.map((s: any) => (
                        <SelectItem key={s.id} value={s.id}>{s.name} ({s.start_time} - {s.end_time})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Mulai Berlaku (Tanggal)</Label>
                  <Input 
                    type="date" 
                    value={assignData.effective_date} 
                    onChange={(e) => setAssignData({ ...assignData, effective_date: e.target.value })} 
                    className="[&::-webkit-calendar-picker-indicator]:invert"
                  />
                </div>
                <Button 
                  className="w-full mt-4" 
                  onClick={() => assignMutation.mutate()}
                  disabled={assignMutation.isPending || !assignData.userId || !assignData.shiftId || !assignData.effective_date}
                >
                  {assignMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Simpan Penugasan
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <Button onClick={openCreate}><Plus className="size-4 mr-2" /> Tambah Shift</Button>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingShiftId ? 'Edit Shift' : 'Buat Shift Baru'}</DialogTitle>
                <DialogDescription>Masukkan nama shift dan jam operasionalnya.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Nama Shift</Label>
                  <Input 
                    value={shiftForm.name} 
                    onChange={(e) => setShiftForm({ ...shiftForm, name: e.target.value })} 
                    placeholder="Contoh: Shift Pagi" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Jam Mulai</Label>
                    <div className="flex gap-2">
                      <Select 
                        value={shiftForm.start_time.split(':')[0]} 
                        onValueChange={(val) => setShiftForm({ ...shiftForm, start_time: `${val}:${shiftForm.start_time.split(`:`)[1] || `00`}` })}
                      >
                        <SelectTrigger><SelectValue placeholder="Jam" /></SelectTrigger>
                        <SelectContent className="max-h-48">
                          {Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0')).map(h => (
                            <SelectItem key={h} value={h}>{h}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span className="text-lg font-bold self-center">:</span>
                      <Select 
                        value={shiftForm.start_time.split(':')[1]} 
                        onValueChange={(val) => setShiftForm({ ...shiftForm, start_time: `${shiftForm.start_time.split(`:`)[0] || `09`}:${val}` })}
                      >
                        <SelectTrigger><SelectValue placeholder="Menit" /></SelectTrigger>
                        <SelectContent className="max-h-48">
                          {['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'].map(m => (
                            <SelectItem key={m} value={m}>{m}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Jam Selesai</Label>
                    <div className="flex gap-2">
                      <Select 
                        value={shiftForm.end_time.split(':')[0]} 
                        onValueChange={(val) => setShiftForm({ ...shiftForm, end_time: `${val}:${shiftForm.end_time.split(`:`)[1] || `00`}` })}
                      >
                        <SelectTrigger><SelectValue placeholder="Jam" /></SelectTrigger>
                        <SelectContent className="max-h-48">
                          {Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0')).map(h => (
                            <SelectItem key={h} value={h}>{h}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span className="text-lg font-bold self-center">:</span>
                      <Select 
                        value={shiftForm.end_time.split(':')[1]} 
                        onValueChange={(val) => setShiftForm({ ...shiftForm, end_time: `${shiftForm.end_time.split(`:`)[0] || `17`}:${val}` })}
                      >
                        <SelectTrigger><SelectValue placeholder="Menit" /></SelectTrigger>
                        <SelectContent className="max-h-48">
                          {['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'].map(m => (
                            <SelectItem key={m} value={m}>{m}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <Button 
                  className="w-full mt-4" 
                  onClick={() => createOrUpdateMutation.mutate()}
                  disabled={createOrUpdateMutation.isPending || !shiftForm.name || !shiftForm.start_time || !shiftForm.end_time}
                >
                  {createOrUpdateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Simpan Shift
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Shift</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingShifts ? (
            <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>
          ) : (
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b">
                  <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Nama Shift</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Start</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">End</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Aktif</th>
                    <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Aksi</th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {shifts?.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-muted-foreground">Belum ada data shift</td>
                    </tr>
                  )}
                  {shifts?.map((shift: any) => (
                    <tr key={shift.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                      <td className="p-4 align-middle">{shift.name}</td>
                      <td className="p-4 align-middle">{shift.start_time}</td>
                      <td className="p-4 align-middle">{shift.end_time}</td>
                      <td className="p-4 align-middle">{shift.is_active ? "Ya" : "Tidak"}</td>
                      <td className="p-4 align-middle text-right">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(shift)}>
                          <Pencil className="size-4 mr-2" /> Edit
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Penugasan Shift Karyawan</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingAssignments ? (
            <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>
          ) : (
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b">
                  <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Karyawan</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Shift</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Mulai Berlaku</th>
                    <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Aksi</th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {assignments?.length === 0 && (
                    <tr>
                      <td colSpan={3} className="p-4 text-center text-muted-foreground">Belum ada karyawan yang ditugaskan shift</td>
                    </tr>
                  )}
                  {assignments?.map((assignment: any) => (
                    <tr key={assignment.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                      <td className="p-4 align-middle font-medium">
                        {assignment.user?.name}
                        <div className="text-xs text-muted-foreground">{assignment.user?.email}</div>
                      </td>
                      <td className="p-4 align-middle">
                        <span className="font-medium">{assignment.shift?.name}</span>
                        <div className="text-xs text-muted-foreground">{assignment.shift?.start_time} - {assignment.shift?.end_time}</div>
                      </td>
                      <td className="p-4 align-middle">{assignment.effective_date}</td>
                      <td className="p-4 align-middle text-right">
                        <Button variant="ghost" size="sm" onClick={() => openEditAssignment(assignment)}>
                          <Pencil className="size-4 mr-2" /> Edit
                        </Button>
                      </td>
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

import { createFileRoute } from '@tanstack/react-router'
import { useState, Fragment } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { API_URL } from '@/dashboard/constants/api-url.cont'
import { useAuth } from '@/dashboard/context-providers/auth.provider'
import { AccountingServiceGenerator } from '@/dashboard/services/accounting.service'
import { toast } from 'sonner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/dashboard/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/dashboard/components/ui/card'
import { Badge } from '@/dashboard/components/ui/badge'
import { Button } from '@/dashboard/components/ui/button'
import { Input } from '@/dashboard/components/ui/input'
import { Label } from '@/dashboard/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/dashboard/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/dashboard/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/dashboard/components/ui/select'
import { Plus, Edit, Trash2, ChevronDown, ChevronRight } from 'lucide-react'

export const Route = createFileRoute('/dashboard/accounting/coa/')({
  component: CoaList,
})

const groupOrder = ['ASET', 'KEWAJIBAN', 'MODAL', 'PENDAPATAN', 'HPP', 'BEBAN']
const groupNames: Record<string, string> = {
  ASET: 'Aset',
  KEWAJIBAN: 'Kewajiban',
  MODAL: 'Modal',
  PENDAPATAN: 'Pendapatan',
  HPP: 'Harga Pokok Penjualan (HPP)',
  BEBAN: 'Beban',
}

const getNormalBalance = (type: string) => {
  switch (type) {
    case 'ASET':
    case 'HPP':
    case 'BEBAN':
      return 'DEBIT'
    case 'KEWAJIBAN':
    case 'MODAL':
    case 'PENDAPATAN':
      return 'KREDIT'
    default:
      return 'DEBIT'
  }
}

function CoaList() {
  const auth = useAuth()
  const queryClient = useQueryClient()
  const accountingService = AccountingServiceGenerator(API_URL, auth.tenant!.accessToken, auth.tenant!.id)

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [coaToDelete, setCoaToDelete] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: 'ASET',
    normal_balance: 'DEBIT',
    is_active: true,
  })

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    ASET: true,
    KEWAJIBAN: true,
    MODAL: true,
    PENDAPATAN: true,
    HPP: true,
    BEBAN: true,
  })

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }))
  }

  const { data: coaList, isLoading } = useQuery({
    queryKey: ['accounting', 'coa'],
    queryFn: ({ signal }) => accountingService.getCoaList({ signal }),
  })

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => accountingService.createCoa(data),
    onSuccess: () => {
      toast.success('Bagan Akun berhasil ditambahkan')
      queryClient.invalidateQueries({ queryKey: ['accounting', 'coa'] })
      setIsDialogOpen(false)
    },
    onError: (error: any) => {
      toast.error(error.message || 'Gagal menambahkan Bagan Akun')
    }
  })

  const updateMutation = useMutation({
    mutationFn: (data: { id: string, payload: Partial<typeof formData> }) => accountingService.updateCoa(data.id, data.payload),
    onSuccess: () => {
      toast.success('Bagan Akun berhasil diubah')
      queryClient.invalidateQueries({ queryKey: ['accounting', 'coa'] })
      setIsDialogOpen(false)
    },
    onError: (error: any) => {
      toast.error(error.message || 'Gagal mengubah Bagan Akun')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => accountingService.deleteCoa(id),
    onSuccess: () => {
      toast.success('Bagan Akun berhasil dihapus')
      queryClient.invalidateQueries({ queryKey: ['accounting', 'coa'] })
      setDeleteDialogOpen(false)
      setCoaToDelete(null)
    },
    onError: (error: any) => {
      toast.error(error.message || 'Gagal menghapus Bagan Akun')
      setDeleteDialogOpen(false)
      setCoaToDelete(null)
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validasi angka dan titik
    if (!/^[\d.]+$/.test(formData.code)) {
      toast.error('Kode Akun hanya boleh berisi angka dan titik (.).')
      return
    }

    const firstDigit = formData.code.charAt(0)
    const expectedDigitMap: Record<string, string> = {
      'ASET': '1',
      'KEWAJIBAN': '2',
      'MODAL': '3',
      'PENDAPATAN': '4',
      'HPP': '5',
      'BEBAN': '6'
    }
    
    if (firstDigit !== expectedDigitMap[formData.type]) {
      toast.error(`Kode Akun untuk ${formData.type} harus diawali dengan angka ${expectedDigitMap[formData.type]}.`)
      return
    }

    if (editingId) {
      updateMutation.mutate({ id: editingId, payload: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const handleEdit = (coa: any) => {
    setEditingId(coa.id)
    setFormData({
      code: coa.code,
      name: coa.name,
      type: coa.type,
      normal_balance: coa.normal_balance,
      is_active: coa.is_active,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    setCoaToDelete(id)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (coaToDelete) {
      deleteMutation.mutate(coaToDelete)
    }
  }

  const openCreateDialogForGroup = (type: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingId(null)
    setFormData({
      code: '',
      name: '',
      type,
      normal_balance: getNormalBalance(type),
      is_active: true,
    })
    setIsDialogOpen(true)
  }

  return (
    <div className="p-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle>Bagan Akun (Chart of Accounts)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kode Akun</TableHead>
                <TableHead>Nama Akun</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>Saldo Normal</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">Loading...</TableCell>
                </TableRow>
              ) : (
                groupOrder.map(group => {
                  const groupCoas = coaList?.filter((c: any) => c.type === group) || []
                  const isExpanded = expandedGroups[group]

                  return (
                    <Fragment key={group}>
                      <TableRow 
                        className="bg-muted/50 cursor-pointer hover:bg-muted/70 transition-colors"
                        onClick={() => toggleGroup(group)}
                      >
                        <TableCell colSpan={6} className="py-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center font-bold">
                              {isExpanded ? <ChevronDown className="w-4 h-4 mr-2" /> : <ChevronRight className="w-4 h-4 mr-2" />}
                              {groupNames[group]} ({groupCoas.length})
                            </div>
                            <button 
                              type="button"
                              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive bg-primary text-primary-foreground shadow-xs hover:bg-secondary/80 size-9 h-7 w-7"
                              onClick={(e) => openCreateDialogForGroup(group, e)}
                              title={`Tambah ${groupNames[group]}`}
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                      
                      {isExpanded && groupCoas.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-4 text-muted-foreground text-sm italic">
                            Belum ada akun di kelompok ini.
                          </TableCell>
                        </TableRow>
                      )}

                      {isExpanded && groupCoas.map((coa: any) => (
                        <TableRow key={coa.id}>
                          <TableCell className="font-medium pl-8">{coa.code}</TableCell>
                          <TableCell>{coa.name}</TableCell>
                          <TableCell>{coa.type}</TableCell>
                          <TableCell>
                            <Badge variant={coa.normal_balance === 'DEBIT' ? 'default' : 'secondary'}>
                              {coa.normal_balance}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={coa.is_active ? 'default' : 'destructive'}>
                              {coa.is_active ? 'Aktif' : 'Non-Aktif'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={(e) => { e.stopPropagation(); handleEdit(coa) }}
                                title="Ubah"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={(e) => { e.stopPropagation(); handleDelete(coa.id) }}
                                disabled={deleteMutation.isPending}
                                title="Hapus"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </Fragment>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Ubah Bagan Akun' : 'Tambah Bagan Akun'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Kode Akun</Label>
              <Input 
                value={formData.code} 
                onChange={(e) => setFormData({...formData, code: e.target.value.replace(/[^\d.]/g, '')})}
                placeholder="Hanya Angka & Titik (Misal: 101.1)"
                required 
                maxLength={20}
              />
              <p className="text-xs text-muted-foreground">Hanya boleh berisi angka dan titik (.).</p>
            </div>
            <div className="space-y-2">
              <Label>Nama Akun</Label>
              <Input 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Contoh: Kas Utama"
                required 
              />
            </div>
            {editingId && (
              <div className="space-y-2 pt-2">
                <Label>Status</Label>
                <Select value={formData.is_active ? 'true' : 'false'} onValueChange={(v) => setFormData({...formData, is_active: v === 'true'})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Aktif</SelectItem>
                    <SelectItem value="false">Non-Aktif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex justify-end pt-4">
              <Button 
                type="submit" 
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingId ? 'Simpan Perubahan' : 'Tambah Akun'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Bagan Akun?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus Bagan Akun ini? Akun yang sudah dipakai dalam Jurnal tidak bisa dihapus dan sistem akan menolaknya.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

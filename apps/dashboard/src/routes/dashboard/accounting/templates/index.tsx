import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/dashboard/components/ui/card'
import { Button } from '@/dashboard/components/ui/button'
import { Input } from '@/dashboard/components/ui/input'
import { Label } from '@/dashboard/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/dashboard/components/ui/dialog"
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
import { Plus, Trash2, Edit, Trash } from 'lucide-react'

export const Route = createFileRoute('/dashboard/accounting/templates/')({
  component: JournalTemplatesPage,
})

function JournalTemplatesPage() {
  const auth = useAuth()
  const queryClient = useQueryClient()
  const accountingService = AccountingServiceGenerator(API_URL, auth.tenant!.accessToken, auth.tenant!.id)

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<any>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    items: [{ coa_id: '', position: 'DEBIT' }, { coa_id: '', position: 'CREDIT' }]
  })

  const { data: templates, isLoading } = useQuery({
    queryKey: ['accounting', 'templates'],
    queryFn: ({ signal }) => accountingService.getJournalTemplates({ signal }),
  })

  const { data: coaList } = useQuery({
    queryKey: ['accounting', 'coa'],
    queryFn: ({ signal }) => accountingService.getCoaList({ signal }),
  })

  const createMutation = useMutation({
    mutationFn: (data: any) => accountingService.createJournalTemplate(data),
    onSuccess: () => {
      toast.success('Template berhasil ditambahkan')
      queryClient.invalidateQueries({ queryKey: ['accounting', 'templates'] })
      setIsDialogOpen(false)
    },
    onError: (error: any) => {
      toast.error(error.message || 'Gagal menambahkan template')
    }
  })

  const updateMutation = useMutation({
    mutationFn: (data: any) => accountingService.updateJournalTemplate(data.id, data.payload),
    onSuccess: () => {
      toast.success('Template berhasil diperbarui')
      queryClient.invalidateQueries({ queryKey: ['accounting', 'templates'] })
      setIsDialogOpen(false)
    },
    onError: (error: any) => {
      toast.error(error.message || 'Gagal memperbarui template')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => accountingService.deleteJournalTemplate(id),
    onSuccess: () => {
      toast.success('Template berhasil dihapus')
      queryClient.invalidateQueries({ queryKey: ['accounting', 'templates'] })
      setIsDeleteDialogOpen(false)
    },
    onError: (error: any) => {
      toast.error(error.message || 'Gagal menghapus template')
    }
  })

  const handleOpenDialog = (template?: any) => {
    if (template) {
      setEditingTemplate(template)
      setFormData({
        name: template.name,
        description: template.description || '',
        items: template.items?.length > 0 ? template.items.map((i: any) => ({ coa_id: i.coa_id || '', position: i.position })) : [{ coa_id: '', position: 'DEBIT' }, { coa_id: '', position: 'CREDIT' }]
      })
    } else {
      setEditingTemplate(null)
      setFormData({
        name: '',
        description: '',
        items: [{ coa_id: '', position: 'DEBIT' }, { coa_id: '', position: 'CREDIT' }]
      })
    }
    setIsDialogOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name) return toast.error('Nama template wajib diisi')
    
    if (editingTemplate) {
      updateMutation.mutate({ id: editingTemplate.id, payload: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const addRow = () => {
    setFormData({ ...formData, items: [...formData.items, { coa_id: '', position: 'DEBIT' }] })
  }

  const removeRow = (index: number) => {
    setFormData({ ...formData, items: formData.items.filter((_, i) => i !== index) })
  }

  const updateRow = (index: number, field: string, value: string) => {
    const newItems = [...formData.items]
    newItems[index] = { ...newItems[index], [field]: value }
    setFormData({ ...formData, items: newItems })
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Template Jurnal</h1>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          Buat Template Baru
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Template</TableHead>
                <TableHead>Deskripsi</TableHead>
                <TableHead>Struktur Jurnal</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Memuat data...</TableCell>
                </TableRow>
              ) : templates?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Belum ada template jurnal.</TableCell>
                </TableRow>
              ) : (
                templates?.map((template: any) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-semibold align-top">{template.name}</TableCell>
                    <TableCell className="align-top">{template.description || '-'}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 text-sm">
                        {template.items?.map((item: any, i: number) => (
                          <div key={i} className="flex gap-2">
                            <span className={`w-16 font-bold ${item.position === 'DEBIT' ? 'text-blue-600' : 'text-red-600'}`}>{item.position}</span>
                            <span className="text-muted-foreground">{item.coa?.code ? `${item.coa.code} - ${item.coa.name}` : '(Kas/Bank Bebas)'}</span>
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right align-top">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(template)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700" onClick={() => { setEditingTemplate(template); setIsDeleteDialogOpen(true); }}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* DIALOG FORM TEMPLATE */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-3xl w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? 'Ubah Template Jurnal' : 'Buat Template Jurnal Baru'}</DialogTitle>
            <DialogDescription>
              Buat rumus jurnal untuk mempermudah transaksi berulang. Kosongkan pilihan akun jika ingin memilih manual saat transaksi.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nama Template</Label>
                <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Misal: Bayar Listrik" required />
              </div>
              <div className="space-y-2">
                <Label>Deskripsi (Opsional)</Label>
                <Input value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Keterangan singkat" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Struktur Baris Jurnal</Label>
                <Button type="button" variant="outline" size="sm" onClick={addRow}>
                  <Plus className="w-4 h-4 mr-1" /> Tambah Baris
                </Button>
              </div>
              <div className="border rounded-md divide-y">
                {formData.items.map((item, index) => (
                  <div key={index} className="flex gap-4 p-3 items-center bg-zinc-50 dark:bg-zinc-900/50">
                    <select 
                      className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm font-bold w-32"
                      value={item.position}
                      onChange={e => updateRow(index, 'position', e.target.value)}
                    >
                      <option value="DEBIT">DEBIT</option>
                      <option value="CREDIT">KREDIT</option>
                    </select>
                    
                    <select 
                      className="h-9 flex-1 rounded-md border border-input bg-background px-3 py-1 text-sm"
                      value={item.coa_id}
                      onChange={e => updateRow(index, 'coa_id', e.target.value)}
                    >
                      <option value="">-- Bebas Pilih Saat Transaksi --</option>
                      {coaList?.map((coa: any) => (
                        <option key={coa.id} value={coa.id}>{coa.code} - {coa.name}</option>
                      ))}
                    </select>
                    
                    <Button type="button" variant="ghost" size="icon" className="text-red-500 flex-shrink-0" onClick={() => removeRow(index)}>
                      <Trash className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Batal</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                Simpan Template
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Template?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus template ini?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate(editingTemplate?.id)} className="bg-red-600 hover:bg-red-700">Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

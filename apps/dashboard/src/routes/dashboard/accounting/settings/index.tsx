import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2, Plus, Trash2, Edit } from 'lucide-react'
import { Button } from '@/dashboard/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/dashboard/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/dashboard/components/ui/dialog'
import { Input } from '@/dashboard/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/dashboard/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/dashboard/components/ui/table'
import { API_URL } from '@/dashboard/constants/api-url.cont'
import { useGlobalAlertDialog } from '@/dashboard/context-providers/alert-dialog.provider'
import { useAuth } from '@/dashboard/context-providers/auth.provider'
import { AccountingServiceGenerator } from '@/dashboard/services/accounting.service'

export const Route = createFileRoute('/dashboard/accounting/settings/')({
  component: RouteComponent,
})

function RouteComponent() {
  const auth = useAuth()
  const queryClient = useQueryClient()
  const { showAlertDialog, hideAlertDialog } = useGlobalAlertDialog()
  
  const accountingService = AccountingServiceGenerator(
    API_URL,
    auth.tenant!.accessToken,
    auth.tenant!.id,
  )

  const { data: coaList } = useQuery({
    queryKey: ['coaList', auth.tenant!.id],
    queryFn: () => accountingService.getCoaList(),
  })

  const { data: settings, isLoading } = useQuery({
    queryKey: ['platformSettings', auth.tenant!.id],
    queryFn: () => accountingService.getPlatformSettings(),
  })

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    platform: '',
    asset_coa_id: '',
    expense_coa_id: '',
    fee_type: 'FIXED',
    fee_amount: 0,
  })

  const createMutation = useMutation({
    mutationFn: (data: any) => accountingService.createPlatformSetting(data),
    onSuccess: () => {
      toast.success('Pengaturan platform berhasil ditambahkan')
      queryClient.invalidateQueries({ queryKey: ['platformSettings'] })
      setIsModalOpen(false)
      setFormData({ platform: '', asset_coa_id: '', expense_coa_id: '' })
    },
    onError: (error: any) => {
      toast.error(error.message || 'Gagal menambahkan pengaturan')
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: any) => accountingService.updatePlatformSetting(editId!, data),
    onSuccess: () => {
      toast.success('Pengaturan platform berhasil diperbarui')
      queryClient.invalidateQueries({ queryKey: ['platformSettings'] })
      setIsModalOpen(false)
      setEditId(null)
      setFormData({ platform: '', asset_coa_id: '', expense_coa_id: '', fee_type: 'FIXED', fee_amount: 0 })
    },
    onError: (error: any) => {
      toast.error(error.message || 'Gagal memperbarui pengaturan')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => accountingService.deletePlatformSetting(id),
    onSuccess: () => {
      toast.success('Pengaturan platform berhasil dihapus')
      queryClient.invalidateQueries({ queryKey: ['platformSettings'] })
    },
    onError: (error: any) => {
      toast.error(error.message || 'Gagal menghapus pengaturan')
    },
  })

  const handleDelete = (id: string, platform: string) => {
    showAlertDialog({
      title: 'Hapus Pengaturan',
      description: `Apakah Anda yakin ingin menghapus pemetaan akun untuk platform ${platform}?`,
      onConfirm: () => {
        deleteMutation.mutate(id)
        hideAlertDialog()
      },
      onCancel: hideAlertDialog,
    })
  }

  const handleEdit = (setting: any) => {
    setEditId(setting.id)
    setFormData({
      platform: setting.platform,
      asset_coa_id: setting.asset_coa_id,
      expense_coa_id: setting.expense_coa_id,
      fee_type: setting.fee_type || 'FIXED',
      fee_amount: setting.fee_amount || 0,
    })
    setIsModalOpen(true)
  }

  const handleAddNew = () => {
    setEditId(null)
    setFormData({ platform: '', asset_coa_id: '', expense_coa_id: '', fee_type: 'FIXED', fee_amount: 0 })
    setIsModalOpen(true)
  }

  const assetCoas = coaList?.filter((c: any) => c.type === 'ASET') || []
  const expenseCoas = coaList?.filter((c: any) => c.type === 'BEBAN') || []

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Pemetaan Akun Platform (Auto-Journal)</CardTitle>
            <CardDescription>
              Atur akun tujuan penerimaan dana dan akun beban untuk setiap platform (misal: SHOPEE, WEB).
            </CardDescription>
          </div>
          <Button onClick={handleAddNew}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Platform
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Platform</TableHead>
                <TableHead>Akun Kas / Bank (Debit)</TableHead>
                <TableHead>Akun Biaya Admin (Debit)</TableHead>
                <TableHead>Besaran Biaya Admin</TableHead>
                <TableHead className="w-[100px]">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6">
                    <Loader2 className="animate-spin h-6 w-6 mx-auto" />
                  </TableCell>
                </TableRow>
              ) : settings?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                    Belum ada pemetaan platform.
                  </TableCell>
                </TableRow>
              ) : (
                settings?.map((s: any) => {
                  const assetCoa = coaList?.find((c: any) => c.id === s.asset_coa_id)
                  const expenseCoa = coaList?.find((c: any) => c.id === s.expense_coa_id)
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.platform}</TableCell>
                      <TableCell>{assetCoa ? `${assetCoa.code} - ${assetCoa.name}` : '-'}</TableCell>
                      <TableCell>{expenseCoa ? `${expenseCoa.code} - ${expenseCoa.name}` : '-'}</TableCell>
                      <TableCell>
                        {s.fee_amount > 0 
                          ? (s.fee_type === 'PERCENTAGE' ? `${s.fee_amount}%` : `Rp ${s.fee_amount.toLocaleString('id-ID')}`) 
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(s)}
                          >
                            <Edit className="h-4 w-4 text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(s.id, s.platform)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editId ? 'Edit Pemetaan Platform' : 'Tambah Pemetaan Platform'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label>Nama Platform (Contoh: SHOPEE, MANUAL, LANDING_PAGE)</label>
              <Input
                value={formData.platform}
                onChange={(e) => setFormData({ ...formData, platform: e.target.value.toUpperCase() })}
                placeholder="NAMA PLATFORM"
              />
            </div>
            <div className="grid gap-2">
              <label>Akun Penerimaan Kas/Bank</label>
              <Select
                value={formData.asset_coa_id}
                onValueChange={(val) => setFormData({ ...formData, asset_coa_id: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih akun aset" />
                </SelectTrigger>
                <SelectContent>
                  {assetCoas.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.code} - {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <label>Akun Beban Biaya Admin Platform</label>
              <Select
                value={formData.expense_coa_id}
                onValueChange={(val) => setFormData({ ...formData, expense_coa_id: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih akun beban" />
                </SelectTrigger>
                <SelectContent>
                  {expenseCoas.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.code} - {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label>Tipe Biaya Admin</label>
                <Select
                  value={formData.fee_type}
                  onValueChange={(val) => setFormData({ ...formData, fee_type: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Tipe Biaya" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FIXED">Nominal Pasti (Rp)</SelectItem>
                    <SelectItem value="PERCENTAGE">Persentase (%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <label>Besaran Biaya</label>
                <Input
                  type="number"
                  step="any"
                  value={formData.fee_amount}
                  onChange={(e) => setFormData({ ...formData, fee_amount: Number(e.target.value) })}
                  placeholder="0"
                />
              </div>
            </div>

            <Button
              className="mt-4"
              disabled={!formData.platform || !formData.asset_coa_id || !formData.expense_coa_id || createMutation.isPending || updateMutation.isPending}
              onClick={() => editId ? updateMutation.mutate(formData) : createMutation.mutate(formData)}
            >
              {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

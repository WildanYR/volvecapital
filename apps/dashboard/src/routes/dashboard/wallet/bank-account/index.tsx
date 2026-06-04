import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { CheckCircle2, Loader2, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { PermissionGate } from '@/dashboard/components/permission-gate'
import { Badge } from '@/dashboard/components/ui/badge'
import { Button } from '@/dashboard/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/dashboard/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/dashboard/components/ui/dialog'
import { Input } from '@/dashboard/components/ui/input'
import { Label } from '@/dashboard/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/dashboard/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/dashboard/components/ui/table'
import { API_URL } from '@/dashboard/constants/api-url.cont'
import { useAuth } from '@/dashboard/context-providers/auth.provider'
import { BankAccountServiceGenerator } from '@/dashboard/services/bank-account.service'

export const Route = createFileRoute('/dashboard/wallet/bank-account/')({
  component: BankAccountPage,
})

const bankOptions = [
  { value: 'BCA', label: 'BCA' },
  { value: 'BNI', label: 'BNI' },
  { value: 'BRI', label: 'BRI' },
  { value: 'MANDIRI', label: 'Mandiri' },
  { value: 'BSI', label: 'BSI' },
  { value: 'PERMATA', label: 'Permata' },
  { value: 'CIMB', label: 'CIMB Niaga' },
  { value: 'SEABANK', label: 'SeaBank' },
  { value: 'JAGO', label: 'Bank Jago' },
  { value: 'DANAMON', label: 'Danamon' },
]

function BankAccountPage() {
  const auth = useAuth()
  const queryClient = useQueryClient()
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [step, setStep] = useState<'FORM' | 'OTP'>('FORM')

  const bankAccountService = BankAccountServiceGenerator(
    API_URL,
    auth.tenant!.accessToken,
    auth.tenant!.id,
  )

  // Form State
  const [bankName, setBankName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [accountHolder, setAccountHolder] = useState('')
  const [newAccountId, setNewAccountId] = useState('')
  const [otpCode, setOtpCode] = useState('')

  const { data: accounts, isLoading } = useQuery({
    queryKey: ['bankAccounts'],
    queryFn: () => bankAccountService.getBankAccounts(),
  })

  const addMutation = useMutation({
    mutationFn: bankAccountService.addBankAccount,
    onSuccess: (res) => {
      setNewAccountId(res.id)
      setStep('OTP')
      toast.success('OTP telah dikirim ke email Anda')
    },
    onError: (err: any) => {
      toast.error(err.message || 'Gagal menambahkan rekening')
    },
  })

  const verifyMutation = useMutation({
    mutationFn: ({ id, otp }: { id: string, otp: string }) => bankAccountService.verifyOtp(id, otp),
    onSuccess: () => {
      toast.success('Rekening berhasil diverifikasi')
      queryClient.invalidateQueries({ queryKey: ['bankAccounts'] })
      setIsAddOpen(false)
      resetForm()
    },
    onError: (err: any) => {
      toast.error(err.message || 'OTP salah atau kadaluarsa')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: bankAccountService.deleteBankAccount,
    onSuccess: () => {
      toast.success('Rekening dihapus')
      queryClient.invalidateQueries({ queryKey: ['bankAccounts'] })
    },
    onError: (err: any) => {
      toast.error(err.message || 'Gagal menghapus rekening')
    },
  })

  const resetForm = () => {
    setBankName('')
    setAccountNumber('')
    setAccountHolder('')
    setOtpCode('')
    setNewAccountId('')
    setStep('FORM')
  }

  const handleOpenChange = (open: boolean) => {
    setIsAddOpen(open)
    if (!open)
      resetForm()
  }

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!bankName || !accountNumber || !accountHolder) {
      toast.error('Harap isi semua field')
      return
    }
    addMutation.mutate({
      bank_name: bankName,
      account_number: accountNumber,
      account_holder: accountHolder,
    })
  }

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (otpCode.length !== 6) {
      toast.error('OTP harus 6 digit')
      return
    }
    verifyMutation.mutate({ id: newAccountId, otp: otpCode })
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">Rekening Bank</h2>
          <p className="text-muted-foreground">
            Kelola rekening bank Anda untuk keperluan penarikan dana.
          </p>
        </div>
        <PermissionGate permission="wallet.edit">
          <Button onClick={() => setIsAddOpen(true)}>
            <Plus className="mr-2 size-4" />
            Tambah Rekening
          </Button>
        </PermissionGate>
      </div>

      <Card className="border-primary/50 bg-primary/5">
        <CardHeader>
          <CardTitle>Daftar Rekening Tersimpan</CardTitle>
          <CardDescription>Hanya rekening dengan status Terverifikasi yang dapat digunakan untuk penarikan.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-primary/20 hover:bg-transparent">
                <TableHead className="text-primary">Bank</TableHead>
                <TableHead className="text-primary">No. Rekening</TableHead>
                <TableHead className="text-primary">Atas Nama</TableHead>
                <TableHead className="text-primary">Status</TableHead>
                <TableHead className="text-primary text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <Loader2 className="size-6 animate-spin mx-auto text-primary" />
                      </TableCell>
                    </TableRow>
                  )
                : accounts?.length === 0
                  ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          Belum ada rekening tersimpan. Silakan tambah rekening baru.
                        </TableCell>
                      </TableRow>
                    )
                  : (
                      accounts?.map(acc => (
                        <TableRow key={acc.id} className="border-primary/20 hover:bg-primary/10">
                          <TableCell className="font-medium">{acc.bank_name}</TableCell>
                          <TableCell>{acc.account_number}</TableCell>
                          <TableCell>{acc.account_holder}</TableCell>
                          <TableCell>
                            {acc.is_verified
                              ? (
                                  <Badge variant="outline" className="border-green-500 text-green-500 bg-green-500/10">
                                    <CheckCircle2 className="mr-1 size-3" />
                                    {' '}
                                    Terverifikasi
                                  </Badge>
                                )
                              : (
                                  <Badge variant="outline" className="border-yellow-500 text-yellow-500 bg-yellow-500/10">
                                    Pending OTP
                                  </Badge>
                                )}
                          </TableCell>
                          <TableCell className="text-right">
                            <PermissionGate permission="wallet.edit">
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  if (confirm('Hapus rekening ini?'))
                                    deleteMutation.mutate(acc.id)
                                }}
                                disabled={deleteMutation.isPending}
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </PermissionGate>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isAddOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[425px] bg-background border-primary/50">
          <DialogHeader>
            <DialogTitle className="text-primary">
              {step === 'FORM' ? 'Tambah Rekening' : 'Verifikasi OTP'}
            </DialogTitle>
            <DialogDescription>
              {step === 'FORM'
                ? 'Pilih bank dan masukkan detail rekening Anda.'
                : 'Cek email Anda untuk kode OTP 6 digit yang baru saja dikirimkan.'}
            </DialogDescription>
          </DialogHeader>

          {step === 'FORM'
            ? (
                <form onSubmit={handleAddSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="bankName">Bank Tujuan</Label>
                    <Select value={bankName} onValueChange={setBankName}>
                      <SelectTrigger className="border-primary/50">
                        <SelectValue placeholder="Pilih Bank" />
                      </SelectTrigger>
                      <SelectContent>
                        {bankOptions.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accountNumber">Nomor Rekening</Label>
                    <Input
                      id="accountNumber"
                      value={accountNumber}
                      onChange={e => setAccountNumber(e.target.value)}
                      placeholder="Misal: 1234567890"
                      className="border-primary/50"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accountHolder">Nama Pemilik Rekening</Label>
                    <Input
                      id="accountHolder"
                      value={accountHolder}
                      onChange={e => setAccountHolder(e.target.value)}
                      placeholder="Sesuai buku tabungan"
                      className="border-primary/50"
                      required
                    />
                  </div>
                  <div className="pt-4 flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                      Batal
                    </Button>
                    <Button type="submit" disabled={addMutation.isPending}>
                      {addMutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                      Selanjutnya
                    </Button>
                  </div>
                </form>
              )
            : (
                <form onSubmit={handleOtpSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="otpCode">Kode OTP</Label>
                    <Input
                      id="otpCode"
                      value={otpCode}
                      onChange={e => setOtpCode(e.target.value)}
                      placeholder="6 Digit OTP"
                      className="border-primary/50 text-center tracking-widest text-xl"
                      maxLength={6}
                      required
                    />
                  </div>
                  <div className="pt-4 flex justify-end gap-2">
                    <Button type="submit" className="w-full" disabled={verifyMutation.isPending}>
                      {verifyMutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                      Verifikasi Rekening
                    </Button>
                  </div>
                </form>
              )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

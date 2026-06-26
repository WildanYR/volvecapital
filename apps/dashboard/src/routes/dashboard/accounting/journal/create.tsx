import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { API_URL } from '@/dashboard/constants/api-url.cont'
import { useAuth } from '@/dashboard/context-providers/auth.provider'
import { AccountingServiceGenerator } from '@/dashboard/services/accounting.service'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/dashboard/components/ui/card'
import { Input } from '@/dashboard/components/ui/input'
import { Button } from '@/dashboard/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/dashboard/components/ui/select'
import { Plus, Trash } from 'lucide-react'
import { toast } from 'sonner'
import { Label } from '@/dashboard/components/ui/label'

export const Route = createFileRoute('/dashboard/accounting/journal/create')({
  component: CreateJournal,
})

function CreateJournal() {
  const navigate = useNavigate()
  const auth = useAuth()
  const accountingService = AccountingServiceGenerator(API_URL, auth.tenant!.accessToken, auth.tenant!.id)
  
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [reference, setReference] = useState('')
  const [description, setDescription] = useState('')
  const [lines, setLines] = useState([
    { id: 1, coa_code: '', debit: 0, credit: 0, memo: '' },
    { id: 2, coa_code: '', debit: 0, credit: 0, memo: '' },
  ])

  const { data: coaList } = useQuery({
    queryKey: ['accounting', 'coa'],
    queryFn: ({ signal }) => accountingService.getCoaList({ signal }),
  })

  const createMutation = useMutation({
    mutationFn: (data: any) => accountingService.createJournalEntry(data),
    onSuccess: () => {
      toast.success('Jurnal berhasil disimpan')
      navigate({ to: '/dashboard/accounting/journal' })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Gagal menyimpan jurnal')
    }
  })

  const handleAddLine = () => {
    setLines([...lines, { id: Date.now(), coa_code: '', debit: 0, credit: 0, memo: '' }])
  }

  const handleRemoveLine = (id: number) => {
    setLines(lines.filter(l => l.id !== id))
  }

  const handleLineChange = (id: number, field: string, value: any) => {
    setLines(lines.map(l => l.id === id ? { ...l, [field]: value } : l))
  }

  const totalDebit = lines.reduce((acc, l) => acc + (Number(l.debit) || 0), 0)
  const totalCredit = lines.reduce((acc, l) => acc + (Number(l.credit) || 0), 0)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const formattedLines = lines.map(l => ({
      coa_code: l.coa_code,
      debit: Number(l.debit) || 0,
      credit: Number(l.credit) || 0,
      memo: l.memo
    })).filter(l => l.coa_code)

    if (formattedLines.length === 0) {
      toast.error('Minimal harus ada 1 baris jurnal yang valid')
      return
    }

    if (totalDebit !== totalCredit) {
      toast.error(`Jurnal tidak balance! Debit: ${totalDebit}, Kredit: ${totalCredit}`)
      return
    }

    createMutation.mutate({
      date,
      reference,
      description,
      source: 'MANUAL',
      lines: formattedLines
    })
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Buat Jurnal Manual</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tanggal Transaksi</Label>
                <Input type="date" value={date} onChange={e => setDate(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Nomor Referensi (Opsional)</Label>
                <Input placeholder="INV-001" value={reference} onChange={e => setReference(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Deskripsi</Label>
              <Input placeholder="Bayar listrik bulan ini" value={description} onChange={e => setDescription(e.target.value)} required />
            </div>

            <div className="mt-8">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-lg">Detail Jurnal</h3>
                <Button type="button" variant="outline" size="sm" onClick={handleAddLine}>
                  <Plus className="w-4 h-4 mr-2" /> Tambah Baris
                </Button>
              </div>

              <div className="border rounded-md">
                <div className="grid grid-cols-12 gap-2 p-3 bg-muted font-medium text-sm border-b">
                  <div className="col-span-4">Akun (COA)</div>
                  <div className="col-span-3">Debit</div>
                  <div className="col-span-3">Kredit</div>
                  <div className="col-span-2"></div>
                </div>
                <div className="p-3 space-y-3">
                  {lines.map((line) => (
                    <div key={line.id} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-4">
                        <Select value={line.coa_code} onValueChange={(val) => handleLineChange(line.id, 'coa_code', val)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih Akun" />
                          </SelectTrigger>
                          <SelectContent>
                            {coaList?.map((coa: any) => (
                              <SelectItem key={coa.id} value={coa.code}>
                                {coa.code} - {coa.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-3">
                        <Input 
                          type="number" 
                          value={line.debit || ''} 
                          onChange={(e) => handleLineChange(line.id, 'debit', e.target.value)} 
                          placeholder="0"
                        />
                      </div>
                      <div className="col-span-3">
                        <Input 
                          type="number" 
                          value={line.credit || ''} 
                          onChange={(e) => handleLineChange(line.id, 'credit', e.target.value)}
                          placeholder="0" 
                        />
                      </div>
                      <div className="col-span-2 text-center">
                        <Button type="button" variant="ghost" size="icon" className="text-red-500" onClick={() => handleRemoveLine(line.id)}>
                          <Trash className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-12 gap-2 p-3 bg-muted font-medium text-sm border-t">
                  <div className="col-span-4 text-right pr-4">Total</div>
                  <div className={`col-span-3 ${totalDebit !== totalCredit ? 'text-red-500' : 'text-green-600'}`}>
                    {totalDebit.toLocaleString()}
                  </div>
                  <div className={`col-span-3 ${totalDebit !== totalCredit ? 'text-red-500' : 'text-green-600'}`}>
                    {totalCredit.toLocaleString()}
                  </div>
                  <div className="col-span-2"></div>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => navigate({ to: '/dashboard/accounting/journal' })}>
              Batal
            </Button>
            <Button type="submit" disabled={createMutation.isPending || totalDebit !== totalCredit || totalDebit === 0}>
              {createMutation.isPending ? 'Menyimpan...' : 'Simpan Jurnal'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

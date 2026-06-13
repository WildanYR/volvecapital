import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/dashboard/components/ui/button'
import { Input } from '@/dashboard/components/ui/input'
import { Label as UILabel } from '@/dashboard/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/dashboard/components/ui/dialog'
import { Plus, Trash2, Tag } from 'lucide-react'
import { toast } from 'sonner'
import { LabelServiceGenerator } from '@/dashboard/services/label.service'
import { API_URL } from '@/dashboard/constants/api-url.cont'
import { useAuth } from '@/dashboard/context-providers/auth.provider'

interface AccountLabelManagerProps {
  productVariantId: string
  productVariantName: string
}

export function AccountLabelManager({ productVariantId, productVariantName }: AccountLabelManagerProps) {
  const [open, setOpen] = useState(false)
  const [newLabelName, setNewLabelName] = useState('')
  const [newLabelColor, setNewLabelColor] = useState('#3b82f6') // default blue
  const queryClient = useQueryClient()
  const auth = useAuth()
  
  const labelService = LabelServiceGenerator(
    API_URL,
    auth.tenant!.accessToken,
    auth.tenant!.id,
  )

  const { data: labels, isLoading } = useQuery({
    queryKey: ['labels', productVariantId],
    queryFn: () => labelService.findAll(productVariantId),
    enabled: open && !!productVariantId,
  })

  const createMutation = useMutation({
    mutationFn: (data: { name: string, color: string }) =>
      labelService.create({ name: data.name, color: data.color, product_variant_id: productVariantId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labels', productVariantId] })
      setNewLabelName('')
      toast.success('Label berhasil dibuat')
    },
    onError: (error: any) => {
      toast.error(`Gagal membuat label: ${error.message}`)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => labelService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labels', productVariantId] })
      toast.success('Label berhasil dihapus')
    },
    onError: (error: any) => {
      toast.error(`Gagal menghapus label: ${error.message}`)
    },
  })

  const handleCreate = () => {
    if (!newLabelName.trim()) return
    createMutation.mutate({ name: newLabelName.trim(), color: newLabelColor })
  }

  const presetColors = [
    '#ef4444', '#f97316', '#eab308', '#22c55e', 
    '#3b82f6', '#8b5cf6', '#ec4899', '#64748b'
  ]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 cursor-pointer">
          <Tag className="size-4" />
          Kelola Label
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Kelola Label ({productVariantName})</DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 items-end mt-4">
          <div className="grid w-full items-center gap-1.5">
            <UILabel htmlFor="labelName">Nama Label Baru</UILabel>
            <Input
              id="labelName"
              placeholder="Contoh: Something went wrong"
              value={newLabelName}
              onChange={(e) => setNewLabelName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleCreate()
                }
              }}
            />
            
            <div className="mt-2">
              <UILabel className="text-xs text-muted-foreground mb-1.5 block">Warna Label</UILabel>
              <div className="flex gap-2">
                {presetColors.map((c) => (
                  <button
                    key={c}
                    onClick={() => setNewLabelColor(c)}
                    className={`w-6 h-6 rounded-full transition-all ${newLabelColor === c ? 'ring-2 ring-offset-2 ring-offset-background' : 'hover:scale-110'}`}
                    style={{ backgroundColor: c, borderColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>
          <Button 
            onClick={handleCreate} 
            disabled={!newLabelName.trim() || createMutation.isPending}
          >
            {createMutation.isPending ? 'Menyimpan...' : 'Buat'}
          </Button>
        </div>

        <div className="mt-6 space-y-2">
          <UILabel>Label Tersedia</UILabel>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Memuat label...</p>
          ) : labels?.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">Belum ada label untuk varian ini.</p>
          ) : (
            <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto p-1">
              {labels?.map((label) => (
                <div
                  key={label.id}
                  className="flex items-center gap-2 border px-3 py-1 rounded-full text-sm"
                  style={{ 
                    backgroundColor: label.color ? `${label.color}20` : 'rgba(255,255,255,0.1)',
                    borderColor: label.color || 'var(--border)',
                    color: label.color || 'inherit'
                  }}
                >
                  <span className="font-medium">{label.name}</span>
                  <button
                    onClick={() => deleteMutation.mutate(label.id)}
                    className="text-muted-foreground hover:text-red-500 transition-colors"
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="size-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { Button } from '@/dashboard/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/dashboard/components/ui/dialog'
import { Input } from '@/dashboard/components/ui/input'
import { Label } from '@/dashboard/components/ui/label'
import { useAuth } from '@/dashboard/context-providers/auth.provider'
import { ShopServiceGenerator } from '@/dashboard/services/shop.service'
import { API_URL } from '@/dashboard/constants/api-url.cont'

export function CreateShopDialog() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [platform, setPlatform] = useState('Shopee')
  const auth = useAuth()
  const queryClient = useQueryClient()
  
  const shopService = ShopServiceGenerator(
    API_URL,
    auth.tenant!.accessToken,
    auth.tenant!.id,
  )

  const createMutation = useMutation({
    mutationFn: () => shopService.createShop({ name, platform }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shops'] })
      toast.success('Toko berhasil ditambahkan.')
      setOpen(false)
      setName('')
    },
    onError: (error) => {
      toast.error(`Gagal menambahkan toko: ${error.message}`)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name) return
    createMutation.mutate()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Plus className="size-4" />
          Tambah Toko
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tambah Toko Baru</DialogTitle>
          <DialogDescription>
            Masukkan nama identitas toko baru. Pastikan sesuai dengan nama (instance id) di konfigurasi bot (config.toml) jika toko ini dijalankan oleh bot.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Toko (config.toml name)</Label>
            <Input
              id="name"
              placeholder="Contoh: digital_premium"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="platform">Platform</Label>
            <Input
              id="platform"
              placeholder="Contoh: Shopee"
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              required
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Batal
            </Button>
            <Button type="submit" disabled={createMutation.isPending || !name}>
              Simpan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

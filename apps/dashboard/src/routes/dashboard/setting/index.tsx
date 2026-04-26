import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { House, Loader2, Save } from 'lucide-react'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@/dashboard/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/dashboard/components/ui/card'
import { Input } from '@/dashboard/components/ui/input'
import { Label } from '@/dashboard/components/ui/label'
import { API_URL } from '@/dashboard/constants/api-url.cont'
import { useAuth } from '@/dashboard/context-providers/auth.provider'
import { SettingServiceGenerator } from '@/dashboard/services/setting.service'

export const Route = createFileRoute('/dashboard/setting/')({
  component: RouteComponent,
})

function RouteComponent() {
  const auth = useAuth()
  const queryClient = useQueryClient()
  const settingService = SettingServiceGenerator(
    API_URL,
    auth.tenant!.accessToken,
    auth.tenant!.id,
  )

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingService.getSettings(),
  })

  const [whatsappNumber, setWhatsappNumber] = useState('')
  const [buyerPortalLimit, setBuyerPortalLimit] = useState('10')

  useEffect(() => {
    if (settings) {
      setWhatsappNumber(settings.whatsapp_number || '')
      setBuyerPortalLimit(settings.BUYER_PORTAL_DAILY_LIMIT || '10')
    }
  }, [settings])

  const updateMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      settingService.updateSetting(key, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
      toast.success('Pengaturan berhasil disimpan.')
    },
    onError: (error) => {
      toast.error(`Gagal menyimpan pengaturan: ${error.message}`)
    },
  })

  const handleSaveWhatsapp = (e: React.FormEvent) => {
    e.preventDefault()
    updateMutation.mutate({ key: 'whatsapp_number', value: whatsappNumber })
  }

  const handleSavePortalLimit = (e: React.FormEvent) => {
    e.preventDefault()
    updateMutation.mutate({ key: 'BUYER_PORTAL_DAILY_LIMIT', value: buyerPortalLimit })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 max-w-4xl">
      <div className="flex items-center gap-2">
        <House className="size-6 text-primary" />
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight">Pengaturan Aplikasi</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Buyer Portal</CardTitle>
          <CardDescription>Atur konfigurasi portal email buyer, termasuk batasan akses OTP per hari.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSavePortalLimit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="portal_limit">Batas Refresh OTP Harian per Akun (Kali/Hari)</Label>
              <div className="flex gap-4">
                <Input
                  id="portal_limit"
                  type="number"
                  placeholder="10"
                  value={buyerPortalLimit}
                  onChange={(e) => setBuyerPortalLimit(e.target.value)}
                  className="max-w-md"
                />
              </div>
              <p className="text-xs text-muted-foreground">Batas maksimal seorang buyer me-refresh atau melihat email baru dalam satu hari.</p>
            </div>

            <Button disabled={updateMutation.isPending} type="submit" variant="secondary">
              {updateMutation.isPending ? (
                <Loader2 className="size-4 animate-spin mr-2" />
              ) : (
                <Save className="size-4 mr-2" />
              )}
              Simpan Batas Akses
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Kontak & WhatsApp</CardTitle>
          <CardDescription>Atur nomor WhatsApp yang akan muncul sebagai tombol floating di landing page.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveWhatsapp} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="whatsapp">Nomor WhatsApp (Tanpa + atau 0 di depan, gunakan kode negara: 62812xxx)</Label>
              <div className="flex gap-4">
                <Input
                  id="whatsapp"
                  placeholder="6285189307255"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value.replace(/[^0-9]/g, ''))}
                  className="max-w-md"
                />
              </div>
              <p className="text-xs text-muted-foreground">Nomor ini akan digunakan untuk link WhatsApp otomatis.</p>
            </div>

            <Button disabled={updateMutation.isPending} type="submit">
              {updateMutation.isPending ? (
                <Loader2 className="size-4 animate-spin mr-2" />
              ) : (
                <Save className="size-4 mr-2" />
              )}
              Simpan Perubahan
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
